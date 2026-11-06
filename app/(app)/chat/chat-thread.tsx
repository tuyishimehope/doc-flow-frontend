"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, MessageSquareOff, PanelLeft, Sparkles } from "lucide-react";
import { ChatComposer } from "@/components/chat-composer";
import { MessageList, ThreadSkeleton } from "@/components/chat-messages";
import { useChat, useOwnStream } from "@/components/chat-provider";
import { buttonClass, EmptyState, Skeleton } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useConversation, useDocument } from "@/lib/queries";
import type { Citation } from "@/lib/types";
import { cn, errorText } from "@/lib/utils";
import { useConversationDrawer } from "./chat-layout";

const SUGGESTIONS = [
  "Explain the difference between an invoice and a receipt",
  "Draft a polite payment reminder email",
  "What should I check before signing a contract?",
];

export function ChatThread({ conversationId }: { conversationId: number | null }) {
  const router = useRouter();
  const { stream, send } = useChat();
  const { setOpen: setListOpen } = useConversationDrawer();
  const conversation = useConversation(conversationId);
  const isNew = conversationId === null;
  const ownStream = useOwnStream("chat", conversationId);
  const messages = isNew ? [] : (conversation.data?.messages ?? []);
  const documentId = conversation.data?.document_id ?? null;
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
  }, [messages.length, ownStream?.text, ownStream?.phase, conversation.isSuccess]);

  // Move to the conversation the answer landed in, if the reader is still here.
  const here = isNew ? "/chat" : `/chat/${conversationId}`;
  const followConversation = (id: number) => {
    if (id !== conversationId && window.location.pathname === here) router.replace(`/chat/${id}`);
  };

  const retry = (text: string) => {
    if (conversationId !== null) send(text, conversationId, { documentId });
  };

  const openCitation = (c: Citation) => {
    if (documentId) router.push(`/documents/${documentId}?tab=ask&c=${conversationId}&page=${c.page}`);
  };

  const notFound = conversation.error instanceof ApiError && conversation.error.status === 404;
  // A new conversation's own answer can show before its first fetch returns.
  const loading = !isNew && conversation.isPending && !ownStream;
  const title = isNew ? "New chat" : (conversation.data?.title ?? ownStream?.userText ?? "");
  const empty = messages.length === 0 && !ownStream;

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 sm:px-5">
        <button
          onClick={() => setListOpen(true)}
          aria-label="Show conversations"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 md:hidden"
        >
          <PanelLeft className="size-4" />
        </button>
        {loading ? (
          <Skeleton className="h-4 w-48" />
        ) : (
          <h1 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-fg">{title}</h1>
        )}
        {documentId && <DocumentLink documentId={documentId} conversationId={conversationId} />}
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
        <>
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
              ) : empty ? (
                <Welcome
                  disabled={busy}
                  onPick={(text) => send(text, null, { onConversation: followConversation })}
                />
              ) : (
                <MessageList
                  messages={messages}
                  stream={ownStream}
                  onRetry={busy ? undefined : retry}
                  onCitation={documentId ? openCitation : undefined}
                />
              )}
            </div>
          </div>
          <ChatComposer
            conversationId={conversationId}
            documentId={documentId}
            allowAttachments={!documentId}
            showModel={!documentId}
            placeholder={documentId ? "Ask about this document…" : "Ask anything…"}
            onConversation={followConversation}
            footer={
              <p className="mt-2 hidden text-center text-xs text-subtle sm:block">
                Enter to send, Shift+Enter for a new line. Answers can be wrong; check what matters.
              </p>
            }
          />
        </>
      )}
    </>
  );
}

function DocumentLink({ documentId, conversationId }: { documentId: number; conversationId: number | null }) {
  const doc = useDocument(documentId);
  return (
    <Link
      href={`/documents/${documentId}?tab=ask${conversationId ? `&c=${conversationId}` : ""}`}
      title="Open the document"
      className="inline-flex max-w-[45%] shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-muted hover:bg-surface-2 hover:text-fg"
    >
      <FileText className="size-3.5 shrink-0 text-accent" />
      <span className="truncate">{doc.data?.name ?? "Document"}</span>
    </Link>
  );
}

function Welcome({ onPick, disabled }: { onPick: (text: string) => void; disabled: boolean }) {
  return (
    <div className="flex flex-col items-center pt-[8vh] text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
        <Sparkles className="size-5" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-fg">What can I help with?</h2>
      <p className="mt-1 text-sm text-muted">
        Ask anything, attach an image or a PDF, or dictate with the microphone.
      </p>
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
