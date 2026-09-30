"use client";

import { useState } from "react";
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
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { DocumentStatusBadge, FileIcon } from "@/components/badges";
import { Button, buttonClass, Card, Dialog, EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
import { ApiError, api, saveBlob } from "@/lib/api";
import {
  isActive,
  useDeleteDocument,
  useDocument,
  useJobs,
  useProcessingRequests,
  useSetDocumentStatus,
} from "@/lib/queries";
import { errorText, formatDate } from "@/lib/utils";
import { AttemptsCard, PreviewCard, ReprocessCard, RunsCard } from "./side-cards";
import { RunPanel } from "./run-panel";

export function DocumentDetailView({ id }: { id: number }) {
  const router = useRouter();
  const document = useDocument(id);
  const requests = useProcessingRequests(id);
  const polling = !!requests.data?.some((r) => isActive(r.status));
  const jobs = useJobs(id, polling);
  const setStatus = useSetDocumentStatus();
  const remove = useDeleteDocument();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [downloading, setDownloading] = useState(false);

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
              <DocumentStatusBadge status={doc.status} />
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
          {requests.error ? (
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
          {doc && <PreviewCard fileId={doc.file_id} name={doc.name} />}
        </div>

        <div className="space-y-6">
          <ReprocessCard documentId={id} onQueued={setSelectedId} />
          <RunsCard runs={runs} loading={requests.isPending} selectedId={selected?.id} onSelect={setSelectedId} />
          <AttemptsCard jobs={jobs.data} loading={jobs.isPending} />
        </div>
      </div>

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
