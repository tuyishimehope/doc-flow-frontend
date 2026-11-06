"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowUp, Loader2, Mic, Paperclip, Square, X } from "lucide-react";
import { toast } from "sonner";
import { useChat, type Attachment, type SendOptions } from "./chat-provider";
import { AttachmentChip } from "./chat-messages";
import { api } from "@/lib/api";
import { useChatModels } from "@/lib/queries";
import type { ChatModel } from "@/lib/types";
import { canRecord, MAX_RECORDING_SECONDS, useRecorder } from "@/lib/use-recorder";
import { cn, errorText, fileExtension, formatBytes } from "@/lib/utils";

const MAX_CHARS = 4000;
const MAX_HEIGHT = 200;
const MB = 1024 * 1024;
const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp"];
// Mirrors VISION_MAX_IMAGE_MB and DOCUMENT_QA_MAX_MB on the backend.
const LIMITS = { image: 5 * MB, pdf: 10 * MB };

function toAttachment(file: File): Attachment | string {
  const ext = fileExtension(file.name);
  const kind = IMAGE_EXTS.includes(ext) ? "image" : ext === "pdf" ? "pdf" : null;
  if (!kind) return "Attach a JPG, PNG or WebP image, or a PDF.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > LIMITS[kind]) {
    return `That ${kind === "pdf" ? "PDF" : "image"} is too big. The limit is ${formatBytes(LIMITS[kind])}.`;
  }
  return { file, kind };
}

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ChatComposer({
  conversationId,
  scope = "chat",
  documentId,
  allowAttachments = false,
  showModel = false,
  placeholder = "Ask anything…",
  footer,
  onConversation,
  onError,
}: {
  conversationId: number | null;
  scope?: string;
  /** Questions go to this stored document instead of the general chat. */
  documentId?: number | null;
  allowAttachments?: boolean;
  /** Only general chat streams pick a model; document and attachment answers use their own. */
  showModel?: boolean;
  placeholder?: string;
  footer?: ReactNode;
  onConversation?: SendOptions["onConversation"];
  onError?: SendOptions["onError"];
}) {
  const { stream, send, stop, model, setModel } = useChat();
  const models = useChatModels();
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const busy = !!stream;
  const stoppable = busy && stream.streaming && stream.scope === scope && stream.viewId === conversationId;
  const text = draft.trim();
  const canSend = !busy && !transcribing && text.length > 0 && draft.length <= MAX_CHARS;
  const selected = model ?? (models.data?.default as ChatModel | undefined) ?? "auto";

  const recorder = useRecorder(async (file) => {
    setTranscribing(true);
    try {
      const { text: heard } = await api.transcribe(file);
      setDraft((d) => (d.trim() ? `${d.trimEnd()} ${heard}` : heard));
      input.current?.focus();
    } catch (e) {
      toast.error("Couldn't transcribe the recording", { description: errorText(e) });
    } finally {
      setTranscribing(false);
    }
  });

  // Grow with the text, up to a limit.
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [draft]);

  // Ready to type, without jumping the page to an input lower down (the Ask panel).
  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, [conversationId]);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    const sent = attachment;
    setDraft("");
    setAttachment(null);
    const ok = await send(text, conversationId, {
      scope,
      documentId,
      attachment: sent ?? undefined,
      onConversation,
      onError,
    });
    // Never reached the model: give everything back unless something new was typed.
    if (!ok) {
      setDraft((current) => current || text);
      setAttachment((current) => current ?? sent);
    }
  }

  async function toggleRecording() {
    if (recorder.recording) return recorder.stop();
    try {
      await recorder.start();
    } catch (e) {
      const denied = e instanceof DOMException && e.name === "NotAllowedError";
      toast.error(denied ? "Microphone access was blocked" : "Couldn't start recording", {
        description: denied ? "Allow the microphone for this site in your browser settings." : errorText(e),
      });
    }
  }

  return (
    <form onSubmit={submit} className="shrink-0 border-t border-line bg-surface px-3 py-3 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-line bg-bg transition-shadow focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
          {attachment && (
            <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
              <AttachmentChip name={attachment.file.name} kind={attachment.kind}>
                <span className="shrink-0 text-xs text-subtle">{formatBytes(attachment.file.size)}</span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  aria-label={`Remove ${attachment.file.name}`}
                  className="grid size-5 shrink-0 place-items-center rounded-md text-subtle hover:bg-surface-2 hover:text-fg"
                >
                  <X className="size-3.5" />
                </button>
              </AttachmentChip>
              {conversationId !== null && (
                <span className="text-xs text-subtle">The answer starts a new conversation.</span>
              )}
            </div>
          )}
          {recorder.recording ? (
            <div className="flex h-[52px] items-center gap-3 px-4" aria-live="polite">
              <span className="size-2.5 animate-pulse rounded-full bg-rose-500" />
              <span className="text-sm font-medium text-fg tabular-nums">{clock(recorder.seconds)}</span>
              <span className="text-xs text-subtle">
                Recording… stops at {clock(MAX_RECORDING_SECONDS)}
              </span>
              <button
                type="button"
                onClick={recorder.cancel}
                className="ml-auto text-xs font-medium text-muted hover:text-fg"
              >
                Discard
              </button>
            </div>
          ) : (
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
              placeholder={
                transcribing
                  ? "Transcribing…"
                  : attachment
                    ? `Ask about this ${attachment.kind === "image" ? "image" : "PDF"}…`
                    : placeholder
              }
              disabled={transcribing}
              aria-label="Message"
              className="block max-h-[200px] w-full resize-none bg-transparent px-4 pt-3 pb-1 text-[15px] leading-relaxed text-fg placeholder:text-subtle focus:outline-none disabled:opacity-60"
            />
          )}
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <div className="flex min-w-0 items-center gap-0.5">
              {allowAttachments && (
                <>
                  <input
                    ref={picker}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (!file) return;
                      const result = toAttachment(file);
                      if (typeof result === "string") toast.error(result);
                      else setAttachment(result);
                    }}
                  />
                  <IconButton
                    label="Attach an image or PDF"
                    onClick={() => picker.current?.click()}
                    disabled={busy || recorder.recording}
                  >
                    <Paperclip className="size-4" />
                  </IconButton>
                </>
              )}
              {canRecord() && (
                <IconButton
                  label={recorder.recording ? "Stop recording" : "Dictate"}
                  onClick={toggleRecording}
                  disabled={transcribing}
                  active={recorder.recording}
                >
                  {transcribing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : recorder.recording ? (
                    <Square className="size-3.5 fill-current" />
                  ) : (
                    <Mic className="size-4" />
                  )}
                </IconButton>
              )}
              {showModel && models.data && !attachment && (
                <select
                  value={selected}
                  onChange={(e) => setModel(e.target.value as ChatModel)}
                  aria-label="Model"
                  className="h-8 max-w-[11rem] min-w-0 rounded-lg border border-transparent bg-transparent px-2 text-[13px] text-muted hover:bg-surface-2 hover:text-fg focus:border-line focus:outline-none"
                >
                  {models.data.models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-2">
              {draft.length > MAX_CHARS - 500 && (
                <span
                  className={cn("text-xs tabular-nums", draft.length > MAX_CHARS ? "text-rose-600" : "text-subtle")}
                >
                  {draft.length}/{MAX_CHARS}
                </span>
              )}
              {stoppable ? (
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
                  disabled={!canSend || recorder.recording}
                  aria-label="Send"
                  title={busy ? "Wait for the current answer to finish" : "Send"}
                  className="grid size-8 place-items-center rounded-lg bg-accent text-white shadow-sm shadow-accent/25 hover:bg-accent-strong disabled:opacity-40"
                >
                  {busy && stream.scope === scope && stream.viewId === conversationId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowUp className="size-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
        {footer}
      </div>
    </form>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg transition-colors disabled:opacity-40",
        active ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}
