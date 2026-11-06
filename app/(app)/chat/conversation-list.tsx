"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileText, MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonClass, Dialog, ErrorBanner, Skeleton } from "@/components/ui";
import { useConversations, useDeleteConversation, useRenameConversation } from "@/lib/queries";
import type { Conversation } from "@/lib/types";
import { cn, errorText, timeAgo } from "@/lib/utils";
import { useChat } from "./chat-provider";

export function activeConversationId(pathname: string) {
  const match = /^\/chat\/(\d+)/.exec(pathname);
  return match ? Number(match[1]) : null;
}

export function ConversationList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const activeId = activeConversationId(pathname);
  const list = useConversations();
  const conversations = list.data?.pages.flatMap((p) => p.conversations) ?? [];
  const [deleting, setDeleting] = useState<Conversation | null>(null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-fg">Chats</h2>
        <Link href="/chat" onClick={onNavigate} className={buttonClass("secondary", "sm")}>
          <Plus className="size-3.5" /> New chat
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {list.isPending ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : list.error ? (
          <ErrorBanner className="m-2" message={errorText(list.error)} />
        ) : conversations.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted">
            No conversations yet. Ask something to start one.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                active={c.id === activeId}
                onNavigate={onNavigate}
                onDelete={() => setDeleting(c)}
              />
            ))}
          </ul>
        )}
        {list.hasNextPage && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            loading={list.isFetchingNextPage}
            onClick={() => list.fetchNextPage()}
          >
            Load more
          </Button>
        )}
      </div>

      <DeleteDialog
        conversation={deleting}
        activeId={activeId}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function ConversationItem({
  conversation,
  active,
  onNavigate,
  onDelete,
}: {
  conversation: Conversation;
  active: boolean;
  onNavigate?: () => void;
  onDelete: () => void;
}) {
  const { stream } = useChat();
  const rename = useRenameConversation();
  const [title, setTitle] = useState<string | null>(null);
  const streaming = stream?.conversationId === conversation.id;
  const Icon = conversation.document_id ? FileText : MessageSquare;

  function save(e?: FormEvent) {
    e?.preventDefault();
    const next = title?.trim();
    setTitle(null);
    if (!next || next === conversation.title) return;
    rename.mutate(
      { id: conversation.id, title: next.slice(0, 100) },
      { onError: (err) => toast.error("Couldn't rename", { description: errorText(err) }) },
    );
  }

  if (title !== null) {
    return (
      <li>
        <form onSubmit={save} className="px-1 py-0.5">
          <input
            autoFocus
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => save()}
            onKeyDown={(e) => e.key === "Escape" && setTitle(null)}
            aria-label="Conversation title"
            className="h-9 w-full rounded-lg border border-accent bg-surface px-2.5 text-sm text-fg ring-4 ring-accent/15 focus:outline-none"
          />
        </form>
      </li>
    );
  }

  return (
    <li className="group relative">
      <Link
        href={`/chat/${conversation.id}`}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-lg py-2 pr-16 pl-2.5 text-sm transition-colors",
          active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2/60 hover:text-fg",
        )}
      >
        <Icon className={cn("size-4 shrink-0", active && "text-accent")} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{conversation.title}</span>
          <span className="block truncate text-xs text-subtle">
            {streaming ? "Answering…" : timeAgo(conversation.updated_at)}
          </span>
        </span>
        {streaming && <span className="size-2 shrink-0 animate-pulse rounded-full bg-accent" />}
      </Link>
      <div className="absolute inset-y-0 right-1.5 flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 max-md:opacity-100">
        <button
          onClick={() => setTitle(conversation.title)}
          title="Rename"
          aria-label={`Rename ${conversation.title}`}
          className="grid size-7 place-items-center rounded-md text-subtle hover:bg-surface hover:text-fg"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={streaming}
          title="Delete"
          aria-label={`Delete ${conversation.title}`}
          className="grid size-7 place-items-center rounded-md text-subtle hover:bg-surface hover:text-rose-600 disabled:opacity-40"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </li>
  );
}

function DeleteDialog({
  conversation,
  activeId,
  onClose,
}: {
  conversation: Conversation | null;
  activeId: number | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const remove = useDeleteConversation();

  return (
    <Dialog
      open={!!conversation}
      onClose={onClose}
      title="Delete this conversation?"
      description={
        <>
          <span className="font-medium text-fg">{conversation?.title}</span> and all its messages
          will be removed. This can&apos;t be undone.
        </>
      }
    >
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          loading={remove.isPending}
          onClick={() => {
            if (!conversation) return;
            const id = conversation.id;
            remove.mutate(id, {
              onSuccess: () => {
                toast.success("Conversation deleted");
                if (id === activeId) router.replace("/chat");
                onClose();
              },
              onError: (err) => toast.error("Couldn't delete", { description: errorText(err) }),
            });
          }}
        >
          Delete
        </Button>
      </div>
    </Dialog>
  );
}
