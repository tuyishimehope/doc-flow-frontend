"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileQuestion, MessageSquarePlus, MessagesSquare, RefreshCw, SquareArrowOutUpRight } from "lucide-react";
import { toast } from "sonner";
import { ChatComposer } from "@/components/chat-composer";
import { MessageList, ThreadSkeleton } from "@/components/chat-messages";
import { useChat, useOwnStream } from "@/components/chat-provider";
import { Button, buttonClass, Card, CardHeader } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { useConversation, useConversations, useReindexDocument, useStoreForQuestions } from "@/lib/queries";
import type { Citation, DocFlowDocument } from "@/lib/types";
import { errorText, timeAgo } from "@/lib/utils";

const SUGGESTIONS = [
  "Summarise this document in five bullet points.",
  "What are the key dates and deadlines?",
  "Who are the parties involved?",
];

/** The backend's 409 for a document uploaded for processing only. */
const isNotStored = (e: unknown) =>
  e instanceof ApiError && e.status === 409 && /not stored for questions/i.test(e.message);

export function AskPanel({
  document: doc,
  initialConversationId,
  onCitation,
}: {
  document: DocFlowDocument;
  initialConversationId: number | null;
  onCitation: (citation: Citation) => void;
}) {
  const scope = `doc-${doc.id}`;
  const { stream, send } = useChat();
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [notStored, setNotStored] = useState(false);
  const conversation = useConversation(conversationId);
  const ownStream = useOwnStream(scope, conversationId);
  const all = useConversations();
  const past = (all.data?.pages.flatMap((p) => p.conversations) ?? []).filter((c) => c.document_id === doc.id);
  const messages = conversationId === null ? [] : (conversation.data?.messages ?? []);
  const loading = conversationId !== null && conversation.isPending && !ownStream;
  const busy = !!stream;

  const scroller = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, ownStream?.phase, conversationId]);

  const handleError = (e: unknown) => {
    if (!isNotStored(e)) return false;
    setNotStored(true);
    return true;
  };

  const ask = (text: string) =>
    send(text, conversationId, {
      scope,
      documentId: doc.id,
      onConversation: setConversationId,
      onError: handleError,
    });

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader
        icon={<MessagesSquare className="size-4" />}
        title="Ask this document"
        description="Answers quote the pages they come from. Click a source to open that page."
      />

      {(past.length > 0 || conversationId !== null) && (
        <div className="flex items-center gap-2 border-b border-line px-5 py-2.5">
          {past.length > 0 && (
            <select
              value={conversationId ?? ""}
              onChange={(e) => setConversationId(e.target.value ? Number(e.target.value) : null)}
              disabled={busy}
              aria-label="Conversation"
              className="h-8 min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 text-[13px] text-fg focus:outline-none sm:max-w-xs"
            >
              <option value="">New conversation</option>
              {past.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} · {timeAgo(c.updated_at)}
                </option>
              ))}
            </select>
          )}
          {conversationId !== null && (
            <Button variant="ghost" size="sm" onClick={() => setConversationId(null)} disabled={busy} className="ml-auto">
              <MessageSquarePlus className="size-4" /> New
            </Button>
          )}
        </div>
      )}

      <IndexNotice document={doc} />

      <div ref={scroller} className="h-[min(30rem,60dvh)] overflow-y-auto">
        <div className="space-y-5 px-5 py-5">
          {notStored ? (
            <NotStored document={doc} />
          ) : loading ? (
            <ThreadSkeleton />
          ) : messages.length === 0 && !ownStream ? (
            <div className="flex flex-col items-center py-6 text-center">
              <p className="text-sm text-muted">Ask a question about {doc.name}.</p>
              <div className="mt-4 grid w-full max-w-md gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => ask(s)}
                    className="rounded-xl border border-line px-3.5 py-2.5 text-left text-sm text-muted hover:border-accent/40 hover:bg-surface-2 hover:text-fg disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <MessageList
              messages={messages}
              stream={ownStream}
              onCitation={onCitation}
              onRetry={busy ? undefined : (text) => ask(text)}
            />
          )}
        </div>
      </div>

      {!notStored && (
        <ChatComposer
          scope={scope}
          conversationId={conversationId}
          documentId={doc.id}
          placeholder="Ask about this document…"
          onConversation={setConversationId}
          onError={handleError}
          footer={
            conversationId !== null && (
              <div className="mt-2 flex justify-end">
                <Link
                  href={`/chat/${conversationId}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg"
                >
                  Continue in Chat <SquareArrowOutUpRight className="size-3" />
                </Link>
              </div>
            )
          }
        />
      )}
    </Card>
  );
}

/** Only shown when retrieval indexing is in play (status other than NONE). */
function IndexNotice({ document: doc }: { document: DocFlowDocument }) {
  const reindex = useReindexDocument();
  const status = doc.index_status;
  if (status !== "PROCESSING" && status !== "FAILED") return null;
  return (
    <div className="flex items-center gap-3 border-b border-line bg-surface-2/60 px-5 py-2.5 text-[13px]">
      {status === "PROCESSING" ? (
        <>
          <RefreshCw className="size-3.5 animate-spin text-accent" />
          <span className="text-muted">Indexing the document. Answers read every page until it&apos;s done.</span>
        </>
      ) : (
        <>
          <span className="text-rose-600 dark:text-rose-400">Indexing failed.</span>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            loading={reindex.isPending}
            onClick={() =>
              reindex.mutate(doc.id, {
                onSuccess: () => toast.success("Indexing started"),
                onError: (e) => toast.error("Couldn't start indexing", { description: errorText(e) }),
              })
            }
          >
            Index again
          </Button>
        </>
      )}
    </div>
  );
}

/** A document uploaded for processing has no stored text; offer a Q&A copy of the PDF. */
function NotStored({ document: doc }: { document: DocFlowDocument }) {
  const router = useRouter();
  const store = useStoreForQuestions();
  const [preparing, setPreparing] = useState(false);

  async function makeCopy() {
    setPreparing(true);
    try {
      const blob = await api.fileBlob(doc.file_id);
      const name = /\.pdf$/i.test(doc.name) ? doc.name : `${doc.name}.pdf`;
      const stored = await store.mutateAsync({ file: new File([blob], name, { type: "application/pdf" }) });
      toast.success("Ready for questions", { description: `${stored.pages} pages read.` });
      router.push(`/documents/${stored.document_id}?tab=ask`);
    } catch (e) {
      toast.error("Couldn't prepare the document", { description: errorText(e) });
      setPreparing(false);
    }
  }

  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="grid size-12 place-items-center rounded-2xl border border-line bg-surface-2 text-muted">
        <FileQuestion className="size-5" />
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-fg">This document isn&apos;t ready for questions</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        It was uploaded for processing, so its text wasn&apos;t kept. DocFlow can read the PDF again into a
        new document you can ask about. This one stays as it is.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button onClick={makeCopy} loading={preparing}>
          Make a copy for questions
        </Button>
        <Link href="/chat" className={buttonClass("secondary")}>
          Go to Chat
        </Link>
      </div>
    </div>
  );
}
