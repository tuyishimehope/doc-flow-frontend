"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Download,
  FileQuestion,
  History,
  MessagesSquare,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { DocumentStatusBadge, FileIcon } from "@/components/badges";
import { Button, buttonClass, Card, Dialog, EmptyState, ErrorBanner, Input, Skeleton } from "@/components/ui";
import { ApiError, api, saveBlob } from "@/lib/api";
import {
  isActive,
  useDeleteDocument,
  useDocument,
  useJobs,
  useProcessingRequests,
  useUpdateDocument,
} from "@/lib/queries";
import type { Citation, DocFlowDocument } from "@/lib/types";
import { cn, errorText, fileExtension, formatDate } from "@/lib/utils";
import { AskPanel } from "./ask-panel";
import { AttemptsCard, PreviewCard, ReprocessCard, RunsCard } from "./side-cards";

type Tab = "processing" | "ask";

/** Only PDFs can be asked about; a renamed document may have lost its extension. */
const askable = (doc: DocFlowDocument) =>
  !["docx", "png", "jpg", "jpeg", "tif", "tiff"].includes(fileExtension(doc.name));
import { RunPanel } from "./run-panel";

export function DocumentDetailView({
  id,
  initialTab,
  initialConversationId,
  initialPage,
}: {
  id: number;
  initialTab: Tab | null;
  initialConversationId: number | null;
  initialPage: number | null;
}) {
  const router = useRouter();
  const document = useDocument(id);
  const requests = useProcessingRequests(id);
  const polling = !!requests.data?.some((r) => isActive(r.status));
  const jobs = useJobs(id, polling);
  const setStatus = useUpdateDocument();
  const rename = useUpdateDocument();
  const remove = useDeleteDocument();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newName, setNewName] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [chosenTab, setTab] = useState<Tab | null>(initialTab);
  const [preview, setPreview] = useState({ open: initialPage !== null, page: initialPage, jump: 0 });
  const previewRef = useRef<HTMLDivElement>(null);

  // A citation was clicked: bring the preview, now at that page, into view.
  useEffect(() => {
    if (preview.jump) previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [preview.jump]);

  if (document.error) {
    const notFound = document.error instanceof ApiError && document.error.status === 404;
    return (
      <Card>
        <EmptyState
          icon={<FileQuestion className="size-5" />}
          title={notFound ? "Document not found" : "Couldn't load this document"}
          description={notFound ? "It may have been deleted, or it belongs to another account." : errorText(document.error)}
          action={
            <Link href="/documents" className={buttonClass("secondary")}>
              <ArrowLeft className="size-4" /> Back to documents
            </Link>
          }
        />
      </Card>
    );
  }

  const doc = document.data;
  const runs = requests.data ?? [];
  const selected = runs.find((r) => r.id === selectedId) ?? runs[0];
  const canAsk = !!doc && askable(doc);
  // Q&A uploads have no runs, so they open on the Ask tab.
  const tab: Tab =
    chosenTab === "ask" || (!chosenTab && canAsk && requests.isSuccess && runs.length === 0) ? "ask" : "processing";

  const openCitation = (c: Citation) =>
    setPreview((p) => ({ open: true, page: c.page, jump: p.jump + 1 }));

  async function download() {
    if (!doc) return;
    setDownloading(true);
    try {
      saveBlob(await api.fileBlob(doc.file_id), doc.name);
    } catch (e) {
      toast.error("Download failed", { description: errorText(e) });
    } finally {
      setDownloading(false);
    }
  }

  function toggleArchive() {
    if (!doc) return;
    const next = doc.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
    setStatus.mutate(
      { id: doc.id, status: next },
      {
        onSuccess: () => toast.success(next === "ARCHIVED" ? "Document archived" : "Document restored"),
        onError: (e) => toast.error(errorText(e)),
      },
    );
  }

  function submitRename(e: FormEvent) {
    e.preventDefault();
    const name = newName?.trim();
    if (!doc || !name) return;
    if (name === doc.name) return setNewName(null);
    rename.mutate(
      { id: doc.id, name },
      {
        onSuccess: () => {
          toast.success("Document renamed");
          setNewName(null);
        },
      },
    );
  }

  function confirmRemove() {
    remove.mutate(id, {
      onSuccess: () => {
        toast.success("Document deleted");
        router.replace("/documents");
      },
      onError: (e) => toast.error("Couldn't delete", { description: errorText(e) }),
    });
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow={
          <Link href="/documents" className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-fg">
            <ArrowLeft className="size-3.5" /> Documents
          </Link>
        }
        title={
          doc ? (
            <span className="flex items-center gap-3">
              <FileIcon name={doc.name} className="size-9 text-[9px]" />
              <span className="truncate">{doc.name}</span>
              <button
                onClick={() => {
                  rename.reset();
                  setNewName(doc.name);
                }}
                aria-label="Rename document"
                title="Rename"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-fg"
              >
                <Pencil className="size-4" />
              </button>
              <DocumentStatusBadge status={doc.status} />
              <IndexBadge document={doc} />
            </span>
          ) : (
            <Skeleton className="h-9 w-72" />
          )
        }
        description={doc ? `Uploaded ${formatDate(doc.created_at)}` : undefined}
        actions={
          doc && (
            <>
              <Button variant="secondary" onClick={download} loading={downloading}>
                {!downloading && <Download className="size-4" />} Download
              </Button>
              <Button variant="secondary" onClick={toggleArchive} loading={setStatus.isPending}>
                {!setStatus.isPending &&
                  (doc.status === "ARCHIVED" ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />)}
                {doc.status === "ARCHIVED" ? "Restore" : "Archive"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="hover:text-rose-600" aria-label="Delete document">
                <Trash2 className="size-4" />
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {canAsk && (
            <div role="tablist" aria-label="Document views" className="inline-flex rounded-xl border border-line bg-surface p-1">
              {(
                [
                  ["processing", "Processing", Sparkles],
                  ["ask", "Ask questions", MessagesSquare],
                ] as const
              ).map(([value, label, Icon]) => (
                <button
                  key={value}
                  role="tab"
                  aria-selected={tab === value}
                  onClick={() => setTab(value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                    tab === value ? "bg-accent-soft text-accent" : "text-muted hover:text-fg",
                  )}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
          )}
          {tab === "ask" && doc ? (
            <AskPanel document={doc} initialConversationId={initialConversationId} onCitation={openCitation} />
          ) : requests.error ? (
            <ErrorBanner message={errorText(requests.error)} />
          ) : requests.isPending ? (
            <Card className="space-y-4 p-6">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-40 w-full" />
            </Card>
          ) : selected ? (
            <RunPanel
              key={selected.id}
              documentId={id}
              documentName={doc?.name ?? "document"}
              request={selected}
              jobs={jobs.data}
              isLatest={selected.id === runs[0]?.id}
              onQueued={setSelectedId}
            />
          ) : (
            <Card>
              <EmptyState
                icon={<History className="size-5" />}
                title="No processing runs yet"
                description="Start a run from the panel on the right."
              />
            </Card>
          )}
          {doc && (
            <div ref={previewRef} className="scroll-mt-6">
              <PreviewCard
                fileId={doc.file_id}
                name={doc.name}
                open={preview.open}
                page={preview.page}
                onOpenChange={(open) => setPreview((p) => ({ ...p, open }))}
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <ReprocessCard documentId={id} onQueued={setSelectedId} />
          <RunsCard runs={runs} loading={requests.isPending} selectedId={selected?.id} onSelect={setSelectedId} />
          <AttemptsCard jobs={jobs.data} loading={jobs.isPending} />
        </div>
      </div>

      <Dialog open={newName !== null} onClose={() => setNewName(null)} title="Rename document">
        <form onSubmit={submitRename}>
          {rename.error && <ErrorBanner className="mb-4" message={errorText(rename.error)} />}
          <Input
            aria-label="Document name"
            value={newName ?? ""}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={255}
            required
            autoFocus
          />
          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setNewName(null)}>
              Cancel
            </Button>
            <Button type="submit" loading={rename.isPending} disabled={!newName?.trim()}>
              Save
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this document?"
        description={
          <>
            <span className="font-medium text-fg">{doc?.name}</span> and its stored file will be removed. This
            can&apos;t be undone.
          </>
        }
      >
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          <AlertTriangle className="size-4 shrink-0" />
          Processing results for this document will no longer be accessible.
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmRemove} loading={remove.isPending}>
            Delete document
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function IndexBadge({ document: doc }: { document: DocFlowDocument }) {
  const status = doc.index_status;
  if (!status || status === "NONE") return null;
  const styles = {
    READY: ["Indexed", "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"],
    PROCESSING: ["Indexing…", "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20"],
    FAILED: ["Index failed", "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20"],
  } as const;
  const [label, className] = styles[status];
  return (
    <span
      title="Whether the text is split into passages for faster answers"
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", className)}
    >
      {label}
    </span>
  );
}
