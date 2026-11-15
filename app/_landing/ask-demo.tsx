"use client";

import { useRef } from "react";
import { ArrowUp, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow, Lines } from "./bits";
import { at, useInView, useTyped } from "./motion";

const ANSWER = "Payment is due within 30 days of the invoice date. A late fee of 1.5% per month applies to overdue amounts.";

export function AskSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 0.3);
  return (
    <section id="ask" className="relative pt-28 pb-28 sm:pt-36 sm:pb-36">
      <div
        ref={ref}
        data-in={inView ? "true" : "false"}
        className="mx-auto grid max-w-[1200px] items-center gap-14 px-5 sm:px-6 lg:grid-cols-[1fr_620px]"
      >
        <div>
          <div className="lp-a lp-rise" style={at(0, 0.5, { "--y": "12px" })}>
            <Eyebrow>Ask the document</Eyebrow>
          </div>
          <h2
            className="lp-display lp-a lp-rise mt-5 text-[clamp(2.1rem,4.2vw,3.4rem)] leading-[1.05] font-extrabold text-fg"
            style={at(0.08)}
          >
            <span className="block sm:whitespace-nowrap">Answers you can</span>
            <span className="block sm:whitespace-nowrap">
              <span className="lp-gradient-text">check</span> in one click.
            </span>
          </h2>
          <p className="lp-a lp-rise mt-5 max-w-[440px] text-[17px] leading-relaxed text-muted" style={at(0.16)}>
            DocFlow reads every page of the PDF before it answers. Every answer shows the page it came from,
            and clicking the chip opens the PDF right there.
          </p>
          <ul className="mt-10 space-y-3 text-[15px] text-fg">
            {["Page-level sources on every answer", "Works on scans through OCR", "PDFs up to 40 pages and 10 MB"].map(
              (t, i) => (
                <li key={t} className="lp-a lp-rise flex items-center gap-3" style={at(0.3 + i * 0.08, 0.45, { "--y": "8px" })}>
                  <span className="grid size-5 place-items-center rounded-full bg-accent-soft text-accent">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="lp-a lp-rise" style={at(0.2, 0.7, { "--y": "40px" })}>
          <AskDemo active={inView} />
        </div>
      </div>
    </section>
  );
}

function AskDemo({ active }: { active: boolean }) {
  const { shown, done } = useTyped(ANSWER, active, { delay: 900, step: 30, chunk: 3 });
  return (
    <div className="relative rounded-[28px] border border-line bg-surface p-4 shadow-[0_30px_60px_-30px_rgb(11_20_48/0.25)] sm:p-6">
      <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
        <div className="flex min-h-[420px] flex-col gap-4">
          <p
            className="lp-a lp-rise ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-accent-soft px-4 py-2.5 text-[15px] text-fg"
            style={at(0.45, 0.45, { "--y": "10px" })}
          >
            When is payment due, and is there a late fee?
          </p>
          <div className="rounded-2xl border border-line bg-surface-2/40 p-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="grid size-6 place-items-center rounded-md bg-accent text-xs font-bold text-white">D</span>
              <span className="font-semibold text-fg">DocFlow</span>
              <span className="truncate text-xs text-subtle">· lease_agreement.pdf</span>
            </div>
            <p className={cn("mt-3 min-h-[3.2em] text-[15px] leading-relaxed text-fg", !done && active && "streaming-caret")}>
              <span>{shown}</span>
            </p>
            <div className="mt-4 flex h-7 items-center gap-2 text-xs text-subtle">
              Sources
              {done && (
                <>
                  <span className="lp-a lp-pop inline-flex items-center gap-1 rounded-lg bg-accent px-2 py-1 font-mono text-white" style={at(0, 0.4)}>
                    <FileText className="size-3" /> p. 2
                  </span>
                  <span className="lp-a lp-pop inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 font-mono text-fg" style={at(0.12, 0.4)}>
                    <FileText className="size-3" /> p. 7
                  </span>
                </>
              )}
            </div>
            <p className={cn("mt-3 text-xs text-subtle transition-opacity duration-500", done ? "opacity-100" : "opacity-0")}>
              Click a page to open the PDF there
            </p>
          </div>
          <div className="mt-auto flex items-center justify-between rounded-2xl border border-line px-4 py-2.5 text-sm text-subtle">
            Ask anything about this document…
            <span className="grid size-8 place-items-center rounded-lg bg-accent text-white">
              <ArrowUp className="size-4" />
            </span>
          </div>
        </div>

        <PdfPane open={done} />
      </div>

      {done && (
        <svg
          className="pointer-events-none absolute inset-0 hidden size-full sm:block"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M 22 44 C 32 60, 60 62, 72 33"
            fill="none"
            stroke="var(--lp-sky)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
            pathLength={100}
            className="lp-a lp-dash"
            style={at(0.3, 0.7, { "--len": 100, strokeDashoffset: 0 })}
          />
        </svg>
      )}
    </div>
  );
}

function PdfPane({ open }: { open: boolean }) {
  return (
    <div className="hidden flex-col overflow-hidden rounded-2xl border border-line bg-surface-2 p-2.5 sm:flex">
      <div className="flex items-center gap-1.5 px-1 text-[11px] text-subtle">
        Page
        <span className="rounded border border-line bg-surface px-1.5 text-fg tabular-nums">{open ? 2 : 1}</span>/ 12
      </div>
      <div className="relative mt-2 h-[400px] overflow-hidden">
        <div
          className="space-y-3 transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
          style={{ transform: open ? "translateY(-262px)" : "none", transitionDelay: open ? "0.5s" : "0s" }}
        >
          <Page title="1. PARTIES" />
          <Page title="4. PAYMENT TERMS" highlight={open} />
          <Page title="5. LATE PAYMENT" />
        </div>
      </div>
    </div>
  );
}

function Page({ title, highlight }: { title: string; highlight?: boolean }) {
  return (
    <div className="h-[250px] rounded-md bg-surface p-3.5 shadow-sm">
      <p className="text-[9px] font-bold text-fg">{title}</p>
      <Lines className="mt-3 space-y-2" widths={[90, 74, 86, 66]} />
      <div className="relative mt-3 rounded p-1.5">
        {highlight && (
          <span className="lp-a lp-fill absolute inset-0 rounded bg-amber-200/80" style={at(1.1, 0.6)} />
        )}
        <Lines className="relative space-y-1.5" widths={[96, 88, 60]} />
      </div>
      <Lines className="mt-3 space-y-2" widths={[84, 92]} />
    </div>
  );
}
