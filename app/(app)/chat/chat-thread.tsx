"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, MessageSquareOff, PanelLeft, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Markdown } from "@/components/markdown";
import { buttonClass, EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useConversation } from "@/lib/queries";
import type { ChatMessage } from "@/lib/types";
import { cn, errorText } from "@/lib/utils";
import { useChat, type ActiveStream } from "./chat-provider";
import { Composer } from "./composer";

const SUGGESTIONS = [
  "Explain the difference between an invoice and a receipt",
  "Draft a polite payment reminder email",
  "What should I check before signing a contract?",
];

/** Rows to render: saved messages, with this turn's local copy in place of its saved one. */
type Row =
  | { kind: "saved"; message: ChatMessage; retryText?: string }
  | { kind: "pending-user"; text: string }
  | { kind: "pending-answer"; stream: ActiveStream }
  | { kind: "unanswered"; retryText: string };

function buildRows(messages: ChatMessage[], stream: ActiveStream | null): Row[] {
  const saved = stream ? messages.slice(0, stream.baseCount) : messages;
  const rows: Row[] = saved.map((message, i) => {
    const before = saved[i - 1];
    const failed = message.role === "assistant" && message.status !== "complete";
    return {
      kind: "saved",
      message,
      retryText: failed && before?.role === "user" ? before.content : undefined,
    };
  });
  const last = saved[saved.length - 1];
  if (stream) {
    rows.push({ kind: "pending-user", text: stream.userText });
    rows.push({ kind: "pending-answer", stream });
  } else if (last?.role === "user") {
    // The question was saved but the model never answered (e.g. the provider was down).
    rows.push({ kind: "unanswered", retryText: last.content });
  }
  return rows;
}

export function ChatThread({ conversationId }: { conversationId: number | null }) {
  const { stream, send, setListOpen } = useChat();
  const conversation = useConversation(conversationId);
  const isNew = conversationId === null;
  const ownStream = stream && stream.conversationId === conversationId ? stream : null;
  const messages = isNew ? [] : (conversation.data?.messages ?? []);
  const rows = buildRows(messages, ownStream);
  const busy = !!stream;

  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  // Open each conversation at its latest message.
  useEffect(() => {
    stick.current = true;
  }, [conversationId]);

  // Follow the answer as it grows, unless the reader has scrolled up.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [rows.length, ownStream?.text, conversation.isSuccess]);

  const retry = (text: string) => {
    if (conversationId !== null) send(text, conversationId);
  };

  const notFound = conversation.error instanceof ApiError && conversation.error.status === 404;
  // A new conversation's own stream can show before its first fetch returns.
  const loading = !isNew && conversation.isPending && !ownStream;
  const title = isNew ? "New chat" : (conversation.data?.title ?? ownStream?.userText ?? "");

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-5">
        <button
          onClick={() => setListOpen(true)}
          aria-label="Show conversations"
          className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 md:hidden"
        >
          <PanelLeft className="size-4" />
        </button>
        {loading ? (
          <Skeleton className="h-4 w-48" />
        ) : (
          <h1 className="truncate text-[15px] font-semibold text-fg">{title}</h1>
        )}
      </header>

      {!isNew && conversation.error ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState
            icon={<MessageSquareOff className="size-5" />}
            title={notFound ? "Conversation not found" : "Couldn't load this conversation"}
            description={
              notFound ? "It may have been deleted, or it belongs to another account." : errorText(conversation.error)
            }
            action={
              <Link href="/chat" className={buttonClass("secondary")}>
                <ArrowLeft className="size-4" /> Start a new chat
              </Link>
            }
          />
        </div>
      ) : (
        <div
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="mx-auto w-full max-w-3xl space-y-5 px-4 py-6 sm:px-6">
            {loading ? (
              <ThreadSkeleton />
            ) : rows.length === 0 ? (
              <Welcome onPick={(text) => send(text, null)} disabled={busy} />
            ) : (
              rows.map((row, i) => <RowView key={rowKey(row, i)} row={row} onRetry={busy ? undefined : retry} />)
            )}
          </div>
        </div>
      )}

      {!(conversation.error && !isNew) && <Composer conversationId={conversationId} />}
    </>
  );
}

function rowKey(row: Row, i: number) {
  return row.kind === "saved" ? `m${row.message.id}` : `${row.kind}-${i}`;
}

function RowView({ row, onRetry }: { row: Row; onRetry?: (text: string) => void }) {
  switch (row.kind) {
    case "pending-user":
      return <UserBubble text={row.text} />;
    case "pending-answer":
      return <PendingAnswer stream={row.stream} />;
    case "unanswered":
      return (
        <div className="flex items-center gap-3 text-sm text-muted">
          <span>No answer was saved for this question.</span>
          {onRetry && <RetryButton onClick={() => onRetry(row.retryText)} />}
        </div>
      );
    case "saved":
      return row.message.role === "user" ? (
        <UserBubble text={row.message.content} />
      ) : (
        <AssistantMessage
          text={row.message.content}
          model={row.message.model}
          status={row.message.status}
          onRetry={row.retryText && onRetry ? () => onRetry(row.retryText!) : undefined}
        />
      );
  }
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words text-fg">
        {text}
      </div>
    </div>
  );
}

function AssistantMessage({
  text,
  model,
  status,
  onRetry,
}: {
  text: string;
  model: string | null;
  status: ChatMessage["status"];
  onRetry?: () => void;
}) {
  return (
    <div className="group">
      {text ? (
        <Markdown text={text} />
      ) : (
        <p className="text-sm text-subtle italic">No text was written.</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-subtle">
        {status === "cancelled" && <span className="font-medium text-amber-600 dark:text-amber-400">Stopped</span>}
        {status === "error" && <span className="font-medium text-rose-600 dark:text-rose-400">Answer failed</span>}
        {model && <span>{model}</span>}
        {text && <CopyButton text={text} />}
        {onRetry && <RetryButton onClick={onRetry} />}
      </div>
    </div>
  );
}

function PendingAnswer({ stream }: { stream: ActiveStream }) {
  if (stream.phase === "sending" || (stream.phase === "streaming" && !stream.text)) {
    return (
      <div className="flex items-center gap-1.5 py-2" aria-label="Thinking">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="size-1.5 animate-bounce rounded-full bg-subtle"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    );
  }
  return (
    <div aria-live="polite">
      <Markdown text={stream.text} className={cn(stream.phase === "streaming" && "streaming-caret")} />
      {stream.phase === "error" && stream.error && <ErrorBanner className="mt-3" message={stream.error} />}
      {stream.phase === "cancelled" && <p className="mt-2 text-xs font-medium text-amber-600">Stopped</p>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Couldn't copy to the clipboard");
        }
      }}
      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-surface-2 hover:text-fg"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-medium text-accent hover:bg-accent-soft"
    >
      <RotateCcw className="size-3.5" /> Retry
    </button>
  );
}

function Welcome({ onPick, disabled }: { onPick: (text: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col items-center pt-[8vh] text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Sparkles className="size-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-fg">What can I help with?</h2>
      <p className="mt-1 text-sm text-muted">Ask anything. Your conversations are saved on the left.</p>
      <div className="mt-6 grid w-full max-w-xl gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            disabled={disabled}
            onClick={() => onPick(s)}
            className={cn(
              "rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm text-muted transition-colors",
              "hover:border-accent/40 hover:bg-surface-2 hover:text-fg disabled:opacity-50",
            )}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ThreadSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="ml-auto h-10 w-2/5 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <Skeleton className="ml-auto h-10 w-1/3 rounded-2xl" />
    </div>
  );
}
