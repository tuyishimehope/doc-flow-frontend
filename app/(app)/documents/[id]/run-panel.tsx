"use client";

import { useState } from "react";
import { Ban, Check, Copy, FileJson, FileSpreadsheet, RotateCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge, typeIcons } from "@/components/badges";
import { ResultView } from "@/components/result-view";
import { Button, Card, ErrorBanner, Skeleton } from "@/components/ui";
import { api, saveBlob } from "@/lib/api";
import { isActive, useCancelRequest, useResult } from "@/lib/queries";
import type { ProcessingJob, ProcessingRequest, ProcessingStatus } from "@/lib/types";
import { cn, errorText, PROCESSING_TYPES, timeAgo } from "@/lib/utils";

const steps: { key: ProcessingStatus; label: string }[] = [
  { key: "QUEUED", label: "Queued" },
  { key: "PROCESSING", label: "Reading & analysing" },
  { key: "COMPLETED", label: "Done" },
];

function stepIndex(status: ProcessingStatus) {
  if (status === "PENDING" || status === "QUEUED") return 0;
  if (status === "PROCESSING") return 1;
  return 2;
}

function ProgressSteps({ status }: { status: ProcessingStatus }) {
  const current = stepIndex(status);
  const failed = status === "FAILED" || status === "CANCELLED";
  return (
    <ol className="flex items-center gap-2">
      {steps.map((step, i) => {
        const done = i < current || (i === current && status === "COMPLETED");
        const active = i === current && isActive(status);
        const errored = failed && i === current;
        return (
          <li key={step.key} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className={cn(
                  "relative grid size-6 shrink-0 place-items-center rounded-full border text-[11px] font-semibold transition-colors",
                  done && "border-emerald-500 bg-emerald-500 text-white",
                  active && "border-accent bg-accent-soft text-accent",
                  errored && "border-rose-500 bg-rose-500 text-white",
                  !done && !active && !errored && "border-line text-subtle",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : errored ? <XCircle className="size-3.5" /> : i + 1}
                {active && <span className="absolute inset-0 animate-ping rounded-full border border-accent/60" />}
              </span>
              <span className={cn("truncate text-xs font-medium", done || active ? "text-fg" : "text-subtle")}>
                {errored ? (status === "FAILED" ? "Failed" : "Cancelled") : step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                    i < current ? "w-full bg-emerald-500" : "w-0",
                  )}
                />
                {active && <div className="absolute inset-y-0 w-1/3 animate-indeterminate rounded-full bg-accent/60" />}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function RunPanel({
  documentId,
  documentName,
  request,
  jobs,
  isLatest,
}: {
  documentId: number;
  documentName: string;
  request: ProcessingRequest;
  jobs: ProcessingJob[] | undefined;
  isLatest: boolean;
}) {
  const result = useResult(request);
  const cancel = useCancelRequest(documentId);
  const [exporting, setExporting] = useState<"json" | "csv" | null>(null);
  const [copied, setCopied] = useState(false);
  const Icon = typeIcons[request.processing_type];
  const meta = PROCESSING_TYPES[request.processing_type];

  // Jobs aren't linked to a request id in the API, so only surface failures on the latest run.
  const failure =
    request.status === "FAILED" && isLatest
      ? jobs?.find((j) => j.failure_reason)?.failure_reason
      : undefined;

  async function exportAs(format: "json" | "csv") {
    setExporting(format);
    try {
      const blob = await api.exportResult(request.id, format);
      const base = documentName.replace(/\.[^.]+$/, "");
      saveBlob(blob, `${base}-${meta.short.toLowerCase()}-v${request.version}.${format}`);
    } catch (e) {
      toast.error("Export failed", { description: errorText(e) });
    } finally {
      setExporting(null);
    }
  }

  async function copy() {
    if (!result.data) return;
    const r = result.data.result;
    await navigator.clipboard.writeText(typeof r === "string" ? r : JSON.stringify(r, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent">
              <Icon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-fg">{meta.label}</h2>
                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">
                  v{request.version}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">Started {timeAgo(request.created_at)}</p>
            </div>
          </div>
          <StatusBadge status={request.status} />
        </div>

        {request.instructions && (
          <p className="mt-4 rounded-xl border border-line bg-surface-2/50 px-3.5 py-2.5 text-[13px] leading-relaxed text-muted">
            <span className="font-medium text-fg">Instructions: </span>
            {request.instructions}
          </p>
        )}

        <div className="mt-5">
          <ProgressSteps status={request.status} />
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {isActive(request.status) ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="relative grid size-14 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent/15" />
              <span className="relative grid size-12 place-items-center rounded-full bg-accent-soft text-accent">
                <RotateCw className="size-5 animate-spin [animation-duration:2s]" />
              </span>
            </div>
            <p className="mt-4 text-sm font-medium text-fg">
              {request.status === "PROCESSING" ? "Extracting text and running the model…" : "Waiting for a worker…"}
            </p>
            <p className="mt-1 text-xs text-muted">This page updates automatically.</p>
            {request.status !== "PROCESSING" && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-5"
                loading={cancel.isPending}
                onClick={() =>
                  cancel.mutate(request.id, {
                    onSuccess: () => toast.success("Run cancelled"),
                    onError: (e) => toast.error(errorText(e)),
                  })
                }
              >
                <Ban className="size-3.5" /> Cancel run
              </Button>
            )}
          </div>
        ) : request.status === "FAILED" ? (
          <div className="space-y-3">
            <ErrorBanner message={failure ?? "Processing failed after all retries."} />
            <p className="text-xs text-muted">Try running it again from the panel on the right, or with different instructions.</p>
          </div>
        ) : request.status === "CANCELLED" ? (
          <p className="py-6 text-center text-sm text-muted">This run was cancelled before it started.</p>
        ) : result.error ? (
          <ErrorBanner message={errorText(result.error)} />
        ) : result.isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : (
          <>
            <ResultView result={result.data} />
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <p className="text-xs text-muted">AI-generated — verify important details against the source.</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={copy}>
                  {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => exportAs("json")} loading={exporting === "json"}>
                  {exporting !== "json" && <FileJson className="size-3.5" />} JSON
                </Button>
                <Button variant="secondary" size="sm" onClick={() => exportAs("csv")} loading={exporting === "csv"}>
                  {exporting !== "csv" && <FileSpreadsheet className="size-3.5" />} CSV
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
