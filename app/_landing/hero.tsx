"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  FileStack,
  LayoutDashboard,
  ListFilter,
  MessagesSquare,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/logo";
import { useToken } from "@/lib/auth-store";
import { cn } from "@/lib/utils";
import { FileBadge, Pill, type FileKind, type PillTone } from "./bits";
import { at } from "./motion";

const DOCLING_URL = "https://github.com/docling-project/docling";

/** Fixed star positions ([x%, y px, size, opacity]) so server and client render the same sky. */
const STARS = Array.from({ length: 34 }, (_, i) => {
  const x = (i * 37.7) % 100;
  const y = 40 + ((i * 71) % 380);
  return [x, y, i % 5 === 0 ? 2 : 1, 0.25 + ((i * 13) % 10) / 20] as const;
});

/** Thin vertical light streaks in the dark sky. */
const STREAKS = [
  { left: "18%", top: 0, h: 160 },
  { left: "31%", top: 40, h: 120 },
  { left: "67%", top: 10, h: 190 },
  { left: "74%", top: 90, h: 110 },
  { left: "86%", top: 20, h: 140 },
];

export function Hero() {
  const token = useToken();

  return (
    <section id="product" className="relative overflow-x-clip bg-[linear-gradient(180deg,#cfe4ff_0%,#e8f2ff_45%,var(--bg)_100%)] pt-[88px]">
      <Sky />

      <div className="relative mx-auto max-w-[1200px] px-5 pt-12 text-center sm:px-6 sm:pt-14">
        <a
          href={DOCLING_URL}
          target="_blank"
          rel="noreferrer"
          className="lp-a lp-rise group inline-flex items-center gap-2 rounded-full bg-white/10 py-1 pr-3 pl-1 text-[13px] text-white/90 ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-white/15"
          style={at(0.1, 0.5, { "--y": "10px" })}
        >
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold tracking-wide text-brand-700">NEW</span>
          Now parsing with Docling
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>

        <h1 className="lp-serif mt-6 text-[clamp(2.6rem,6.2vw,5rem)] leading-[1.02] text-white">
          <span className="lp-a lp-rise block" style={at(0.2, 0.7, { "--y": "28px", "--b": "6px" })}>
            Turn stacks of files into
          </span>
          <span className="lp-a lp-rise block text-brand-300 italic" style={at(0.3, 0.7, { "--y": "28px", "--b": "6px" })}>
            structured data.
          </span>
        </h1>

        <p
          className="lp-a lp-rise mx-auto mt-5 max-w-[480px] text-[15px] leading-relaxed text-white/75 sm:text-base"
          style={at(0.5)}
        >
          Upload PDFs, Word files and scans. Get summaries, invoice fields and contract details in seconds.
        </p>

        <div className="lp-a lp-rise mt-7 flex items-center justify-center gap-3" style={at(0.65, 0.6, { "--y": "16px" })}>
          <Link
            href={token ? "/dashboard" : "/signup"}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-brand-950 shadow-[0_10px_30px_-10px_rgb(89_162_255/0.8)] transition-transform hover:-translate-y-0.5"
          >
            {token ? "Open dashboard" : "Start for free"} <ArrowRight className="size-4" />
          </Link>
          <a
            href="#how"
            className="inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur transition-colors hover:bg-white/10"
          >
            See how it works
          </a>
        </div>
      </div>

      <div className="relative mx-auto mt-12 max-w-[1240px] px-4 sm:mt-14 sm:px-6">
        <div className="lp-a lp-rise" style={at(0.8, 0.9, { "--y": "60px", "--b": "8px" })}>
          <DashboardMock />
        </div>
      </div>
    </section>
  );
}

/** Dark sky with a glowing horizon arc, fading into light blue below. */
function Sky() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] overflow-hidden" aria-hidden>
      {/* The dark dome; its lower edge is the bright arc. */}
      <div className="absolute top-[-1080px] left-1/2 h-[1720px] w-[max(2400px,190%)] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,#030a1f_0%,#06143a_62%,#0b2c86_80%,#1a63f0_91%,#59a2ff_97%,#bcdaff_100%)] shadow-[0_30px_120px_40px_rgb(47_128_255/0.55)]" />
      <div className="absolute top-[380px] left-1/2 h-[280px] w-[900px] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(89_162_255/0.55),transparent)] blur-2xl" />
      {STARS.map(([x, y, s, o], i) => (
        <span
          key={i}
          className={cn("absolute rounded-full bg-white", i % 4 === 0 && "animate-pulse")}
          style={{ left: `${x}%`, top: y, width: s, height: s, opacity: o }}
        />
      ))}
      {STREAKS.map((s) => (
        <span
          key={s.left}
          className="absolute w-px bg-gradient-to-b from-transparent via-brand-300/50 to-transparent"
          style={{ left: s.left, top: s.top, height: s.h }}
        />
      ))}
    </div>
  );
}

/** Builds a smooth SVG path through evenly spaced points (Catmull-Rom as cubic Béziers). */
function smooth(values: number[], width: number, height: number) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * width, height - ((v - min) / (max - min || 1)) * height]);
  return pts.reduce((d, [x, y], i) => {
    if (i === 0) return `M ${x} ${y}`;
    const [x0, y0] = pts[i - 2] ?? pts[i - 1];
    const [x1, y1] = pts[i - 1];
    const [x3, y3] = pts[i + 1] ?? [x, y];
    const c1 = [x1 + (x - x0) / 6, y1 + (y - y0) / 6];
    const c2 = [x - (x3 - x1) / 6, y - (y3 - y1) / 6];
    return `${d} C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${x} ${y}`;
  }, "");
}

const SPARK = [12, 18, 14, 22, 19, 27, 24, 31, 28, 36];
const BARS = [40, 65, 30, 80, 55, 95, 70];

const ROWS: { name: string; kind: FileKind; size: string; mode: string; status: PillTone; label: string; when: string; progress: number }[] = [
  { name: "invoice_0423.pdf", kind: "PDF", size: "2 pages · 184 KB", mode: "Invoice", status: "done", label: "Completed", when: "2 min ago", progress: 100 },
  { name: "lease_contract_v3.pdf", kind: "PDF", size: "14 pages · 1.2 MB", mode: "Contract", status: "processing", label: "Processing", when: "Just now", progress: 64 },
  { name: "q1_board_report.docx", kind: "DOC", size: "9 pages · 340 KB", mode: "Summary", status: "done", label: "Completed", when: "18 min ago", progress: 100 },
  { name: "receipt_scan_0091.tif", kind: "TIF", size: "1 page · 2.4 MB", mode: "Invoice", status: "queued", label: "Queued", when: "Just now", progress: 8 },
  { name: "statement_march.png", kind: "PNG", size: "1 page · 860 KB", mode: "Summary", status: "failed", label: "Failed", when: "1 h ago", progress: 0 },
];

const COLS = "grid-cols-[minmax(0,2.2fr)_1fr_0.9fr] sm:grid-cols-[minmax(0,2.2fr)_0.9fr_1fr_1.3fr_0.9fr_1.5rem]";

/** A flat, full-size view of the app: sidebar, tabs, stat cards, filters and the documents table. */
function DashboardMock() {
  return (
    <div
      className="overflow-hidden rounded-[28px] bg-white text-left shadow-[0_60px_120px_-40px_rgb(11_27_69/0.55)] ring-1 ring-brand-900/5"
      style={{ maskImage: "linear-gradient(to bottom, black 80%, transparent)" }}
    >
      <div className="flex">
        <aside className="hidden w-[220px] shrink-0 flex-col border-r border-line p-5 md:flex">
          <div className="flex items-center gap-2">
            <LogoMark className="size-7" />
            <span className="text-[15px] font-semibold text-fg">DocFlow</span>
          </div>
          <nav className="mt-8 space-y-1 text-[14px] text-muted">
            {(
              [
                [LayoutDashboard, "Dashboard", false, null],
                [FileStack, "Documents", true, 12],
                [MessagesSquare, "Chat", false, null],
                [Sparkles, "Ask a PDF", false, null],
                [Settings, "Settings", false, null],
              ] as const
            ).map(([Icon, label, active, badge]) => (
              <div
                key={label}
                className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2.5", active && "bg-brand-50 font-semibold text-brand-700")}
              >
                <Icon className="size-[18px]" />
                {label}
                {badge !== null && <span className="ml-auto rounded-md bg-surface-2 px-1.5 text-[11px] text-muted">{badge}</span>}
              </div>
            ))}
          </nav>
          <div className="mt-auto flex items-center gap-2.5 rounded-xl border border-line p-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-[11px] font-semibold text-white">
              AK
            </span>
            <div className="min-w-0 text-[12px]">
              <p className="font-semibold text-fg">Alex Kim</p>
              <p className="truncate text-subtle">alex@acme.io</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <h2 className="lp-display text-[22px] font-bold text-fg sm:text-[26px]">Documents</h2>
            <div className="flex gap-2">
              <span className="hidden h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[13px] font-medium text-fg sm:inline-flex">
                <Upload className="size-4" /> Import
              </span>
              <span className="inline-flex h-9 items-center gap-1.5 rounded-full bg-brand-600 px-3.5 text-[13px] font-semibold text-white">
                <Plus className="size-4" /> New document
              </span>
            </div>
          </div>

          <div className="mt-5 flex gap-5 border-b border-line text-[13px] text-muted">
            {["Overview", "Summaries", "Invoices", "Contracts"].map((t, i) => (
              <span key={t} className={cn("relative pb-3", i === 0 && "font-semibold text-fg", i > 1 && "hidden sm:inline")}>
                {t}
                {i === 0 && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-600" />}
              </span>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <StatCard label="Documents processed" value="1,248" change="19%">
              <svg viewBox="0 0 100 36" className="h-9 w-24" preserveAspectRatio="none" aria-hidden>
                <path d={`${smooth(SPARK, 100, 30)} L 100 36 L 0 36 Z`} className="fill-brand-500/10" />
                <path
                  d={smooth(SPARK, 100, 30)}
                  fill="none"
                  strokeWidth="2"
                  pathLength={100}
                  strokeDasharray="100 100"
                  vectorEffect="non-scaling-stroke"
                  className="lp-a lp-dash stroke-brand-500"
                  style={{ ...at(1.2, 1.2), ["--len" as string]: 100 }}
                />
              </svg>
            </StatCard>
            <StatCard label="Runs completed" value="342" change="16%">
              <div className="flex h-9 items-end gap-1">
                {BARS.map((h, i) => (
                  <span
                    key={i}
                    className={cn("lp-a lp-grow w-2 rounded-full", i === 5 ? "bg-brand-600" : "bg-brand-200")}
                    style={{ height: `${h}%`, ...at(1.2 + i * 0.05, 0.6) }}
                  />
                ))}
              </div>
            </StatCard>
            <StatCard label="Success rate" value="97%" change="2%">
              <svg viewBox="0 0 44 26" className="h-9 w-14" aria-hidden>
                <path d="M 4 22 A 18 18 0 0 1 40 22" fill="none" strokeWidth="5" strokeLinecap="round" className="stroke-surface-2" />
                <path
                  d="M 4 22 A 18 18 0 0 1 40 22"
                  fill="none"
                  strokeWidth="5"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray="97 100"
                  className="lp-a lp-dash stroke-brand-600"
                  style={{ ...at(1.3, 1.1), ["--len" as string]: 97 }}
                />
              </svg>
            </StatCard>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-[12px]">
            <Chip>Last 30 days</Chip>
            <Chip>PDF, DOCX +2</Chip>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-fg">
              <ListFilter className="size-3.5" /> More filters
            </span>
            <span className="ml-auto hidden h-8 w-52 items-center gap-2 rounded-full border border-line px-3 text-subtle lg:inline-flex">
              <Search className="size-3.5" /> Search documents
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-line">
            <div className={cn("grid gap-3 bg-surface-2 px-4 py-2.5 text-[11px] font-medium text-muted", COLS)}>
              <span>Document</span>
              <span className="hidden sm:block">Mode</span>
              <span>Status</span>
              <span className="hidden sm:block">Progress</span>
              <span className="text-right sm:text-left">Updated</span>
              <span className="hidden sm:block" />
            </div>
            {ROWS.map((r, i) => (
              <div
                key={r.name}
                className={cn("lp-a lp-rise grid items-center gap-3 border-t border-line px-4 py-3 text-[13px]", COLS)}
                style={at(1.3 + i * 0.07, 0.5, { "--y": "10px" })}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileBadge kind={r.kind} className="size-8 rounded-lg text-[9px]" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg">{r.name}</p>
                    <p className="truncate text-[11px] text-subtle">{r.size}</p>
                  </div>
                </div>
                <span className="hidden text-muted sm:block">{r.mode}</span>
                <span>
                  <Pill tone={r.status} className="text-[11px]">
                    {r.label}
                  </Pill>
                </span>
                <span className="hidden items-center gap-2 sm:flex">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className={cn(
                        "lp-a lp-fill block h-full rounded-full",
                        r.status === "done" ? "bg-emerald-500" : r.status === "failed" ? "bg-rose-400" : "bg-brand-500",
                      )}
                      style={{ width: `${r.progress || 4}%`, ...at(1.5 + i * 0.07, 0.8) }}
                    />
                  </span>
                  <span className="w-8 text-right text-[11px] text-subtle tabular-nums">{r.progress}%</span>
                </span>
                <span className="text-right text-[12px] text-subtle sm:text-left">{r.when}</span>
                <span className="hidden text-subtle sm:block">
                  {r.status === "failed" ? <RotateCcw className="size-4 text-rose-500" /> : <MoreVertical className="size-4" />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, children }: { label: string; value: string; change: string; children: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 rounded-2xl border border-line p-4">
      <div>
        <p className="text-[12px] text-muted">{label}</p>
        <p className="lp-display mt-1.5 text-[28px] leading-none font-bold text-fg tabular-nums">{value}</p>
        <span className="mt-2 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
          <ArrowUp className="size-3" /> {change}
        </span>
      </div>
      {children}
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-2 px-3 text-fg">
      {children} <X className="size-3.5 text-subtle" />
    </span>
  );
}
