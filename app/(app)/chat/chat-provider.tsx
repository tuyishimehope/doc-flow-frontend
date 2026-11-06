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
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { keys } from "@/lib/queries";
import type { ChatModel, ConversationDetail } from "@/lib/types";
import { errorText } from "@/lib/utils";

const MODEL_KEY = "docflow.chat-model";

export type StreamPhase = "sending" | "streaming" | "done" | "error" | "cancelled";

/** The answer being written right now, shown until the saved messages are refetched. */
export interface ActiveStream {
  /** `null` until the server names the new conversation. */
  conversationId: number | null;
  /** Saved messages at index >= this belong to this turn and are hidden while it streams. */
  baseCount: number;
  userText: string;
  text: string;
  phase: StreamPhase;
  error?: string;
  model?: string;
}

interface ChatContextValue {
  stream: ActiveStream | null;
  /** Resolves `false` when the message never reached the model, so the composer can restore it. */
  send: (text: string, conversationId: number | null) => Promise<boolean>;
  stop: () => void;
  model: ChatModel | null;
  setModel: (model: ChatModel) => void;
  listOpen: boolean;
  setListOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used inside <ChatProvider>");
  return value;
}

function readModel(): ChatModel | null {
  try {
    return (window.localStorage.getItem(MODEL_KEY) as ChatModel | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Lives in the /chat layout so a stream survives the move from /chat to /chat/{id}
 * once the server has created the conversation.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [stream, setStream] = useState<ActiveStream | null>(null);
  const [model, setModelState] = useState<ChatModel | null>(readModel);
  const [listOpen, setListOpen] = useState(false);
  const busy = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const modelRef = useRef(model);

  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  // Leaving the chat section stops the answer; the backend keeps the part written so far.
  useEffect(() => () => abort.current?.abort(), []);

  const setModel = useCallback((next: ChatModel) => {
    setModelState(next);
    try {
      window.localStorage.setItem(MODEL_KEY, next);
    } catch {}
  }, []);

  const stop = useCallback(() => abort.current?.abort(), []);

  const send = useCallback(
    async (text: string, conversationId: number | null) => {
      if (busy.current) return false;
      busy.current = true;
      const controller = new AbortController();
      abort.current = controller;

      const saved =
        conversationId === null
          ? undefined
          : qc.getQueryData<ConversationDetail>(keys.conversation(conversationId));
      let current: ActiveStream = {
        conversationId,
        baseCount: saved?.messages.length ?? 0,
        userText: text,
        text: "",
        phase: "sending",
      };
      const update = (patch: Partial<ActiveStream>) => {
        current = { ...current, ...patch };
        setStream(current);
      };
      update({});

      let started = false;
      try {
        const events = api.streamChat(
          { message: text, model: modelRef.current, conversation_id: conversationId },
          controller.signal,
        );
        for await (const e of events) {
          if (e.event === "conversation") {
            started = true;
            const id = e.data.conversation_id;
            update({ conversationId: id, phase: "streaming" });
            qc.invalidateQueries({ queryKey: keys.conversationList });
            if (conversationId === null && window.location.pathname === "/chat") {
              router.replace(`/chat/${id}`);
            }
          } else if (e.event === "token") {
            update({ text: current.text + e.data.text });
          } else if (e.event === "done") {
            update({ phase: "done", model: e.data.model });
          } else if (e.event === "error") {
            update({ phase: "error", error: e.data.message });
            toast.error("The answer stopped early", { description: e.data.message });
          }
        }
      } catch (error) {
        if (controller.signal.aborted) {
          update({ phase: "cancelled" });
        } else if (!started) {
          // Refused before streaming (rate limit, provider down...). The backend may
          // still have saved the question, so refresh what it has.
          toast.error("Couldn't send your message", { description: errorText(error) });
          qc.invalidateQueries({ queryKey: keys.conversations });
          setStream(null);
          busy.current = false;
          return false;
        } else {
          update({ phase: "error", error: errorText(error) });
          toast.error("The answer stopped early", { description: errorText(error) });
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
        ]);
      }
      setStream(null);
      busy.current = false;
      abort.current = null;
      return true;
    },
    [qc, router],
  );

  const value = useMemo(
    () => ({ stream, send, stop, model, setModel, listOpen, setListOpen }),
    [stream, send, stop, model, setModel, listOpen],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
