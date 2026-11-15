"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow, FileBadge, Lines, Pill, type PillTone } from "./bits";
import { at, Reveal, useScrollVar } from "./motion";

const STEPS: { title: string; body: string; visual: () => ReactNode }[] = [
  {
    title: "Upload",
    body: "Drop in a PDF, Word file or scan and pick what you need back. The request returns straight away with a run you can watch.",
    visual: UploadVisual,
  },
  {
    title: "Process in the background",
    body: "A worker extracts the text, runs OCR when needed and calls the model. Failed jobs retry 3 times with backoff.",
    visual: ProcessVisual,
  },
  {
    title: "Review and export",
    body: "Results are checked against a schema before you see them. Download them as JSON or CSV.",
    visual: ReviewVisual,
  },
  {
    title: "Ask the document",
    body: "Ask follow-up questions in plain language. Every answer cites the page it came from.",
    visual: AskVisual,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-10 pt-24 sm:pt-32">
      <Reveal className="mx-auto max-w-[1200px] px-5 text-center sm:px-6">
        <div className="lp-a lp-rise" style={at(0, 0.5, { "--y": "12px" })}>
          <Eyebrow>How it works</Eyebrow>
        </div>
        <h2 className="lp-display lp-a lp-rise mt-5 text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.05] font-extrabold text-fg" style={at(0.08)}>
          Upload and move on.
          <br />
          DocFlow does the <span className="lp-gradient-text">slow part.</span>
        </h2>
        <p className="lp-a lp-rise mx-auto mt-5 max-w-[580px] text-[17px] leading-relaxed text-muted" style={at(0.16)}>
          The request returns straight away. Workers pick up the job, retry if something fails, and the status
          updates live.
        </p>
      </Reveal>

      <PinnedSteps />
      <StackedSteps />
    </section>
  );
}

/** Large screens: the section pins while scrolling walks through the four steps. */
function PinnedSteps() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [fill, setFill] = useState(0);
  useScrollVar(ref, "--how", {
    start: 0,
    end: -2,
    onChange: (p) => {
      const scaled = Math.min(3.999, p * 4);
      setActive(Math.floor(scaled));
      setFill(scaled - Math.floor(scaled));
    },
  });

  return (
    <div ref={ref} className="relative mt-4 hidden h-[300vh] lg:block">
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-[440px_1fr] items-center gap-16 px-6">
          <ol>
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative border-t border-line py-6">
                <span
                  className="absolute -top-px left-0 h-0.5 bg-accent transition-[width] duration-150"
                  style={{ width: i < active ? "100%" : i === active ? `${Math.max(fill, 0.04) * 100}%` : "0%" }}
                />
                <div className="flex gap-6">
                  <span className={cn("pt-1 font-mono text-xs", i === active ? "text-accent" : "text-subtle")}>
                    0{i + 1}
                  </span>
                  <div>
                    <h3
                      className={cn(
                        "text-xl font-semibold tracking-tight transition-colors duration-300",
                        i === active ? "text-fg" : "text-subtle",
                      )}
                    >
                      {s.title}
                    </h3>
                    <div
                      className={cn(
                        "grid transition-[grid-template-rows,opacity] duration-400 ease-out",
                        i === active ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <p className="overflow-hidden pt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <Reveal threshold={0.4}>
          <Stage>
            {STEPS.map((s, i) => {
              const Visual = s.visual;
              return (
                <div
                  key={s.title}
                  aria-hidden={i !== active}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-500",
                    i === active ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  {/* Remount on becoming active so the step's animation plays again. */}
                  {i === active && <Visual />}
                </div>
              );
            })}
          </Stage>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

/** Small screens: the steps stack, each with its visual. */
function StackedSteps() {
  return (
    <div className="mx-auto mt-12 max-w-[640px] space-y-14 px-5 sm:px-6 lg:hidden">
      {STEPS.map((s, i) => {
        const Visual = s.visual;
        return (
          <Reveal key={s.title} threshold={0.3}>
            <span className="font-mono text-xs text-accent">0{i + 1}</span>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-fg">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
            <Stage className="mt-5 h-auto">
              <div className="flex justify-center p-4 sm:p-6">
                <Visual />
              </div>
            </Stage>
          </Reveal>
        );
      })}
    </div>
  );
}

function Stage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "lp-dots relative h-[440px] overflow-hidden rounded-[28px] border border-accent/10 bg-[#eaf2fe]",
        className,
      )}
    >
      {children}
    </div>
  );
}

// ---------- Step visuals ----------

function UploadVisual() {
  return (
    <div className="w-full max-w-[460px] rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-slate-900/5">
      <div className="lp-a lp-fade flex flex-col items-center rounded-xl border-2 border-dashed border-accent/40 bg-accent-soft/50 px-4 py-6 text-center">
        <CloudUpload className="size-6 text-accent" />
        <p className="mt-2 text-sm font-medium text-fg">Drop a file to upload</p>
        <p className="text-xs text-subtle">PDF, DOCX, JPG, PNG, TIFF · up to 10 MB</p>
      </div>
      <div className="lp-a lp-rise mt-4 flex items-center gap-3 rounded-xl border border-line p-3" style={at(0.25, 0.5, { "--y": "-40px" })}>
        <FileBadge kind="PDF" />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-fg">contract_lease.pdf</span>
            <span className="text-xs text-subtle">1.2 MB</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="lp-a lp-fill h-full rounded-full bg-accent" style={at(0.6, 0.9)} />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[13px]">
        {["Summary", "Invoice", "Contract"].map((t, i) => (
          <span
            key={t}
            className={cn(
              "lp-a lp-rise rounded-lg border px-3 py-2 text-center",
              t === "Contract" ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-muted",
            )}
            style={at(0.3 + i * 0.06, 0.5, { "--y": "8px" })}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="lp-a lp-pop mt-4 flex items-center justify-between rounded-lg bg-fg px-3 py-2 font-mono text-[12px] text-white" style={at(1.5, 0.4)}>
        <span>POST /documents</span>
        <span className="text-emerald-300">201 · 84 ms</span>
      </div>
    </div>
  );
}

function ProcessVisual() {
  const rows: { tone: PillTone; label: string; text: string; time: string }[] = [
    { tone: "queued", label: "Queued", text: "POST /documents · 201", time: "0.0s" },
    { tone: "processing", label: "Processing", text: "extract text · OCR · model", time: "1.4s" },
    { tone: "failed", label: "Failed", text: "model timeout", time: "6.1s" },
    { tone: "retry", label: "Retry 1/3", text: "backoff 2s", time: "8.1s" },
    { tone: "done", label: "Completed", text: "result saved", time: "11.9s" },
  ];
  const dot: Record<PillTone, string> = {
    queued: "bg-slate-500",
    processing: "bg-accent",
    failed: "bg-rose-500",
    retry: "bg-amber-500",
    done: "bg-emerald-500",
  };
  const workers = [
    { name: "worker-1", state: "done", w: 100, color: "bg-emerald-400", text: "text-emerald-300" },
    { name: "worker-2", state: "running", w: 62, color: "bg-sky-400", text: "text-sky-300" },
    { name: "worker-3", state: "retry 1/3", w: 30, color: "bg-amber-400", text: "text-amber-300" },
  ];
  return (
    <div className="flex w-full max-w-[640px] flex-col gap-4 sm:flex-row">
      <div className="min-w-0 flex-[1.6] rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-slate-900/5">
        <div className="flex items-center gap-2.5">
          <FileBadge kind="PDF" className="size-8 text-[9px]" />
          <div>
            <p className="text-sm font-semibold text-fg">contract_lease.pdf</p>
            <p className="text-[11px] text-subtle">Contract metadata · request #318</p>
          </div>
        </div>
        <ol className="relative mt-4 space-y-3">
          <span className="absolute top-2 bottom-2 left-[4.5px] w-px bg-line" />
          {rows.map((r, i) => (
            <li
              key={r.label}
              className={cn("lp-a relative flex items-center gap-3 rounded-lg", r.tone === "failed" ? "lp-flash" : "lp-rise")}
              style={at(0.15 + i * 0.35, r.tone === "failed" ? 0.9 : 0.4, { "--y": "8px" })}
            >
              <span className={cn("relative size-2.5 shrink-0 rounded-full ring-4 ring-white", dot[r.tone])} />
              <Pill tone={r.tone} className="text-[11px]">
                {r.label}
              </Pill>
              <span className="min-w-0 flex-1 truncate text-[12px] text-muted">{r.text}</span>
              <span className="font-mono text-[11px] text-subtle">{r.time}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="flex-1 rounded-2xl bg-[#0b1a3d] p-4 font-mono text-white shadow-xl shadow-slate-900/20">
        <p className="text-[10px] tracking-[0.16em] text-blue-200/70 uppercase">Workers</p>
        <div className="mt-3 space-y-2.5">
          {workers.map((w, i) => (
            <div key={w.name} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
              <div className="flex justify-between text-[11px]">
                <span>{w.name}</span>
                <span className={w.text}>{w.state}</span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-white/10">
                <div className={cn("lp-a lp-fill h-1 rounded-full", w.color)} style={{ width: `${w.w}%`, ...at(0.3 + i * 0.25, 1.4) }} />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-blue-200/60">Celery · Redis</p>
      </div>
    </div>
  );
}

function ReviewVisual() {
  const fields = [
    ["Parties", "Northwind Ltd · Lakeside Properties"],
    ["Effective date", "1 Apr 2026"],
    ["Expiry date", "31 Mar 2029"],
    ["Governing law", "England and Wales"],
    ["Termination", "60 days' written notice"],
  ];
  return (
    <div className="w-full max-w-[520px] rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-slate-900/5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-fg">Contract metadata</p>
        <Pill tone="done" className="lp-a lp-pop text-[11px]" style={at(0.9, 0.4)}>
          Schema valid
        </Pill>
      </div>
      <dl className="mt-3 divide-y divide-line text-[13px]">
        {fields.map(([k, v], i) => (
          <div key={k} className="lp-a lp-rise flex justify-between gap-4 py-2.5" style={at(0.1 + i * 0.1, 0.45, { "--y": "8px" })}>
            <dt className="text-subtle">{k}</dt>
            <dd className="truncate text-right font-mono text-[12px] text-fg">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="lp-a lp-rise mt-4 flex justify-end gap-2" style={at(0.8, 0.45, { "--y": "8px" })}>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white">
          <ArrowDown className="size-3.5" /> Export JSON
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-fg">
          <ArrowDown className="size-3.5" /> Export CSV
        </span>
      </div>
    </div>
  );
}

function AskVisual() {
  return (
    <div className="flex w-full max-w-[600px] gap-4">
      <div className="flex min-w-0 flex-[1.4] flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-xl shadow-slate-900/5">
        <p className="lp-a lp-rise ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-accent-soft px-3.5 py-2 text-[13px] text-fg" style={at(0.1, 0.45, { "--y": "8px" })}>
          How much notice is needed to terminate?
        </p>
        <div className="lp-a lp-rise rounded-xl border border-line bg-surface-2/50 p-3" style={at(0.5, 0.45, { "--y": "8px" })}>
          <p className="text-[13px] leading-relaxed text-fg">Either party must give 60 days&apos; written notice.</p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-subtle">
            Sources
            <span className="lp-a lp-pop rounded-md bg-accent px-2 py-0.5 font-mono text-white" style={at(1.0, 0.4)}>
              p. 2
            </span>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between rounded-xl border border-line px-3 py-2 text-[12px] text-subtle">
          Ask about this document…
          <span className="grid size-6 place-items-center rounded-md bg-accent text-white">
            <ArrowUp className="size-3.5" />
          </span>
        </div>
      </div>
      <div className="hidden w-[170px] shrink-0 rounded-2xl border border-line bg-surface-2 p-3 sm:block">
        <p className="text-[10px] text-subtle">Page 2 / 12</p>
        <div className="mt-2 rounded-md bg-surface p-3 shadow-sm">
          <p className="text-[8px] font-bold text-fg">9. TERMINATION</p>
          <Lines className="mt-2 space-y-1.5" widths={[90, 70, 84]} />
          <div className="lp-a lp-fill mt-2 rounded bg-amber-200/80 p-1" style={at(1.3, 0.6)}>
            <Lines className="space-y-1" widths={[95, 60]} />
          </div>
          <Lines className="mt-2 space-y-1.5" widths={[80, 88, 50, 76]} />
        </div>
      </div>
    </div>
  );
}
