import { tokenStore } from "./auth-store";
import { isJson, serverStatus, SLOW_REQUEST_MS } from "./server-status";
import { readSSE } from "./sse";
import type {
  AskMode,
  ChatModel,
  ChatResponse,
  ChatStats,
  ChatStreamEvent,
  Conversation,
  ConversationDetail,
  DocFlowDocument,
  DocumentAnswer,
  DocumentProcessingResponse,
  DocumentStatus,
  FileDeleteResponse,
  HealthResponse,
  ImageAnswer,
  MessageResponse,
  ModelsResponse,
  PaginatedConversations,
  PaginatedDocuments,
  PaginatedFiles,
  ProcessingJob,
  ProcessingRequest,
  ProcessingResult,
  ProcessingStatusResponse,
  ProcessingType,
  StoredDocument,
  StreamChatRequest,
  Token,
  Transcription,
  User,
  UserStats,
} from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

serverStatus.configure(`${API_URL}/health`);

/**
 * - `network`: no response at all (offline, or the server is asleep).
 * - `starting`: the host answered for the app with a gateway error (502/503/504) while it boots.
 * - `http`: the app answered with an error.
 */
export type ApiErrorKind = "network" | "starting" | "http";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public kind: ApiErrorKind = "http",
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** The server isn't up yet; the request is worth retrying in a moment. */
  get isTransient() {
    return this.kind !== "http";
  }
}

let onUnauthorized: (() => void) | null = null;

/** Registered by the auth provider so an expired token signs the user out. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

const NETWORK_MESSAGE =
  "Can't reach DocFlow. Check your connection; if it's fine, the server may still be waking up, so try again in a minute.";
const STARTING_MESSAGE = "DocFlow is still starting up after a quiet spell. Please try again in a minute.";

// FastAPI's default texts, which say nothing useful to a person.
const GENERIC_DETAIL = /^(not found|internal server error|bad request|forbidden|unauthorized|method not allowed)$/i;

const STATUS_MESSAGES: Record<number, string> = {
  400: "That request wasn't valid. Please check and try again.",
  401: "Your session has ended. Please sign in again.",
  403: "You don't have access to this.",
  404: "We couldn't find that. It may have been moved or deleted.",
  408: "The request took too long. Please try again.",
  409: "That conflicts with something that already exists.",
  413: "That file is too large to upload.",
  415: "That file type isn't supported. Use a PDF, DOCX, JPEG, PNG or TIFF.",
  500: "Something went wrong on our side. Please try again in a moment.",
};

function fieldName(loc: unknown[] | undefined) {
  const field = loc?.filter((l) => l !== "body" && l !== "query" && l !== "path").join(" ");
  return field ? field.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "";
}

function retryAfter(response: Response) {
  const seconds = Number(response.headers.get("retry-after"));
  if (!seconds) return "Too many requests. Please wait a moment and try again.";
  return seconds < 90
    ? `Too many requests. Try again in ${Math.ceil(seconds)} seconds.`
    : `Too many requests. Try again in about ${Math.ceil(seconds / 60)} minutes.`;
}

/** Turns an error response into an `ApiError` with a message a person can act on. */
async function toApiError(response: Response): Promise<ApiError> {
  const { status } = response;
  if (!isJson(response) && (status === 502 || status === 503 || status === 504)) {
    return new ApiError(status, STARTING_MESSAGE, "starting");
  }

  // FastAPI returns `{detail: string}` or, for validation errors, `{detail: [{msg, loc}]}`.
  let detail: string | null = null;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") detail = body.detail;
    else if (Array.isArray(body?.detail) && body.detail.length > 0) {
      detail = body.detail
        .map((d: { msg?: string; loc?: unknown[] }) => {
          const msg = (d.msg ?? "is invalid").replace(/^Value error, /, "");
          const field = fieldName(d.loc);
          return field ? `${field}: ${msg}` : msg;
        })
        .join(" · ");
    }
  } catch {}

  if (status === 429) return new ApiError(status, detail && !/too many/i.test(detail) ? detail : retryAfter(response));
  if (status >= 500 && status !== 503) return new ApiError(status, STATUS_MESSAGES[500]);
  if (detail && !GENERIC_DETAIL.test(detail)) return new ApiError(status, detail);
  return new ApiError(status, STATUS_MESSAGES[status] ?? `Something went wrong (error ${status}). Please try again.`);
}

type RequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  form?: URLSearchParams | FormData;
  auth?: boolean;
  /** The endpoint does real work before answering (an LLM call), so a long wait isn't a sleeping server. */
  slow?: boolean;
};

async function send(path: string, options: RequestOptions = {}) {
  const { json, form, auth = true, slow: expectSlow = false, headers, ...init } = options;
  const finalHeaders = new Headers(headers);
  let body: BodyInit | undefined;

  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }

  const token = auth ? tokenStore.get() : null;
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

  // A sleeping server holds the request open while it boots; say so instead of spinning silently.
  const slow = expectSlow ? undefined : setTimeout(() => serverStatus.unreachable(), SLOW_REQUEST_MS);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers: finalHeaders, body });
  } catch (error) {
    // Let callers tell a deliberate stop apart from a network failure.
    if (init.signal?.aborted) throw error;
    serverStatus.unreachable();
    throw new ApiError(0, NETWORK_MESSAGE, "network");
  } finally {
    clearTimeout(slow);
  }

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.();
    const error = await toApiError(response);
    if (error.isTransient) serverStatus.unreachable();
    else serverStatus.reachable();
    throw error;
  }
  serverStatus.reachable();
  return response;
}

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await send(path, options);
  return response.json() as Promise<T>;
}

function query(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : "";
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function uploadForm<T>(path: string, form: FormData, onProgress?: (fraction: number) => void) {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${path}`);
    const token = tokenStore.get();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onerror = () => {
      serverStatus.unreachable();
      reject(new ApiError(0, NETWORK_MESSAGE, "network"));
    };
    xhr.onload = async () => {
      const response = new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: {
          "content-type": xhr.getResponseHeader("content-type") ?? "",
          "retry-after": xhr.getResponseHeader("retry-after") ?? "",
        },
      });
      if (xhr.status >= 200 && xhr.status < 300) {
        serverStatus.reachable();
        resolve(await response.json());
        return;
      }
      if (xhr.status === 401 && token) onUnauthorized?.();
      const error = await toApiError(response);
      if (error.isTransient) serverStatus.unreachable();
      else serverStatus.reachable();
      reject(error);
    };
    xhr.send(form);
  });
}

function fileForm(file: File, fields: Record<string, string> = {}) {
  const form = new FormData();
  form.append("file", file);
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return form;
}

export const api = {
  // Auth & users
  login(email: string, password: string) {
    const form = new URLSearchParams({ username: email, password });
    return request<Token>("/api/v1/users/token", { method: "POST", form, auth: false });
  },
  signup(data: { first_name: string; last_name: string; email: string; password: string }) {
    return request<User>("/api/v1/users/signup", { method: "POST", json: data, auth: false });
  },
  me() {
    return request<User>("/api/v1/users/me");
  },
  myStats() {
    return request<UserStats>("/api/v1/users/me/stats");
  },
  updateUser(id: number, data: Partial<Pick<User, "first_name" | "last_name" | "email">>) {
    return request<User>(`/api/v1/users/${id}`, { method: "PATCH", json: data });
  },
  deleteUser(id: number) {
    return request<User>(`/api/v1/users/${id}`, { method: "DELETE" });
  },
  forgotPassword(email: string) {
    return request<MessageResponse>("/api/v1/users/forgot-password", {
      method: "POST",
      json: { email },
      auth: false,
    });
  },
  resetPassword(token: string, new_password: string) {
    return request<MessageResponse>("/api/v1/users/reset-password", {
      method: "POST",
      json: { token, new_password },
      auth: false,
    });
  },
  changePassword(current_password: string, new_password: string) {
    return request<MessageResponse>("/api/v1/users/me/password", {
      method: "PATCH",
      json: { current_password, new_password },
    });
  },

  // Documents
  listDocuments(params: { skip?: number; limit?: number; q?: string; status?: DocumentStatus }) {
    return request<PaginatedDocuments>(`/api/v1/documents${query(params)}`);
  },
  getDocument(id: number) {
    return request<DocFlowDocument>(`/api/v1/documents/${id}`);
  },
  updateDocument(id: number, data: { name?: string; status?: "ACTIVE" | "ARCHIVED" }) {
    return request<DocFlowDocument>(`/api/v1/documents/${id}`, { method: "PATCH", json: data });
  },
  deleteDocument(id: number) {
    return request<DocFlowDocument>(`/api/v1/documents/${id}`, { method: "DELETE" });
  },
  reprocessDocument(id: number, processing_type: ProcessingType, instructions?: string) {
    return request<DocumentProcessingResponse>(`/api/v1/documents/${id}/process`, {
      method: "POST",
      json: { processing_type, instructions: instructions || null },
    });
  },
  documentJobs(id: number) {
    return request<ProcessingJob[]>(`/api/v1/documents/${id}/jobs`);
  },
  documentRequests(id: number) {
    return request<ProcessingRequest[]>(`/api/v1/documents/${id}/processing-requests`);
  },

  /** Multipart upload through XHR so we can report progress. */
  uploadDocument(
    input: { file: File; processing_type: ProcessingType; instructions?: string },
    onProgress?: (fraction: number) => void,
  ) {
    const form = new FormData();
    form.append("file", input.file);
    form.append("processing_type", input.processing_type);
    if (input.instructions) form.append("instructions", input.instructions);
    return uploadForm<DocumentProcessingResponse>("/api/v1/documents", form, onProgress);
  },
  /** Stores a PDF's text page by page so it can be asked about. */
  storeForQuestions(file: File, onProgress?: (fraction: number) => void) {
    const form = new FormData();
    form.append("file", file);
    return uploadForm<StoredDocument>("/api/v1/documents/qa", form, onProgress);
  },
  askDocument(id: number, body: { question: string; conversation_id?: number | null; mode?: AskMode }) {
    return request<DocumentAnswer>(`/api/v1/documents/${id}/ask`, { method: "POST", json: body, slow: true });
  },
  /** Starts (re-)indexing in the background; poll the document for `index_status`. */
  reindexDocument(id: number) {
    return request<{ document_id: number; index_status: string }>(`/api/v1/documents/${id}/index`, {
      method: "POST",
    });
  },

  /** The document's original file, looked up by document id (owner only). */
  async documentFile(id: number) {
    const response = await send(`/api/v1/documents/${id}/file`);
    return response.blob();
  },

  // Files
  listFiles(params: { skip?: number; limit?: number }) {
    return request<PaginatedFiles>(`/api/v1/files${query(params)}`);
  },
  async fileBlob(id: number) {
    const response = await send(`/api/v1/files/${id}`);
    return response.blob();
  },
  /** Deletes the stored file and, with it, the document that uses it (its Q&A pages too). */
  deleteFile(id: number) {
    return request<FileDeleteResponse>(`/api/v1/files/${id}`, { method: "DELETE" });
  },

  // Processing requests
  getRequest(id: number) {
    return request<ProcessingRequest>(`/api/v1/processing-requests/${id}`);
  },
  getStatus(id: number) {
    return request<ProcessingStatusResponse>(`/api/v1/processing-requests/status/${id}`);
  },
  getResult(id: number) {
    return request<ProcessingResult>(`/api/v1/processing-requests/result/${id}`);
  },
  cancelRequest(id: number) {
    return request<ProcessingStatusResponse>(`/api/v1/processing-requests/${id}/cancel`, {
      method: "POST",
    });
  },
  /** Queues a new request with the same type and instructions as a failed or cancelled one. */
  retryRequest(id: number) {
    return request<DocumentProcessingResponse>(`/api/v1/processing-requests/${id}/retry`, {
      method: "POST",
    });
  },
  async exportResult(id: number, format: "json" | "csv") {
    const response = await send(`/api/v1/processing-requests/${id}/export${query({ format })}`);
    return response.blob();
  },

  // Chat
  chatModels() {
    return request<ModelsResponse>("/api/v1/chat/models");
  },
  /** One answer with no history; nothing is saved. The app streams instead (see streamChat). */
  chat(message: string, model?: ChatModel | null) {
    return request<ChatResponse>("/api/v1/chat", { method: "POST", json: { message, model: model ?? null }, slow: true });
  },
  /** An empty conversation; without a title it is named after its first message. */
  createConversation(title?: string | null) {
    return request<Conversation>("/api/v1/chat/conversations", {
      method: "POST",
      json: { title: title?.trim() || null },
    });
  },
  listConversations(params: { skip?: number; limit?: number }) {
    return request<PaginatedConversations>(`/api/v1/chat/conversations${query(params)}`);
  },
  getConversation(id: number) {
    return request<ConversationDetail>(`/api/v1/chat/conversations/${id}`);
  },
  renameConversation(id: number, title: string) {
    return request<Conversation>(`/api/v1/chat/conversations/${id}`, {
      method: "PATCH",
      json: { title },
    });
  },
  async deleteConversation(id: number) {
    await send(`/api/v1/chat/conversations/${id}`, { method: "DELETE" }); // 204, no body
  },
  /**
   * Streams an answer. HTTP errors (429, 404, 5xx) throw `ApiError` before the first event;
   * a failure after that arrives as an `error` event. Aborting `signal` stops the answer,
   * and the backend keeps what was written so far as a cancelled message.
   */
  async *streamChat(body: StreamChatRequest, signal?: AbortSignal): AsyncGenerator<ChatStreamEvent> {
    const response = await send("/api/v1/chat/stream", {
      method: "POST",
      json: body,
      signal,
      headers: { Accept: "text/event-stream" },
    });
    if (!response.body) throw new ApiError(0, "The answer couldn't be read. Please try again.");
    for await (const { event, data } of readSSE(response.body)) {
      yield { event, data: JSON.parse(data) } as ChatStreamEvent;
    }
  },
  chatStats(days: number) {
    return request<ChatStats>(`/api/v1/chat/stats${query({ days })}`);
  },
  /** One image and one question; the answer starts a new conversation. */
  answerWithImage(file: File, question: string) {
    return request<ImageAnswer>("/api/v1/chat/image", {
      method: "POST",
      form: fileForm(file, { question }),
      slow: true,
    });
  },
  /** One PDF (not kept) and one question; the answer starts a new conversation. */
  answerWithDocument(file: File, question: string) {
    return request<DocumentAnswer>("/api/v1/chat/document", {
      method: "POST",
      form: fileForm(file, { question }),
      slow: true,
    });
  },
  transcribe(file: File) {
    return request<Transcription>("/api/v1/chat/transcribe", { method: "POST", form: fileForm(file), slow: true });
  },
  getTranscription(id: number) {
    return request<Transcription>(`/api/v1/chat/transcribe/${id}`);
  },

  // Service
  /** Dependency checks. A degraded service answers 503 with the same body, so this never throws on 503. */
  async health(): Promise<HealthResponse> {
    let response: Response;
    try {
      response = await fetch(`${API_URL}/health`, { cache: "no-store" });
    } catch {
      throw new ApiError(0, NETWORK_MESSAGE, "network");
    }
    if (response.ok || (response.status === 503 && isJson(response))) return response.json();
    throw await toApiError(response);
  },
};
