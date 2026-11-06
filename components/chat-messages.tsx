"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, FileText, ImageIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import type { ActiveStream, AttachmentKind } from "./chat-provider";
import { Markdown } from "./markdown";
import { ErrorBanner, Skeleton } from "./ui";
import type { ChatMessage, Citation } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Rows to render: saved messages, with this turn's local copy in place of its saved one. */
type Row =
  | { kind: "saved"; message: ChatMessage; retryText?: string }
  | { kind: "pending-user"; stream: ActiveStream }
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
    rows.push({ kind: "pending-user", stream });
    rows.push({ kind: "pending-answer", stream });
  } else if (last?.role === "user") {
    // The question was saved but the model never answered (e.g. the provider was down).
    rows.push({ kind: "unanswered", retryText: last.content });
  }
  return rows;
}

export function MessageList({
  messages,
  stream,
  onRetry,
  onCitation,
}: {
  messages: ChatMessage[];
  stream: ActiveStream | null;
  onRetry?: (text: string) => void;
  /** Makes citation chips clickable, e.g. to open the PDF at that page. */
  onCitation?: (citation: Citation) => void;
}) {
  return buildRows(messages, stream).map((row, i) => {
    switch (row.kind) {
      case "pending-user":
        return <UserBubble key={`u${i}`} text={row.stream.userText} attachment={row.stream.attachment} />;
      case "pending-answer":
        return <PendingAnswer key={`a${i}`} stream={row.stream} onCitation={onCitation} />;
      case "unanswered":
        return (
          <div key={`x${i}`} className="flex items-center gap-3 text-sm text-muted">
            <span>No answer was saved for this question.</span>
            {onRetry && <RetryButton onClick={() => onRetry(row.retryText)} />}
          </div>
        );
      case "saved": {
        const m = row.message;
        return m.role === "user" ? (
          <UserBubble key={m.id} text={m.content} />
        ) : (
          <AssistantMessage
            key={m.id}
            text={m.content}
            model={m.model}
            status={m.status}
            citations={m.citations}
            grounded={m.grounded}
            onCitation={onCitation}
            onRetry={row.retryText && onRetry ? () => onRetry(row.retryText!) : undefined}
          />
        );
      }
    }
  });
}

function UserBubble({ text, attachment }: { text: string; attachment?: ActiveStream["attachment"] }) {
  return (
    <div className="flex flex-col items-end gap-1.5">
      {attachment && <AttachmentChip name={attachment.name} kind={attachment.kind} />}
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap break-words text-fg">
        {text}
      </div>
    </div>
  );
}

export function AttachmentChip({
  name,
  kind,
  className,
  children,
}: {
  name: string;
  kind: AttachmentKind;
  className?: string;
  children?: React.ReactNode;
}) {
  const Icon = kind === "image" ? ImageIcon : FileText;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-[13px] text-fg",
        className,
      )}
    >
      <Icon className="size-4 shrink-0 text-accent" />
      <span className="min-w-0 truncate">{name}</span>
      {children}
    </span>
  );
}

function AssistantMessage({
  text,
  model,
  status,
  citations,
  grounded,
  onCitation,
  onRetry,
}: {
  text: string;
  model: string | null;
  status: ChatMessage["status"];
  citations?: Citation[] | null;
  grounded?: boolean | null;
  onCitation?: (citation: Citation) => void;
  onRetry?: () => void;
}) {
  return (
    <div>
      {text ? <Markdown text={text} /> : <p className="text-sm text-subtle italic">No text was written.</p>}
      <Sources citations={citations} grounded={grounded} onCitation={onCitation} />
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

/** Page citations (each one was checked against the page text by the backend). */
function Sources({
  citations,
  grounded,
  onCitation,
}: {
  citations?: Citation[] | null;
  grounded?: boolean | null;
  onCitation?: (citation: Citation) => void;
}) {
  if (!citations?.length && grounded !== false) return null;
  return (
    <div className="mt-3 space-y-2">
      {grounded === false && (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="size-3.5" />
          No quote could be checked against the document; treat this answer with care.
        </p>
      )}
      {!!citations?.length && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-subtle">Sources</span>
          {citations.map((c, i) => {
            const label = `p. ${c.page}`;
            const title = `Page ${c.page}: “${c.quote}”`;
            const chip =
              "inline-flex max-w-[16rem] items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1 text-xs";
            return onCitation ? (
              <button
                key={i}
                onClick={() => onCitation(c)}
                title={title}
                className={cn(chip, "text-fg hover:border-accent/50 hover:bg-accent-soft")}
              >
                <span className="shrink-0 font-semibold whitespace-nowrap text-accent">{label}</span>
                <span className="truncate text-muted">{c.quote}</span>
              </button>
            ) : (
              <span key={i} title={title} className={cn(chip, "text-fg")}>
                <span className="shrink-0 font-semibold whitespace-nowrap">{label}</span>
                <span className="truncate text-muted">{c.quote}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PendingAnswer({
  stream,
  onCitation,
}: {
  stream: ActiveStream;
  onCitation?: (citation: Citation) => void;
}) {
  if (stream.phase === "sending" || (stream.phase === "streaming" && !stream.text)) {
    return (
      <div className="flex items-center gap-2.5 py-2" aria-label="Thinking">
        <span className="flex items-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="size-1.5 animate-bounce rounded-full bg-subtle"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
        {!stream.streaming && (
          <span className="text-xs text-subtle">
            {stream.attachment?.kind === "image"
              ? "Looking at the image…"
              : stream.attachment
                ? "Reading the PDF…"
                : "Reading the document…"}
          </span>
        )}
      </div>
    );
  }
  return (
    <div aria-live="polite">
      <Markdown text={stream.text} className={cn(stream.phase === "streaming" && "streaming-caret")} />
      <Sources citations={stream.citations} grounded={stream.grounded} onCitation={onCitation} />
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

export function ThreadSkeleton() {
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
