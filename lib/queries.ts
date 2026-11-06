"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";
import { useToken } from "./auth-store";
import type {
  ConversationDetail,
  DocumentStatus,
  ProcessingRequest,
  ProcessingStatus,
  ProcessingType,
} from "./types";

export const ACTIVE_STATUSES: ProcessingStatus[] = ["PENDING", "QUEUED", "PROCESSING"];
export const isActive = (status: ProcessingStatus) => ACTIVE_STATUSES.includes(status);

const POLL_MS = 2500;

export const keys = {
  me: ["me"] as const,
  stats: ["stats"] as const,
  documents: ["documents"] as const,
  documentList: (params: object) => ["documents", "list", params] as const,
  document: (id: number) => ["documents", id] as const,
  requests: (id: number) => ["documents", id, "requests"] as const,
  jobs: (id: number) => ["documents", id, "jobs"] as const,
  result: (requestId: number) => ["result", requestId] as const,
  files: (params: object) => ["files", params] as const,
  fileBlob: (fileId: number) => ["file-blob", fileId] as const,
  conversations: ["conversations"] as const,
  conversationList: ["conversations", "list"] as const,
  conversation: (id: number) => ["conversations", id] as const,
  chatModels: ["chat-models"] as const,
  chatStats: (days: number) => ["chat-stats", days] as const,
};

const CONVERSATIONS_PAGE = 20;

// ---- Queries ----

export function useMe() {
  const token = useToken();
  return useQuery({
    queryKey: keys.me,
    queryFn: api.me,
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}

export function useStats() {
  return useQuery({
    queryKey: keys.stats,
    queryFn: api.myStats,
    // Keep the dashboard counts live while anything is still running.
    refetchInterval: (q) => {
      const byStatus = q.state.data?.processing_requests.by_status;
      return byStatus && ACTIVE_STATUSES.some((s) => (byStatus[s] ?? 0) > 0) ? POLL_MS * 2 : false;
    },
  });
}

export function useDocuments(params: {
  skip?: number;
  limit?: number;
  q?: string;
  status?: DocumentStatus;
}) {
  return useQuery({
    queryKey: keys.documentList(params),
    queryFn: () => api.listDocuments(params),
    placeholderData: keepPreviousData,
  });
}

/** Polls while the document is being indexed for retrieval. */
export function useDocument(id: number) {
  return useQuery({
    queryKey: keys.document(id),
    queryFn: () => api.getDocument(id),
    refetchInterval: (q) => (q.state.data?.index_status === "PROCESSING" ? POLL_MS : false),
  });
}

/** Polls while any run is still pending/queued/processing. */
export function useProcessingRequests(documentId: number) {
  return useQuery({
    queryKey: keys.requests(documentId),
    queryFn: () => api.documentRequests(documentId),
    refetchInterval: (q) =>
      q.state.data?.some((r) => isActive(r.status)) ? POLL_MS : false,
  });
}

export function useJobs(documentId: number, poll: boolean) {
  return useQuery({
    queryKey: keys.jobs(documentId),
    queryFn: () => api.documentJobs(documentId),
    refetchInterval: poll ? POLL_MS : false,
  });
}

export function useResult(request: ProcessingRequest | undefined) {
  return useQuery({
    queryKey: keys.result(request?.id ?? -1),
    queryFn: () => api.getResult(request!.id),
    enabled: request?.status === "COMPLETED",
    // Results are immutable once a run completes.
    staleTime: Infinity,
  });
}

export function useFilePreview(fileId: number, enabled: boolean) {
  return useQuery({
    queryKey: keys.fileBlob(fileId),
    queryFn: async () => {
      const blob = await api.fileBlob(fileId);
      return { blob, url: URL.createObjectURL(blob) };
    },
    enabled,
    staleTime: Infinity,
    gcTime: 60_000,
  });
}

// ---- Mutations ----

export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      onProgress,
      ...input
    }: {
      file: File;
      processing_type: ProcessingType;
      instructions?: string;
      onProgress?: (p: number) => void;
    }) => api.uploadDocument(input, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.documents });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useReprocess(documentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { processing_type: ProcessingType; instructions?: string }) =>
      api.reprocessDocument(documentId, v.processing_type, v.instructions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.requests(documentId) });
      qc.invalidateQueries({ queryKey: keys.jobs(documentId) });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useRetryRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => api.retryRequest(requestId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: keys.requests(res.document_id) });
      qc.invalidateQueries({ queryKey: keys.jobs(res.document_id) });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useCancelRequest(documentId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => api.cancelRequest(requestId),
    onSuccess: ({ id, status }) => {
      qc.setQueryData<ProcessingRequest[]>(keys.requests(documentId), (old) =>
        old?.map((r) => (r.id === id ? { ...r, status } : r)),
      );
      qc.invalidateQueries({ queryKey: keys.requests(documentId) });
    },
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number; name?: string; status?: "ACTIVE" | "ARCHIVED" }) =>
      api.updateDocument(id, data),
    onSuccess: (doc) => {
      qc.setQueryData(keys.document(doc.id), doc);
      qc.invalidateQueries({ queryKey: [...keys.documents, "list"] });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteDocument(id),
    onSuccess: (doc) => {
      qc.removeQueries({ queryKey: keys.document(doc.id) });
      qc.invalidateQueries({ queryKey: [...keys.documents, "list"] });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      first_name?: string;
      last_name?: string;
      email?: string;
    }) => api.updateUser(id, data),
    onSuccess: (user) => qc.setQueryData(keys.me, user),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (v: { current: string; next: string }) => api.changePassword(v.current, v.next),
  });
}

// ---- Chat ----

export function useChatModels() {
  return useQuery({ queryKey: keys.chatModels, queryFn: api.chatModels, staleTime: Infinity });
}

/** Most recently active first; "Load more" pages through with skip/limit. */
export function useConversations() {
  return useInfiniteQuery({
    queryKey: keys.conversationList,
    queryFn: ({ pageParam }) =>
      api.listConversations({ skip: pageParam, limit: CONVERSATIONS_PAGE }),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.has_more ? last.skip + last.limit : undefined),
  });
}

/** Pass `null` on the new-chat page, where there is nothing to load yet. */
export function useConversation(id: number | null) {
  return useQuery({
    queryKey: keys.conversation(id ?? 0),
    queryFn: () => api.getConversation(id!),
    enabled: id !== null,
  });
}

export function useRenameConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => api.renameConversation(id, title),
    onSuccess: (conversation) => {
      qc.setQueryData<ConversationDetail>(keys.conversation(conversation.id), (old) =>
        old ? { ...old, ...conversation } : old,
      );
      qc.invalidateQueries({ queryKey: keys.conversationList });
    },
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteConversation(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: keys.conversation(id) });
      qc.invalidateQueries({ queryKey: keys.conversationList });
    },
  });
}

export function useChatStats(days: number) {
  return useQuery({
    queryKey: keys.chatStats(days),
    queryFn: () => api.chatStats(days),
    placeholderData: keepPreviousData,
  });
}

export function useStoreForQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (p: number) => void }) =>
      api.storeForQuestions(file, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.documents });
      qc.invalidateQueries({ queryKey: keys.stats });
    },
  });
}

export function useReindexDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.reindexDocument(id),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: keys.document(id) }),
  });
}
