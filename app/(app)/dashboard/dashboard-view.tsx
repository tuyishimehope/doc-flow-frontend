"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileStack,
  FileText,
  Loader,
  Plus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { typeIcons } from "@/components/badges";
import { DocumentRow, DocumentRowSkeleton } from "@/components/document-row";
import { AiUsageCard } from "@/components/ai-usage-card";
import { Button, buttonClass, Card, CardHeader, EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
import { ACTIVE_STATUSES, useDocuments, useMe, useRetryRequest, useStats } from "@/lib/queries";
import type { ProcessingStatus, ProcessingType, RecentFailure, UserStats } from "@/lib/types";
import { cn, errorText, PROCESSING_TYPES, timeAgo } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  loading,
}: {
  label: string;
  value: number | undefined;
  hint?: string;
  icon: typeof FileText;
  tone: string;
  loading: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <span className={cn("grid size-8 place-items-center rounded-lg", tone)}>
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-14" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight text-fg tabular-nums">{value ?? 0}</p>
      )}
      {hint && !loading && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

const statusSegments: { status: ProcessingStatus; label: string; color: string }[] = [
  { status: "COMPLETED", label: "Completed", color: "bg-emerald-500" },
  { status: "PROCESSING", label: "Processing", color: "bg-amber-500" },
  { status: "QUEUED", label: "Queued", color: "bg-sky-500" },
  { status: "PENDING", label: "Pending", color: "bg-slate-400" },
  { status: "FAILED", label: "Failed", color: "bg-rose-500" },
  { status: "CANCELLED", label: "Cancelled", color: "bg-zinc-400" },
];

function RunsBreakdown({ stats }: { stats: UserStats["processing_requests"] }) {
  const total = stats.total;
  const segments = statusSegments
    .map((s) => ({ ...s, count: stats.by_status[s.status] ?? 0 }))
    .filter((s) => s.count > 0);
  const maxType = Math.max(1, ...Object.values(stats.by_type).map((n) => n ?? 0));

  if (total === 0) {
    return <p className="p-5 text-sm text-muted">Run stats will appear after your first upload.</p>;
  }

  return (
    <div className="space-y-6 p-5">
      <div>
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface-2">
          {segments.map((s) => (
            <div
              key={s.status}
              className={cn("h-full first:rounded-l-full last:rounded-r-full", s.color)}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${s.label}: ${s.count}`}
            />
          ))}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          {segments.map((s) => (
            <li key={s.status} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={cn("size-2 rounded-full", s.color)} />
              {s.label}
              <span className="font-medium text-fg tabular-nums">{s.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        {(Object.keys(PROCESSING_TYPES) as ProcessingType[]).map((type) => {
          const Icon = typeIcons[type];
          const count = stats.by_type[type] ?? 0;
          return (
            <div key={type} className="flex items-center gap-3">
              <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                <Icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-medium text-fg">{PROCESSING_TYPES[type].label}</span>
                  <span className="text-muted tabular-nums">{count}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-accent transition-[width] duration-500"
                    style={{ width: `${(count / maxType) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FailureRow({ failure }: { failure: RecentFailure }) {
  const router = useRouter();
  const retry = useRetryRequest();
  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-500" />
      <div className="min-w-0 flex-1">
        <Link href={`/documents/${failure.document_id}`} className="block truncate text-sm font-medium text-fg hover:underline">
          {failure.document_name}
        </Link>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
          {failure.failure_reason ?? "Processing failed."}
        </p>
        <p className="mt-1 text-[11px] text-subtle">
          {PROCESSING_TYPES[failure.processing_type].short}
          {failure.failed_at && ` · ${timeAgo(failure.failed_at)}`}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        loading={retry.isPending}
        onClick={() =>
          retry.mutate(failure.processing_request_id, {
            onSuccess: (res) => {
              toast.success("Retry queued");
              router.push(`/documents/${res.document_id}`);
            },
            onError: (e) => toast.error("Couldn't retry", { description: errorText(e) }),
          })
        }
      >
        {!retry.isPending && <RotateCcw className="size-3.5" />} Retry
      </Button>
    </li>
  );
}

export function DashboardView() {
  const { data: me } = useMe();
  const stats = useStats();
  const recent = useDocuments({ limit: 6 });

  const s = stats.data;
  const byStatus = s?.processing_requests.by_status ?? {};
  const inProgress = ACTIVE_STATUSES.reduce((sum, st) => sum + (byStatus[st] ?? 0), 0);
  const completed = byStatus.COMPLETED ?? 0;
  const failed = byStatus.FAILED ?? 0;
  const finished = completed + failed;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={
          <>
            {greeting()}
            {me ? `, ${me.first_name}` : ""}
          </>
        }
        description="Here's what's happening with your documents."
        actions={
          <Link href="/documents/new" className={buttonClass("primary")}>
            <Plus className="size-4" /> New document
          </Link>
        }
      />

      {stats.error && <ErrorBanner className="mb-4" message={errorText(stats.error)} />}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Documents"
          value={s?.documents.total}
          hint={s ? `${s.documents.active} active · ${s.documents.archived} archived` : undefined}
          icon={FileStack}
          tone="bg-accent-soft text-accent"
          loading={stats.isPending}
        />
        <Stat
          label="Processing runs"
          value={s?.processing_requests.total}
          hint={inProgress > 0 ? `${inProgress} in progress` : "None running"}
          icon={inProgress > 0 ? Loader : Sparkles}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
          loading={stats.isPending}
        />
        <Stat
          label="Completed"
          value={completed}
          hint={finished > 0 ? `${Math.round((completed / finished) * 100)}% success rate` : undefined}
          icon={CheckCircle2}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
          loading={stats.isPending}
        />
        <Stat
          label="Failed"
          value={failed}
          hint={failed > 0 ? "See recent failures below" : "All clear"}
          icon={AlertTriangle}
          tone="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
          loading={stats.isPending}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader
              title="Recent documents"
              description="Latest uploads and their most recent run"
              action={
                <Link href="/documents" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
                  View all <ArrowRight className="size-3.5" />
                </Link>
              }
            />
            {recent.error ? (
              <div className="p-5">
                <ErrorBanner message={errorText(recent.error)} />
              </div>
            ) : recent.isPending ? (
              <div className="divide-y divide-line">
                {Array.from({ length: 4 }, (_, i) => <DocumentRowSkeleton key={i} />)}
              </div>
            ) : recent.data.documents.length === 0 ? (
              <EmptyState
                icon={<FileText className="size-5" />}
                title="No documents yet"
                description="Upload your first PDF, Word document or scan to see DocFlow in action."
                action={
                  <Link href="/documents/new" className={buttonClass("primary")}>
                    <Plus className="size-4" /> Upload a document
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-line">
                {recent.data.documents.map((doc) => <DocumentRow key={doc.id} doc={doc} />)}
              </div>
            )}
          </Card>

          <AiUsageCard />

          {s && s.recent_failures.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader title="Recent failures" description="Retry queues a new run with the same settings" />
              <ul className="divide-y divide-line">
                {s.recent_failures.map((f) => <FailureRow key={f.processing_request_id} failure={f} />)}
              </ul>
            </Card>
          )}
        </div>

        <Card className="self-start">
          <CardHeader title="Runs breakdown" description="By status and processing mode" />
          {stats.isPending ? (
            <div className="space-y-4 p-5">
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : s ? (
            <RunsBreakdown stats={s.processing_requests} />
          ) : null}
        </Card>
      </div>
    </div>
  );
}
