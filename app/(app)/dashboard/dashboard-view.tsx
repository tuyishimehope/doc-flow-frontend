"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, ArrowUpRight, FileText, MessagesSquare, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { at } from "@/app/_landing/at";
import { PageHeader } from "@/components/app-shell";
import { typeIcons } from "@/components/badges";
import { DocumentRow, DocumentRowSkeleton } from "@/components/document-row";
import { AiUsageCard } from "@/components/ai-usage-card";
import { Button, buttonClass, Card, EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
import { ACTIVE_STATUSES, useDocuments, useMe, useRetryRequest, useStats } from "@/lib/queries";
import type { ProcessingType, RecentFailure, UserStats } from "@/lib/types";
import { useCountUp } from "@/lib/use-count-up";
import { cn, errorText, PROCESSING_TYPES, timeAgo } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Count({ value }: { value: number }) {
  return <>{useCountUp(value)}</>;
}

function StatCard({
  label,
  value,
  hint,
  href,
  hero,
  loading,
  delay,
}: {
  label: string;
  value: number;
  hint?: string;
  href: string;
  hero?: boolean;
  loading: boolean;
  delay: number;
}) {
  return (
    <Link
      href={href}
      style={at(delay, 0.6)}
      className={cn(
        "lp-a lp-rise group relative flex flex-col overflow-hidden rounded-[22px] p-5 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 sm:p-6",
        hero
          ? "bg-gradient-to-b from-brand-950 via-brand-700 to-brand-500 text-white shadow-[0_18px_40px_-18px_rgb(47_79_222/.7)]"
          : "border border-line/70 bg-surface text-fg shadow-card hover:shadow-lg",
      )}
    >
      {hero && (
        <svg className="pointer-events-none absolute -top-16 -right-16 size-56 text-white/15" viewBox="0 0 100 100" aria-hidden>
          {[16, 28, 40].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
          ))}
        </svg>
      )}
      <div className="relative flex items-center justify-between gap-3">
        <p className={cn("text-[15px] font-semibold", hero ? "text-white" : "text-fg")}>{label}</p>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-full transition-transform duration-300 group-hover:rotate-45",
            hero ? "bg-white text-brand-600" : "border border-line bg-surface text-fg",
          )}
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      {loading ? (
        <Skeleton className={cn("mt-5 h-11 w-16", hero && "bg-white/25")} />
      ) : (
        <p className="lp-display relative mt-4 text-[44px] leading-none font-bold tracking-tight tabular-nums">
          <Count value={value} />
        </p>
      )}
      <p
        className={cn(
          "relative mt-4 inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium",
          hero ? "bg-white/15 text-white ring-1 ring-white/25" : "bg-surface-2 text-muted",
          loading && "invisible",
        )}
      >
        {hint ?? "—"}
      </p>
    </Link>
  );
}

/** A semicircle split into completed / in-progress / failed, drawing in on load. */
function SuccessGauge({ stats }: { stats: UserStats["processing_requests"] | undefined }) {
  const by = stats?.by_status ?? {};
  const completed = by.COMPLETED ?? 0;
  const failed = by.FAILED ?? 0;
  const running = ACTIVE_STATUSES.reduce((n, s) => n + (by[s] ?? 0), 0);
  const total = completed + failed + running;
  const rate = completed + failed > 0 ? Math.round((completed / (completed + failed)) * 100) : 0;
  const shownRate = useCountUp(rate, 1200);

  const segments = [
    { key: "completed", label: "Completed", count: completed, stroke: "stroke-accent", dot: "bg-accent" },
    { key: "running", label: "In progress", count: running, stroke: "stroke-brand-800 dark:stroke-brand-200", dot: "bg-brand-800 dark:bg-brand-200" },
    { key: "failed", label: "Failed", count: failed, stroke: "stroke-rose-500", dot: "bg-rose-500" },
  ];
  // Each segment is a dash along the same arc; gaps keep them readable as separate pieces.
  const gap = total > 0 && segments.filter((s) => s.count > 0).length > 1 ? 1.5 : 0;
  let offset = 0;
  const arcs = segments.map((s) => {
    const len = total > 0 ? (s.count / total) * 100 : 0;
    const arc = { ...s, start: offset, len: Math.max(0, len - gap) };
    offset += len;
    return arc;
  });
  const path = "M 14 64 A 50 50 0 0 1 114 64";

  return (
    <Card className="lp-a lp-rise flex flex-col p-5 sm:p-6" style={at(0.3, 0.6)}>
      <h2 className="text-lg font-semibold tracking-tight text-fg">Success rate</h2>
      <p className="mt-0.5 text-[13px] text-muted">Finished runs that completed</p>
      <div className="relative mx-auto mt-6 w-full max-w-[260px]">
        <svg viewBox="0 0 128 72" className="w-full overflow-visible" role="img" aria-label={`${rate}% of finished runs completed`}>
          <defs>
            <pattern id="gauge-hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="4" height="4" className="fill-surface-2" />
              <line x1="0" y1="0" x2="0" y2="4" className="stroke-line" strokeWidth="2" />
            </pattern>
            {/* One sweep reveals every segment in order. */}
            <mask id="gauge-reveal" maskUnits="userSpaceOnUse" x="-10" y="-10" width="148" height="100">
              <path
                d={path}
                fill="none"
                stroke="white"
                strokeWidth="20"
                pathLength={100}
                strokeDasharray="100 100"
                className="lp-a lp-dash"
                style={{ ...at(0.45, 1.2), ["--len" as string]: 100 }}
              />
            </mask>
          </defs>
          <path d={path} fill="none" stroke="url(#gauge-hatch)" strokeWidth="16" strokeLinecap="round" />
          <g mask="url(#gauge-reveal)">
            {arcs.map(
              (a) =>
                a.len > 0 && (
                  <path
                    key={a.key}
                    d={path}
                    fill="none"
                    pathLength={100}
                    strokeWidth="16"
                    strokeLinecap="round"
                    className={a.stroke}
                    strokeDasharray={`${a.len} 200`}
                    strokeDashoffset={-a.start}
                  />
                ),
            )}
          </g>
        </svg>
        <div className="absolute inset-x-0 bottom-0 text-center">
          <p className="lp-display text-[40px] leading-none font-bold text-fg tabular-nums">{stats ? `${shownRate}%` : "—"}</p>
        </div>
      </div>
      <ul className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={cn("size-2.5 rounded-full", s.dot)} />
            {s.label}
            <span className="font-semibold text-fg tabular-nums">{s.count}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const typeTones: Record<ProcessingType, string> = {
  DOCUMENT_SUMMARY: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  INVOICE_EXTRACTION: "bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  CONTRACT_METADATA: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

function RunsByType({ stats }: { stats: UserStats["processing_requests"] | undefined }) {
  const types = Object.keys(PROCESSING_TYPES) as ProcessingType[];
  const max = Math.max(1, ...types.map((t) => stats?.by_type[t] ?? 0));
  return (
    <Card className="lp-a lp-rise flex flex-col p-5 sm:p-6" style={at(0.4, 0.6)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">Runs by mode</h2>
          <p className="mt-0.5 text-[13px] text-muted">{stats ? `${stats.total} runs in total` : "Loading…"}</p>
        </div>
        <Link
          href="/documents/new"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
        >
          <Plus className="size-3.5" /> New
        </Link>
      </div>
      <ul className="mt-5 space-y-4">
        {types.map((type, i) => {
          const Icon = typeIcons[type];
          const count = stats?.by_type[type] ?? 0;
          return (
            <li key={type} className="flex items-center gap-3">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", typeTones[type])}>
                <Icon className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-fg">{PROCESSING_TYPES[type].label}</span>
                  {stats ? (
                    <span className="font-semibold text-fg tabular-nums">{count}</span>
                  ) : (
                    <Skeleton className="h-4 w-6" />
                  )}
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  {stats && count > 0 && (
                    <div
                      className="lp-a lp-fill h-full origin-left rounded-full bg-gradient-to-r from-brand-500 to-brand-700"
                      style={{ width: `${(count / max) * 100}%`, ...at(0.6 + i * 0.08, 0.8) }}
                    />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function AskCard() {
  return (
    <Link
      href="/chat"
      style={at(0.55, 0.6)}
      className="lp-a lp-rise group relative flex min-h-64 flex-col overflow-hidden rounded-[22px] bg-gradient-to-b from-brand-950 via-brand-800 to-brand-600 p-6 text-white shadow-card md:col-span-2 xl:col-span-1"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgb(157_176_247/.35),transparent_60%)]" />
      <svg className="pointer-events-none absolute -right-8 -bottom-10 size-48 text-white/10" viewBox="0 0 100 100" aria-hidden>
        {[14, 26, 38, 50].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
        ))}
      </svg>
      <span className="relative grid size-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20">
        <MessagesSquare className="size-[18px]" />
      </span>
      <p className="lp-display relative mt-auto pt-10 text-xl leading-snug font-bold">Ask DocFlow anything</p>
      <p className="relative mt-1.5 text-[13px] text-white/70">
        Chat with the assistant, attach images, or talk instead of typing.
      </p>
      <span className="relative mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-brand-700 transition-transform group-hover:translate-x-1">
        Open Chat <ArrowRight className="size-3.5" />
      </span>
    </Link>
  );
}

function FailureRow({ failure }: { failure: RecentFailure }) {
  const router = useRouter();
  const retry = useRetryRequest();
  return (
    <li className="flex items-start gap-3 px-5 py-3.5 sm:px-6">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
        <AlertTriangle className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/documents/${failure.document_id}`} className="block truncate text-sm font-medium text-fg hover:underline">
          {failure.document_name}
        </Link>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{failure.failure_reason ?? "Processing failed."}</p>
        <p className="mt-1 text-[11px] text-subtle">
          {PROCESSING_TYPES[failure.processing_type].short}
          {failure.failed_at && ` · ${timeAgo(failure.failed_at)}`}
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="rounded-full"
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

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3 sm:px-6 sm:pt-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function DashboardView() {
  const { data: me } = useMe();
  const stats = useStats();
  const recent = useDocuments({ limit: 5 });

  const s = stats.data;
  const runs = s?.processing_requests;
  const byStatus = runs?.by_status ?? {};
  const inProgress = ACTIVE_STATUSES.reduce((sum, st) => sum + (byStatus[st] ?? 0), 0);
  const completed = byStatus.COMPLETED ?? 0;
  const failed = byStatus.FAILED ?? 0;
  const loading = stats.isPending;

  return (
    <div>
      <div className="lp-a lp-fade" style={at(0, 0.5)}>
        <PageHeader
          title="Dashboard"
          description={
            <>
              {greeting()}
              {me ? `, ${me.first_name}` : ""}. Here&apos;s what&apos;s happening with your documents.
            </>
          }
          actions={
            <>
              <Link href="/documents/new" className={cn(buttonClass("primary"), "h-11 rounded-full px-5")}>
                <Plus className="size-4" /> New document
              </Link>
              <Link href="/documents/new?mode=ask" className={cn(buttonClass("secondary"), "h-11 rounded-full px-5")}>
                Ask a PDF
              </Link>
            </>
          }
        />
      </div>

      {stats.error && <ErrorBanner className="mb-4" message={errorText(stats.error)} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
        <StatCard
          hero
          label="Documents"
          href="/documents"
          value={s?.documents.total ?? 0}
          hint={s ? `${s.documents.active} active · ${s.documents.archived} archived` : undefined}
          loading={loading}
          delay={0.05}
        />
        <StatCard
          label="Completed runs"
          href="/documents"
          value={completed}
          hint={completed + failed > 0 ? `${Math.round((completed / (completed + failed)) * 100)}% success` : "No finished runs yet"}
          loading={loading}
          delay={0.12}
        />
        <StatCard
          label="In progress"
          href="/documents"
          value={inProgress}
          hint={inProgress > 0 ? "Updating live" : "Nothing running"}
          loading={loading}
          delay={0.19}
        />
        <StatCard
          label="Failed runs"
          href={failed > 0 ? "#failures" : "/documents"}
          value={failed}
          hint={failed > 0 ? "Retry below" : "All clear"}
          loading={loading}
          delay={0.26}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:mt-5 xl:grid-cols-4 xl:gap-5">
        <div className="lp-a lp-rise min-w-0 md:col-span-2" style={at(0.25, 0.6)}>
          <AiUsageCard className="h-full" />
        </div>
        <SuccessGauge stats={runs} />
        <RunsByType stats={runs} />

        <Card className="lp-a lp-rise min-w-0 overflow-hidden md:col-span-2 xl:col-span-3" style={at(0.5, 0.6)}>
          <SectionHeader
            title="Recent documents"
            description="Latest uploads and their most recent run"
            action={
              <Link
                href="/documents"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
              >
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
            <div className="divide-y divide-line/70">
              {recent.data.documents.map((doc) => <DocumentRow key={doc.id} doc={doc} />)}
            </div>
          )}
        </Card>
        <AskCard />

        {s && s.recent_failures.length > 0 && (
          <Card id="failures" className="lp-a lp-rise scroll-mt-24 overflow-hidden md:col-span-2 xl:col-span-4" style={at(0.6, 0.6)}>
            <SectionHeader title="Recent failures" description="Retry queues a new run with the same settings" />
            <ul className="divide-y divide-line/70">
              {s.recent_failures.map((f) => <FailureRow key={f.processing_request_id} failure={f} />)}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
