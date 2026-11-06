"use client";

import { useState, type FormEvent } from "react";
import { Eye, History, Layers, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge, TypeBadge } from "@/components/badges";
import { ProcessingTypePicker } from "@/components/processing-type-picker";
import { Button, Card, CardHeader, ErrorBanner, Skeleton, Spinner, Textarea } from "@/components/ui";
import { useFilePreview, useReprocess } from "@/lib/queries";
import type { ProcessingJob, ProcessingRequest, ProcessingType } from "@/lib/types";
import { cn, errorText, fileExtension, formatDate, timeAgo } from "@/lib/utils";

export function ReprocessCard({
  documentId,
  onQueued,
}: {
  documentId: number;
  onQueued: (requestId: number) => void;
}) {
  const [type, setType] = useState<ProcessingType>("DOCUMENT_SUMMARY");
  const [instructions, setInstructions] = useState("");
  const reprocess = useReprocess(documentId);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    reprocess.mutate(
      { processing_type: type, instructions: instructions.trim() || undefined },
      {
        onSuccess: (res) => {
          toast.success("New run queued");
          setInstructions("");
          onQueued(res.processing_request_id);
        },
        onError: (e) => toast.error("Couldn't start run", { description: errorText(e) }),
      },
    );
  }

  return (
    <Card>
      <CardHeader icon={<RefreshCw className="size-4" />} title="Run again" description="Process this file with another mode." />
      <form onSubmit={onSubmit} className="space-y-4 p-5">
        <ProcessingTypePicker value={type} onChange={setType} compact />
        <Textarea
          placeholder="Optional instructions…"
          className="min-h-20"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
        <Button type="submit" className="w-full" loading={reprocess.isPending}>
          {!reprocess.isPending && <Play className="size-4" />} Start run
        </Button>
      </form>
    </Card>
  );
}

export function RunsCard({
  runs,
  loading,
  selectedId,
  onSelect,
}: {
  runs: ProcessingRequest[];
  loading: boolean;
  selectedId: number | undefined;
  onSelect: (id: number) => void;
}) {
  return (
    <Card>
      <CardHeader icon={<History className="size-4" />} title="Run history" description={`${runs.length} run${runs.length === 1 ? "" : "s"}`} />
      <div className="max-h-80 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : runs.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted">No runs yet.</p>
        ) : (
          runs.map((run) => (
            <button
              key={run.id}
              onClick={() => onSelect(run.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                run.id === selectedId ? "bg-accent-soft/70" : "hover:bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "font-mono text-xs",
                  run.id === selectedId ? "font-semibold text-accent" : "text-subtle",
                )}
              >
                v{run.version}
              </span>
              <div className="min-w-0 flex-1">
                <TypeBadge type={run.processing_type} />
                <p className="mt-0.5 text-[11px] text-subtle">{timeAgo(run.created_at)}</p>
              </div>
              <StatusBadge status={run.status} />
            </button>
          ))
        )}
      </div>
    </Card>
  );
}

const jobDot: Record<string, string> = {
  COMPLETED: "bg-emerald-500",
  FAILED: "bg-rose-500",
  DEAD_LETTER: "bg-rose-500",
  RETRYING: "bg-amber-500",
  RUNNING: "bg-accent animate-pulse",
  QUEUED: "bg-sky-500",
};

export function AttemptsCard({ jobs, loading }: { jobs: ProcessingJob[] | undefined; loading: boolean }) {
  return (
    <Card>
      <CardHeader icon={<Layers className="size-4" />} title="Worker attempts" description="Every attempt across all runs" />
      <div className="p-5">
        {loading ? (
          <Skeleton className="h-10" />
        ) : !jobs || jobs.length === 0 ? (
          <p className="text-sm text-muted">No attempts recorded yet.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-line pl-5">
            {jobs.map((job, i) => (
              <li key={i} className="relative">
                <span
                  className={cn(
                    "absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-surface",
                    jobDot[job.status] ?? "bg-subtle",
                  )}
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-fg">Attempt {job.attempt}</p>
                  <span className="text-[11px] font-medium tracking-wide text-muted uppercase">
                    {job.status.replace("_", " ").toLowerCase()}
                  </span>
                </div>
                <p className="text-[11px] text-subtle">
                  {formatDate(job.created_at)}
                  {job.completed_at && ` → ${formatDate(job.completed_at)}`}
                </p>
                {job.failure_reason && (
                  <p className="mt-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                    {job.failure_reason}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}

/** `page` opens a PDF at that page; `open` is controlled so citations can jump here. */
export function PreviewCard({
  fileId,
  name,
  open,
  onOpenChange,
  page,
}: {
  fileId: number;
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: number | null;
}) {
  const ext = fileExtension(name);
  // A renamed document can lose its extension; the Q&A copies are always PDFs.
  const isPdf = ext === "pdf" || !["docx", "png", "jpg", "jpeg", "tif", "tiff"].includes(ext);
  const previewable = isPdf || ["png", "jpg", "jpeg"].includes(ext);
  const preview = useFilePreview(fileId, open && previewable);

  return (
    <Card className="overflow-hidden">
      <CardHeader
        icon={<Eye className="size-4" />}
        title={page && isPdf ? `Original file · page ${page}` : "Original file"}
        description={previewable ? "Preview the uploaded document" : "Preview isn't available for this format — use Download."}
        action={
          previewable && (
            <Button variant="secondary" size="sm" onClick={() => onOpenChange(!open)}>
              {open ? "Hide" : "Show preview"}
            </Button>
          )
        }
      />
      {open && previewable && (
        <div className="bg-surface-2/50">
          {preview.error ? (
            <div className="p-5">
              <ErrorBanner message={errorText(preview.error)} />
            </div>
          ) : preview.isPending ? (
            <div className="grid h-96 place-items-center">
              <Spinner />
            </div>
          ) : isPdf ? (
            // Keyed by page: the viewer only reads #page when it loads.
            <iframe
              key={page ?? 0}
              src={page ? `${preview.data.url}#page=${page}` : preview.data.url}
              title={name}
              className="h-[640px] w-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL, next/image can't optimise it
            <img src={preview.data.url} alt={name} className="mx-auto max-h-[640px] object-contain p-4" />
          )}
        </div>
      )}
    </Card>
  );
}
