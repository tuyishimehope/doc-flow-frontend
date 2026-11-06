"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";
import { buttonClass, Card, CardHeader, EmptyState, ErrorBanner, Skeleton } from "./ui";
import { useChatStats } from "@/lib/queries";
import type { ChatStats, DailyUsage } from "@/lib/types";
import { cn, errorText } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat();

function ms(value: number | null) {
  if (value === null) return "—";
  return value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(1)} s`;
}

// The API's `day` is a plain date; build it in local time so it doesn't shift a day.
function dayLabel(day: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, options);
}

/** The signed-in user's own chat and document-answer usage (GET /chat/stats). */
export function AiUsageCard() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);
  const stats = useChatStats(days);
  const s = stats.data;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        icon={<Bot className="size-4" />}
        title="AI usage"
        description="Your chat, image and document answers"
        action={
          <div role="radiogroup" aria-label="Time range" className="inline-flex shrink-0 rounded-lg border border-line p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={days === r}
                onClick={() => setDays(r)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  days === r ? "bg-surface-2 text-fg" : "text-muted hover:text-fg",
                )}
              >
                {r}d
              </button>
            ))}
          </div>
        }
      />
      {stats.error ? (
        <div className="p-5">
          <ErrorBanner message={errorText(stats.error)} />
        </div>
      ) : !s ? (
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
          <Skeleton className="h-40" />
        </div>
      ) : s.answers === 0 ? (
        <EmptyState
          icon={<Bot className="size-5" />}
          title={`No AI answers in the last ${days} days`}
          description="Ask something in Chat, or ask questions about a PDF."
          action={
            <Link href="/chat" className={buttonClass("secondary")}>
              Open Chat
            </Link>
          }
        />
      ) : (
        <div className={cn("@container p-5 transition-opacity", stats.isPlaceholderData && "opacity-60")}>
          <Tiles stats={s} />
          <TokensChart days={s.per_day} />
        </div>
      )}
    </Card>
  );
}

function Tiles({ stats: s }: { stats: ChatStats }) {
  const tiles = [
    {
      label: "Answers",
      value: full.format(s.answers),
      hint: [s.cancelled && `${s.cancelled} stopped`, s.errors && `${s.errors} failed`].filter(Boolean).join(" · ") || "All complete",
    },
    {
      label: "Error rate",
      value: `${(s.error_rate * 100).toFixed(s.error_rate > 0 && s.error_rate < 0.1 ? 1 : 0)}%`,
      hint: `${full.format(s.complete)} complete`,
    },
    {
      label: "Typical response",
      value: ms(s.latency.p50_ms),
      hint: `Slowest 5%: ${ms(s.latency.p95_ms)}`,
    },
    {
      label: "Tokens",
      value: compact.format(s.input_tokens + s.output_tokens),
      hint: `${compact.format(s.input_tokens)} in · ${compact.format(s.output_tokens)} out`,
    },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-5 @2xl:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="min-w-0">
          <dt className="text-xs font-medium text-muted">{t.label}</dt>
          <dd className="mt-1 text-xl font-semibold tracking-tight text-fg tabular-nums">{t.value}</dd>
          <dd className="mt-0.5 truncate text-xs text-subtle">{t.hint}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One series (tokens per day), so no legend: the heading names it. */
function TokensChart({ days }: { days: DailyUsage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const totals = days.map((d) => d.input_tokens + d.output_tokens);
  const max = Math.max(...totals, 1);
  const hovered = active !== null ? days[active] : null;

  return (
    <figure className="mt-7">
      <figcaption className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-fg">Tokens per day</span>
        <span className="text-xs text-subtle tabular-nums">max {compact.format(max)}</span>
      </figcaption>

      <div className="relative" onMouseLeave={() => setActive(null)}>
        {/* Recessive guide at the top of the scale. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
        <div className="flex h-36 items-end gap-[2px] border-b border-line">
          {days.map((d, i) => {
            const total = totals[i];
            return (
              <button
                key={d.day}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${dayLabel(d.day)}: ${full.format(total)} tokens, ${d.answers} answers`}
                // The whole column is the hit target, not just the bar.
                className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
              >
                <span
                  className={cn(
                    "w-full rounded-t-[4px] bg-accent transition-opacity",
                    active !== null && active !== i && "opacity-40",
                    "group-focus-visible:ring-2 group-focus-visible:ring-accent/40",
                  )}
                  style={{ height: total ? `max(${(total / max) * 100}%, 2px)` : 0 }}
                />
              </button>
            );
          })}
        </div>

        {hovered && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute -top-2 z-10 w-44 -translate-y-full rounded-xl border border-line bg-surface p-3 text-xs shadow-lg"
            style={{
              left: `clamp(0px, calc(${((active + 0.5) / days.length) * 100}% - 5.5rem), calc(100% - 11rem))`,
            }}
          >
            <p className="font-semibold text-fg">{dayLabel(hovered.day, { weekday: "short", month: "short", day: "numeric" })}</p>
            <dl className="mt-1.5 space-y-0.5 text-muted tabular-nums">
              <Row label="Answers" value={full.format(hovered.answers)} />
              <Row label="Input tokens" value={full.format(hovered.input_tokens)} />
              <Row label="Output tokens" value={full.format(hovered.output_tokens)} />
            </dl>
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-subtle">
        <span>{days[0] && dayLabel(days[0].day)}</span>
        <span>{days.at(-1) && dayLabel(days.at(-1)!.day)}</span>
      </div>

      <details className="mt-4 text-xs">
        <summary className="cursor-pointer font-medium text-muted hover:text-fg">Show as table</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-xl border border-line">
          <table className="w-full text-left tabular-nums">
            <thead className="sticky top-0 bg-surface-2 text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Day</th>
                <th className="px-3 py-2 text-right font-medium">Answers</th>
                <th className="px-3 py-2 text-right font-medium">Input</th>
                <th className="px-3 py-2 text-right font-medium">Output</th>
              </tr>
            </thead>
            <tbody className="text-fg">
              {days.map((d) => (
                <tr key={d.day} className="border-t border-line">
                  <td className="px-3 py-1.5">{dayLabel(d.day)}</td>
                  <td className="px-3 py-1.5 text-right">{full.format(d.answers)}</td>
                  <td className="px-3 py-1.5 text-right">{full.format(d.input_tokens)}</td>
                  <td className="px-3 py-1.5 text-right">{full.format(d.output_tokens)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className="text-fg">{value}</dd>
    </div>
  );
}
