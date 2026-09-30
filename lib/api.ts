import { tokenStore } from "./auth-store";
import type {
  DocFlowDocument,
  DocumentProcessingResponse,
  DocumentStatus,
  MessageResponse,
  PaginatedDocuments,
  PaginatedFiles,
  ProcessingJob,
  ProcessingRequest,
  ProcessingResult,
  ProcessingStatusResponse,
  ProcessingType,
  Token,
  User,
} from "./types";

export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let onUnauthorized: (() => void) | null = null;

/** Registered by the auth provider so an expired token signs the user out. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// FastAPI returns `{detail: string}` or, for validation errors, `{detail: [{msg, loc}]}`.
async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const detail = body?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((d: { msg?: string; loc?: unknown[] }) => {
          const field = d.loc?.filter((l) => l !== "body").join(".");
          return field ? `${field}: ${d.msg}` : d.msg;
        })
        .join("; ");
    }
  } catch {}
  if (response.status === 429) return "Too many attempts. Please wait and try again.";
  return response.statusText || `Request failed (${response.status})`;
}

type RequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  form?: URLSearchParams | FormData;
  auth?: boolean;
};

async function send(path: string, options: RequestOptions = {}) {
  const { json, form, auth = true, headers, ...init } = options;
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

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers: finalHeaders, body });
  } catch {
    throw new ApiError(0, "Can't reach the DocFlow API. Is the backend running?");
  }

  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized?.();
    throw new ApiError(response.status, await errorMessage(response));
  }
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
  setDocumentStatus(id: number, status: "ACTIVE" | "ARCHIVED") {
    return request<DocFlowDocument>(`/api/v1/documents/${id}`, { method: "PATCH", json: { status } });
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
    return new Promise<DocumentProcessingResponse>((resolve, reject) => {
      const form = new FormData();
      form.append("file", input.file);
      form.append("processing_type", input.processing_type);
      if (input.instructions) form.append("instructions", input.instructions);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_URL}/api/v1/documents`);
      const token = tokenStore.get();
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress?.(e.loaded / e.total);
      };
      xhr.onerror = () => reject(new ApiError(0, "Can't reach the DocFlow API. Is the backend running?"));
      xhr.onload = async () => {
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
        });
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(await response.json());
          return;
        }
        if (xhr.status === 401 && token) onUnauthorized?.();
        reject(new ApiError(xhr.status, await errorMessage(response)));
      };
      xhr.send(form);
    });
  },

  // Files
  listFiles(params: { skip?: number; limit?: number }) {
    return request<PaginatedFiles>(`/api/v1/files${query(params)}`);
  },
  async fileBlob(id: number) {
    const response = await send(`/api/v1/files/${id}`);
    return response.blob();
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
  async exportResult(id: number, format: "json" | "csv") {
    const response = await send(`/api/v1/processing-requests/${id}/export${query({ format })}`);
    return response.blob();
  },
};
