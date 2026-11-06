"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { useChatModels } from "@/lib/queries";
import type { ChatModel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useChat } from "./chat-provider";

const MAX_CHARS = 4000;
const MAX_HEIGHT = 200;

export function Composer({ conversationId }: { conversationId: number | null }) {
  const { stream, send, stop, model, setModel } = useChat();
  const models = useChatModels();
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const busy = !!stream;
  const streamingHere = busy && stream.conversationId === conversationId;
  const text = draft.trim();
  const canSend = !busy && text.length > 0 && draft.length <= MAX_CHARS;
  const selected = model ?? (models.data?.default as ChatModel | undefined) ?? "auto";

  // Grow with the text, up to a limit.
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [draft]);

  useEffect(() => {
    input.current?.focus();
  }, [conversationId]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    setDraft("");
    const ok = await send(text, conversationId);
    // Never reached the model: give the text back unless something new was typed.
    if (!ok) setDraft((current) => current || text);
  }

  return (
    <form onSubmit={submit} className="shrink-0 border-t border-line bg-surface px-3 pt-3 pb-3 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-line bg-bg transition-shadow focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          <textarea
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder="Ask anything…"
            aria-label="Message"
            className="block max-h-[200px] w-full resize-none bg-transparent px-4 pt-3 pb-1 text-[15px] leading-relaxed text-fg placeholder:text-subtle focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            {models.data ? (
              <select
                value={selected}
                onChange={(e) => setModel(e.target.value as ChatModel)}
                aria-label="Model"
                className="h-8 max-w-[11rem] rounded-lg border border-transparent bg-transparent px-2 text-[13px] text-muted hover:bg-surface-2 hover:text-fg focus:border-line focus:outline-none"
              >
                {models.data.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {draft.length > MAX_CHARS - 500 && (
                <span
                  className={cn("text-xs tabular-nums", draft.length > MAX_CHARS ? "text-rose-600" : "text-subtle")}
                >
                  {draft.length}/{MAX_CHARS}
                </span>
              )}
              {streamingHere ? (
                <button
                  type="button"
                  onClick={stop}
                  aria-label="Stop answering"
                  title="Stop"
                  className="grid size-8 place-items-center rounded-lg bg-fg text-bg hover:opacity-85"
                >
                  <Square className="size-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send"
                  title={busy ? "Wait for the current answer to finish" : "Send"}
                  className="grid size-8 place-items-center rounded-lg bg-accent text-white shadow-sm shadow-accent/25 hover:bg-accent-strong disabled:opacity-40"
                >
                  <ArrowUp className="size-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-2 hidden text-center text-xs text-subtle sm:block">
          Enter to send, Shift+Enter for a new line. Answers can be wrong; check what matters.
        </p>
      </div>
    </form>
  );
}
