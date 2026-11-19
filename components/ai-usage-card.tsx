"use client";

import { useState } from "react";
import Link from "next/link";
import { Bot } from "lucide-react";
import { at } from "@/app/_landing/at";
import { buttonClass, Card, EmptyState, ErrorBanner, Skeleton } from "./ui";
import { useChatStats } from "@/lib/queries";
import type { ChatStats, DailyUsage } from "@/lib/types";
import { cn, errorText } from "@/lib/utils";

const RANGES = [7, 30] as const;

const compact = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat();

function ms(value: number | null) {
  if (value === null) return "—";
  return value < 1000 ? `${value} ms` : `${(value / 1000).toFixed(1)} s`;
}

// The API's `day` is a plain date; build it in local time so it doesn't shift a day.
function toDate(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function dayLabel(day: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }) {
  return toDate(day).toLocaleDateString(undefined, options);
}

/** AI answers per day (GET /chat/stats), drawn as pill bars with hatching for quiet days. */
export function AiUsageCard({ className }: { className?: string }) {
  const [days, setDays] = useState<(typeof RANGES)[number]>(7);
  const stats = useChatStats(days);
  const s = stats.data;

  return (
    <Card className={cn("flex flex-col p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-fg">AI activity</h2>
          <p className="mt-0.5 text-[13px] text-muted">Chat, image and document answers per day</p>
        </div>
        <div role="radiogroup" aria-label="Time range" className="inline-flex shrink-0 rounded-full bg-surface-2 p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              role="radio"
              aria-checked={days === r}
              onClick={() => setDays(r)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-all",
                days === r ? "bg-surface text-fg shadow-sm" : "text-muted hover:text-fg",
              )}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {stats.error ? (
        <ErrorBanner className="mt-5" message={errorText(stats.error)} />
      ) : !s ? (
        <div className="mt-6 flex h-52 items-end gap-3">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="flex-1 rounded-full" style={{ height: `${40 + ((i * 37) % 50)}%` }} />
          ))}
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
        <div className={cn("flex flex-1 flex-col transition-opacity", stats.isPlaceholderData && "opacity-60")}>
          <Summary stats={s} />
          {/* Keyed by range so the bars grow again when it changes. */}
          <PillChart key={days} days={s.per_day} />
        </div>
      )}
    </Card>
  );
}

function Summary({ stats: s }: { stats: ChatStats }) {
  const items = [
    ["Answers", full.format(s.answers)],
    ["Typical response", ms(s.latency.p50_ms)],
    ["Error rate", `${(s.error_rate * 100).toFixed(s.error_rate > 0 && s.error_rate < 0.1 ? 1 : 0)}%`],
    ["Tokens", compact.format(s.input_tokens + s.output_tokens)],
  ];
  return (
    <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-baseline gap-1.5">
          <dt className="text-xs text-muted">{k}</dt>
          <dd className="text-sm font-semibold text-fg tabular-nums">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function PillChart({ days }: { days: DailyUsage[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...days.map((d) => d.answers), 1);
  const peak = days.findIndex((d) => d.answers === max);
  const dense = days.length > 10;
  const shown = active ?? peak;
  const tip = days[shown];

  return (
    <figure className="mt-auto pt-6">
      <div className="relative" onMouseLeave={() => setActive(null)}>
        <div className={cn("flex h-52 items-end", dense ? "gap-1" : "gap-2.5 sm:gap-4")}>
          {days.map((d, i) => {
            const empty = d.answers === 0;
            const height = empty ? 34 : 22 + (d.answers / max) * 78;
            const isTip = i === shown;
            return (
              <button
                key={d.day}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                aria-label={`${dayLabel(d.day)}: ${d.answers} answers, ${full.format(d.input_tokens + d.output_tokens)} tokens`}
                className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end focus:outline-none"
              >
                {isTip && (
                  <span className="lp-a lp-pop absolute z-10 -translate-y-2 rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-fg shadow-sm tabular-nums" style={{ bottom: `${height}%`, ...at(dense ? 0.5 : 0.7, 0.35) }}>
                    {d.answers}
                  </span>
                )}
                <span
                  className={cn(
                    "lp-a lp-grow w-full transition-[filter,opacity]",
                    dense ? "rounded-md" : "rounded-full",
                    empty
                      ? "hatch border border-line"
                      : i === peak
                        ? "bg-gradient-to-b from-brand-600 to-brand-800"
                        : "bg-gradient-to-b from-brand-400 to-brand-600",
                    active !== null && !isTip && "opacity-50",
                    "group-focus-visible:ring-2 group-focus-visible:ring-accent/40",
                  )}
                  style={{ height: `${height}%`, ...at(i * (dense ? 0.015 : 0.06), 0.7) }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className={cn("mt-3 flex text-[11px] font-medium text-subtle", dense ? "justify-between" : "gap-2.5 sm:gap-4")}>
        {dense ? (
          <>
            <span>{dayLabel(days[0].day)}</span>
            <span>{dayLabel(days.at(-1)!.day)}</span>
          </>
        ) : (
          days.map((d) => (
            <span key={d.day} className="flex-1 text-center">
              {dayLabel(d.day, { weekday: "short" }).slice(0, 2)}
            </span>
          ))
        )}
      </div>
      <figcaption className="mt-3 text-xs text-muted" aria-live="polite">
        {dayLabel(tip.day, { weekday: "long", month: "short", day: "numeric" })}: {full.format(tip.answers)} answers ·{" "}
        {full.format(tip.input_tokens + tip.output_tokens)} tokens
      </figcaption>

      <details className="mt-3 text-xs">
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
