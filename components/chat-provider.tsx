"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { keys } from "@/lib/queries";
import type { ChatModel, Citation, ConversationDetail, DocumentAnswer } from "@/lib/types";
import { errorText } from "@/lib/utils";

const MODEL_KEY = "docflow.chat-model";

export type StreamPhase = "sending" | "streaming" | "done" | "error" | "cancelled";

export type AttachmentKind = "image" | "pdf";

export interface Attachment {
  file: File;
  kind: AttachmentKind;
}

/** The answer being written right now, shown until the saved messages are refetched. */
export interface ActiveStream {
  /** Which view shows it: "chat", or `doc-{id}` for a document's Ask panel. */
  scope: string;
  /** The conversation the view shows; follows the answer when it starts a new one. */
  viewId: number | null;
  /** `viewId` when the message was sent. */
  origin: number | null;
  /** The conversation the answer is saved in; `null` until the server names it. */
  conversationId: number | null;
  /** Saved messages at index >= this belong to this turn and are hidden while it shows. */
  baseCount: number;
  userText: string;
  attachment?: { name: string; kind: AttachmentKind };
  /** False for one-shot answers (attachments, document questions), which can't be stopped. */
  streaming: boolean;
  text: string;
  phase: StreamPhase;
  error?: string;
  model?: string;
  citations?: Citation[];
  grounded?: boolean;
}

export interface SendOptions {
  /** Where the answer shows: "chat" (default) or `doc-{id}`. */
  scope?: string;
  /** A stored document: the question goes to /documents/{id}/ask. */
  documentId?: number | null;
  /** An image or PDF; the backend answers it in a new conversation. */
  attachment?: Attachment;
  /** Called as soon as the conversation is known (new or not). */
  onConversation?: (id: number) => void;
  /** Return true when the error was handled, to skip the default toast. */
  onError?: (error: unknown) => boolean;
}

interface ChatContextValue {
  stream: ActiveStream | null;
  /** Resolves `false` when the message never reached the model, so the composer can restore it. */
  send: (text: string, viewId: number | null, options?: SendOptions) => Promise<boolean>;
  stop: () => void;
  model: ChatModel | null;
  setModel: (model: ChatModel) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used inside <ChatProvider>");
  return value;
}

/**
 * The active stream, if it belongs to this view. A new-chat view keeps the answer it
 * started until the route moves on to the conversation it created.
 */
export function useOwnStream(scope: string, viewId: number | null) {
  const { stream } = useChat();
  if (!stream || stream.scope !== scope) return null;
  return stream.viewId === viewId || (viewId === null && stream.origin === null) ? stream : null;
}

function readModel(): ChatModel | null {
  try {
    return (window.localStorage.getItem(MODEL_KEY) as ChatModel | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Mounted once for the signed-in app, so an answer keeps going while the view
 * changes (e.g. /chat to /chat/{id} once the server creates the conversation).
 * One answer at a time.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [stream, setStream] = useState<ActiveStream | null>(null);
  const [model, setModelState] = useState<ChatModel | null>(readModel);
  const busy = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const modelRef = useRef(model);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  // Signing out unmounts this; stop the answer (the backend keeps what was written).
  useEffect(() => () => abort.current?.abort(), []);

  const setModel = useCallback((next: ChatModel) => {
    setModelState(next);
    try {
      window.localStorage.setItem(MODEL_KEY, next);
    } catch {}
  }, []);

  const stop = useCallback(() => abort.current?.abort(), []);

  const send = useCallback(
    async (text: string, viewId: number | null, options: SendOptions = {}) => {
      if (busy.current) return false;
      busy.current = true;
      const { scope = "chat", documentId, attachment, onConversation, onError } = options;
      const streaming = !attachment && !documentId;
      const controller = new AbortController();
      if (streaming) abort.current = controller;

      const saved =
        viewId === null ? undefined : qc.getQueryData<ConversationDetail>(keys.conversation(viewId));
      let current: ActiveStream = {
        scope,
        viewId,
        origin: viewId,
        // An attachment always starts a new conversation.
        conversationId: attachment ? null : viewId,
        baseCount: saved?.messages.length ?? 0,
        userText: text,
        attachment: attachment && { name: attachment.file.name, kind: attachment.kind },
        streaming,
        text: "",
        phase: "sending",
      };
      const update = (patch: Partial<ActiveStream>) => {
        current = { ...current, ...patch };
        setStream(current);
      };
      const named = (id: number) => {
        const moved = id !== current.viewId;
        update({ conversationId: id, viewId: id, baseCount: moved ? 0 : current.baseCount });
        qc.invalidateQueries({ queryKey: keys.conversationList });
        onConversation?.(id);
      };
      const fail = (error: unknown, title: string) => {
        if (!onError?.(error)) toast.error(title, { description: errorText(error) });
      };
      update({});

      let started = false;
      try {
        if (!streaming) {
          const answer = attachment
            ? attachment.kind === "image"
              ? await api.answerWithImage(attachment.file, text)
              : await api.answerWithDocument(attachment.file, text)
            : await api.askDocument(documentId!, { question: text, conversation_id: viewId });
          started = true;
          named(answer.conversation_id);
          const checked = "citations" in answer ? (answer as DocumentAnswer) : null;
          update({
            phase: "done",
            text: answer.answer,
            model: answer.model,
            citations: checked?.citations,
            grounded: checked?.grounded,
          });
        } else {
          const events = api.streamChat(
            { message: text, model: modelRef.current, conversation_id: viewId },
            controller.signal,
          );
          for await (const e of events) {
            if (e.event === "conversation") {
              started = true;
              update({ phase: "streaming" });
              named(e.data.conversation_id);
            } else if (e.event === "token") {
              update({ text: current.text + e.data.text });
            } else if (e.event === "done") {
              update({ phase: "done", model: e.data.model });
            } else if (e.event === "error") {
              update({ phase: "error", error: e.data.message });
              fail(new Error(e.data.message), "The answer stopped early");
            }
          }
        }
      } catch (error) {
        if (controller.signal.aborted) {
          update({ phase: "cancelled" });
        } else if (!started) {
          // Refused before answering (rate limit, provider down...). A streamed question
          // may still have been saved, so refresh what the backend has.
          fail(error, "Couldn't send your message");
          qc.invalidateQueries({ queryKey: keys.conversations });
          setStream(null);
          busy.current = false;
          return false;
        } else {
          update({ phase: "error", error: errorText(error) });
          fail(error, "The answer stopped early");
        }
      }

      // Swap the local copy for what the backend saved.
      const id = current.conversationId;
      if (id !== null) {
        // On a stop the backend saves the partial answer as the connection closes,
        // which can land just after our refetch; give it a moment.
        if (current.phase === "cancelled") await new Promise((r) => setTimeout(r, 600));
        await Promise.all([
          qc.invalidateQueries({ queryKey: keys.conversation(id) }),
          qc.invalidateQueries({ queryKey: keys.conversationList }),
          qc.invalidateQueries({ queryKey: ["chat-stats"] }),
        ]);
      }
      setStream(null);
      busy.current = false;
      abort.current = null;
      return true;
    },
    [qc],
  );

  const value = useMemo(
    () => ({ stream, send, stop, model, setModel }),
    [stream, send, stop, model, setModel],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
