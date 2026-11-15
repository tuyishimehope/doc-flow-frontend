"use client";

import { useRef, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, LayoutGrid, MessagesSquare, Plus, Settings, TriangleAlert, Files, Sparkles, Bot } from "lucide-react";
import { buttonClass } from "@/components/button-class";
import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";
import { Eyebrow, FileBadge, Lines, Pill, type FileKind } from "./bits";
import { at, useScrollVar } from "./motion";

/** Where each file starts (scattered) and ends (stacked behind the logo), from the logo's centre. */
const PILE: { name: string; kind: FileKind; from: [number, number, number]; to: [number, number, number] }[] = [
  { name: "report_q1.docx", kind: "DOC", from: [-330, -40, 12], to: [-60, 20, -8] },
  { name: "contract_v3.pdf", kind: "PDF", from: [-300, -230, -22], to: [-70, -10, -4] },
  { name: "scan_0091.tif", kind: "TIF", from: [250, 140, -6], to: [10, -40, 4] },
  { name: "minutes.docx", kind: "DOC", from: [-40, 30, -9], to: [-30, -20, -6] },
  { name: "invoice_0423.pdf", kind: "PDF", from: [230, 20, 22], to: [60, 10, 6] },
  { name: "statement.png", kind: "PNG", from: [280, 100, 18], to: [50, 0, 10] },
];

/** JSON fields thrown out of the logo; [x, y, rotation] of where each one lands. */
const CHIPS: { key: string; value: string; to: [number, number, number] }[] = [
  { key: "vendor", value: '"Acme Supplies Ltd"', to: [300, -200, -6] },
  { key: "invoice_no", value: '"INV-0423"', to: [410, -110, -3] },
  { key: "date", value: '"2026-03-12"', to: [420, -20, 0] },
  { key: "total", value: "4820.00", to: [410, 70, 3] },
  { key: "line_items", value: "[ 2 ]", to: [340, 160, 6] },
];

const px = (n: number) => `${n}px`;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  useScrollVar(ref, "--hp", { start: 0, end: -0.7 });

  return (
    <section ref={ref} id="product" className="relative">
      {/* Glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-40 h-[1100px] bg-[radial-gradient(60%_55%_at_50%_30%,rgb(79_143_247/0.35),transparent_70%)]" />
      <div className="lp-columns pointer-events-none absolute inset-x-0 top-0 h-[900px]" />

      <div className="relative mx-auto max-w-[1200px] px-5 pt-14 text-center sm:px-6 sm:pt-20">
        <div className="lp-a lp-rise" style={at(0.8, 0.5, { "--y": "12px" })}>
          <Eyebrow>AI document processing</Eyebrow>
        </div>
        <h1 className="lp-display mt-6 text-[clamp(2.6rem,7.4vw,5.6rem)] leading-[1.02] font-extrabold text-fg">
          <span className="lp-a lp-rise block" style={at(0.9, 0.7, { "--y": "36px", "--b": "6px" })}>
            From stacks of files
          </span>
          <span className="lp-a lp-rise block" style={at(1.0, 0.7, { "--y": "36px", "--b": "6px" })}>
            to <span className="lp-gradient-text">structured data.</span>
          </span>
        </h1>
        <p
          className="lp-a lp-rise mx-auto mt-6 max-w-[680px] text-[17px] leading-relaxed text-muted sm:text-lg"
          style={at(1.35)}
        >
          Upload PDFs, Word documents and scans. DocFlow reads the text, runs the model in the background and
          returns summaries, invoice fields and contract metadata you can export.
        </p>

        <div
          className="lp-a lp-rise mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
          style={at(1.8)}
        >
          <Link
            href="/signup"
            className={cn(buttonClass("primary", "lg"), "h-13 px-7 shadow-lg shadow-accent/30")}
          >
            Start for free <ArrowRight className="size-4" />
          </Link>
          <a href="#how" className={cn(buttonClass("secondary", "lg"), "h-13 px-6 shadow-card")}>
            <span className="grid size-6 place-items-center rounded-full bg-accent-soft text-accent">
              <svg viewBox="0 0 10 10" className="size-2.5" aria-hidden>
                <path d="M2 1l7 4-7 4z" fill="currentColor" />
              </svg>
            </span>
            See how it works
          </a>
        </div>

        <div
          className="lp-a lp-rise mt-7 flex flex-wrap items-center justify-center gap-2 text-sm text-subtle"
          style={at(1.9)}
        >
          Reads
          {["PDF", "DOCX", "JPEG", "PNG", "TIFF"].map((f) => (
            <span key={f} className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-xs text-fg">
              {f}
            </span>
          ))}
          <span>· OCR for scans</span>
        </div>

        <Intro />
      </div>

      <HeroProduct />
    </section>
  );
}

/** The 2-second opening: files pile up, fold into the logo, and fields fly out. */
function Intro() {
  return (
    <div className="pointer-events-none absolute top-[400px] left-1/2 size-0 scale-[0.55] sm:top-[470px] sm:scale-100" aria-hidden>
      {PILE.map((f, i) => (
        <div
          key={f.name}
          className="lp-a lp-pile absolute -top-[145px] -left-[115px] h-[290px] w-[230px] rounded-2xl border border-line bg-surface p-5 text-left shadow-xl shadow-slate-900/10"
          style={at(i * 0.04, 1.5, {
            "--x0": px(f.from[0]),
            "--y0": px(f.from[1]),
            "--r0": `${f.from[2]}deg`,
            "--x1": px(f.to[0]),
            "--y1": px(f.to[1]),
            "--r1": `${f.to[2]}deg`,
          })}
        >
          <FileBadge kind={f.kind} className="size-10" />
          <p className="mt-3 text-[15px] font-semibold text-fg">{f.name}</p>
          <Lines className="mt-5" widths={[92, 80, 88, 70, 84, 60]} />
        </div>
      ))}

      <div className="lp-a lp-logo absolute -top-[68px] -left-[68px]" style={at(0.8, 1.25)}>
        <div className="grid size-[136px] place-items-center rounded-[36px] bg-gradient-to-b from-[#4f8ff7] to-accent shadow-2xl shadow-accent/40">
          <div className="flex h-[70px] w-[56px] flex-col justify-center gap-2 rounded-lg bg-white px-3">
            <span className="h-[5px] rounded-full bg-accent" />
            <span className="h-[5px] rounded-full bg-accent" />
            <span className="h-[5px] w-2/3 rounded-full bg-accent" />
          </div>
        </div>
      </div>

      <div className="hidden md:block">
        {CHIPS.map((c, i) => (
          <div
            key={c.key}
            className="lp-a lp-chip absolute -translate-y-1/2 rounded-xl border border-line bg-surface px-3.5 py-2 font-mono text-[14px] whitespace-nowrap shadow-lg shadow-slate-900/10"
            style={{
              left: px(c.to[0] - 120),
              top: px(c.to[1]),
              ...at(1.15 + i * 0.06, 1.0, {
                "--cx": px(-(c.to[0] - 60)),
                "--cy": px(-c.to[1]),
                "--cr": `${c.to[2]}deg`,
              }),
            }}
          >
            <span className="text-accent">{c.key}</span>
            <span className="text-subtle"> : </span>
            <span className="text-fg">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The dashboard window with the request and result cards floating over it. */
function HeroProduct() {
  const tilt: CSSProperties = {
    transform:
      "perspective(1800px) rotateX(calc((1 - var(--hp, 0)) * 8deg)) scale(calc(0.96 + var(--hp, 0) * 0.04))",
    transformOrigin: "50% 0%",
  };
  return (
    <div className="relative mx-auto mt-14 max-w-[1200px] px-5 sm:mt-16 sm:px-6">
      <div className="lp-parallax relative mx-auto max-w-[1060px]" style={tilt}>
        <div className="lp-a lp-rise" style={at(1.7, 0.9, { "--y": "60px", "--b": "8px" })}>
          <DashboardMock />
        </div>
      </div>

      <div
        className="lp-parallax pointer-events-none absolute top-[130px] left-0 hidden lg:block xl:-left-6"
        style={{ transform: "translateY(calc(var(--hp, 0) * -70px))" }}
      >
        <div className="lp-a lp-rise" style={at(2.1, 0.7, { "--y": "30px" })}>
          <RequestCard />
        </div>
      </div>

      <div
        className="lp-parallax pointer-events-none absolute top-[70px] right-0 hidden lg:block xl:-right-6"
        style={{ transform: "translateY(calc(var(--hp, 0) * -40px))" }}
      >
        <div className="lp-a lp-rise" style={at(2.2, 0.7, { "--y": "30px" })}>
          <InvoiceCard />
        </div>
      </div>

      <div
        className="lp-parallax pointer-events-none absolute right-24 bottom-10 hidden lg:block"
        style={{ transform: "translateY(calc(var(--hp, 0) * -110px))" }}
      >
        <div
          className="lp-a lp-pop flex items-center gap-3 rounded-2xl bg-slate-700/90 px-4 py-3 text-[15px] text-white shadow-2xl backdrop-blur"
          style={at(3.5, 0.45)}
        >
          <span className="rounded-md bg-white/15 px-2 py-0.5 font-mono text-sm text-blue-100">p. 2</span>
          “Payment due within 30 days”
        </div>
      </div>
    </div>
  );
}

function RequestCard() {
  return (
    <div className="w-[300px] rounded-2xl border border-line bg-surface p-5 text-left shadow-2xl shadow-slate-900/10">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-subtle uppercase">New request</p>
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 p-3">
        <FileBadge kind="PDF" />
        <div>
          <p className="text-sm font-semibold text-fg">invoice_0423.pdf</p>
          <p className="text-xs text-subtle">2 pages · 184 KB</p>
        </div>
      </div>
      <div className="mt-3 flex gap-1.5 text-[13px]">
        {["Summary", "Invoice", "Contract"].map((t) => (
          <span
            key={t}
            className={cn(
              "rounded-lg border px-2.5 py-1.5",
              t === "Invoice" ? "border-accent/20 bg-accent-soft font-medium text-accent" : "border-line text-muted",
            )}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-subtle">
        <Pill tone="queued" className="lp-a lp-pop" style={at(2.4, 0.4)}>
          Queued
        </Pill>
        <ArrowRight className="lp-a lp-fade size-3" style={at(2.6, 0.3)} />
        <Pill tone="processing" className="lp-a lp-pop" style={at(2.8, 0.4)}>
          Processing
        </Pill>
        <ArrowRight className="lp-a lp-fade size-3" style={at(3.0, 0.3)} />
        <Pill tone="done" className="lp-a lp-pop" style={at(3.2, 0.4)}>
          Done
        </Pill>
      </div>
    </div>
  );
}

function InvoiceCard() {
  const rows = [
    ["Vendor", "Acme Supplies Ltd"],
    ["Invoice no.", "INV-0423"],
    ["Date", "12 Mar 2026"],
  ];
  return (
    <div className="w-[300px] rounded-2xl border border-line bg-surface p-5 text-left shadow-2xl shadow-slate-900/10">
      <div className="flex items-center gap-2">
        <p className="text-[15px] font-semibold text-fg">Invoice extraction</p>
        <Pill tone="done" className="lp-a lp-pop" style={at(3.3, 0.4)}>
          Completed
        </Pill>
      </div>
      <dl className="mt-2 text-sm">
        {rows.map(([k, v], i) => (
          <div
            key={k}
            className="lp-a lp-rise flex justify-between border-b border-line py-2.5"
            style={at(2.45 + i * 0.08, 0.5, { "--y": "8px" })}
          >
            <dt className="text-subtle">{k}</dt>
            <dd className="font-mono text-[13px] text-fg">{v}</dd>
          </div>
        ))}
        <div className="lp-a lp-rise flex justify-between py-2.5" style={at(2.69, 0.5, { "--y": "8px" })}>
          <dt className="text-subtle">Total</dt>
          <dd className="font-mono text-[13px] font-semibold text-accent">€ 4,820.00</dd>
        </div>
      </dl>
      <div className="lp-a lp-fade mt-2 flex gap-2" style={at(2.9)}>
        <span className="rounded-lg bg-fg px-3 py-1.5 font-mono text-xs text-white">{"{ }"} JSON</span>
        <span className="rounded-lg border border-line px-3 py-1.5 font-mono text-xs text-fg">CSV</span>
      </div>
    </div>
  );
}

function DashboardMock() {
  const stats = [
    { label: "Documents", value: "128", note: "120 active · 8 archived", icon: Files, tone: "text-accent bg-accent-soft" },
    { label: "Processing runs", value: "342", note: "3 running", icon: Sparkles, tone: "text-amber-600 bg-amber-50" },
    { label: "Completed", value: "331", note: "97% success rate", icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Failed", value: "8", note: "2 retrying", icon: TriangleAlert, tone: "text-rose-600 bg-rose-50" },
  ];
  const bars = [38, 52, 44, 70, 58, 86, 64];
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/70 bg-white/70 p-1.5 text-left shadow-[0_40px_80px_-30px_rgb(23_66_190/0.35)] backdrop-blur">
      <div className="rounded-2xl border border-line bg-surface">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-rose-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
          <span className="mx-auto rounded-md border border-line px-3 py-0.5 text-[11px] text-subtle">
            app.docflow · Overview
          </span>
        </div>
        <div className="flex">
          <aside className="hidden w-[150px] shrink-0 border-r border-line p-3 sm:block">
            <div className="flex items-center gap-1.5">
              <LogoMark className="size-5" />
              <span className="text-[12px] font-semibold text-fg">DocFlow</span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-1 rounded-md bg-accent py-1.5 text-[10px] font-medium text-white">
              <Plus className="size-3" /> New document
            </div>
            <nav className="mt-3 space-y-0.5 text-[11px] text-muted">
              {[
                [LayoutGrid, "Overview"],
                [FileText, "Documents"],
                [MessagesSquare, "Chat"],
                [Settings, "Settings"],
              ].map(([Icon, label], i) => {
                const I = Icon as typeof LayoutGrid;
                return (
                  <div
                    key={label as string}
                    className={cn("flex items-center gap-1.5 rounded-md px-2 py-1.5", i === 0 && "bg-surface-2 text-fg")}
                  >
                    <I className="size-3" /> {label as string}
                  </div>
                );
              })}
            </nav>
          </aside>
          <div className="min-w-0 flex-1 p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[15px] font-semibold text-fg">Good afternoon</p>
                <p className="text-[11px] text-subtle">Here&apos;s what&apos;s happening with your documents.</p>
              </div>
              <span className="hidden items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[10px] font-medium text-white sm:flex">
                <Plus className="size-3" /> New document
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {stats.map(({ label, value, note, icon: Icon, tone }) => (
                <div key={label} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between text-[10px] text-subtle">
                    {label}
                    <span className={cn("grid size-5 place-items-center rounded-md", tone)}>
                      <Icon className="size-3" />
                    </span>
                  </div>
                  <p className="mt-1.5 text-lg font-semibold text-fg tabular-nums">{value}</p>
                  <p className="text-[9px] text-subtle">{note}</p>
                </div>
              ))}
            </div>
            <div className="mt-2.5 grid gap-2.5 md:grid-cols-[1.6fr_1fr]">
              <div className="space-y-2.5">
                <div className="rounded-xl border border-line">
                  <div className="flex justify-between border-b border-line px-3 py-2">
                    <p className="text-[11px] font-semibold text-fg">Recent documents</p>
                    <p className="text-[10px] text-accent">View all →</p>
                  </div>
                  {[
                    ["invoice_0423.pdf", "Invoice", "done"],
                    ["contract_lease.pdf", "Contract", "processing"],
                  ].map(([name, mode, tone]) => (
                    <div key={name} className="flex items-center gap-2 px-3 py-2 text-[10px]">
                      <FileBadge kind="PDF" className="size-6 rounded-md text-[7px]" />
                      <span className="flex-1 truncate font-medium text-fg">{name}</span>
                      <span className="text-subtle">{mode}</span>
                      <Pill tone={tone as "done"} className="px-1.5 py-0.5 text-[9px]">
                        {tone === "done" ? "Completed" : "Processing"}
                      </Pill>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-1.5">
                    <Bot className="size-3.5 text-accent" />
                    <p className="text-[11px] font-semibold text-fg">AI usage</p>
                  </div>
                  <div className="mt-2 grid grid-cols-4 text-[9px] text-subtle">
                    {[
                      ["Answers", "86"],
                      ["Error rate", "1%"],
                      ["Typical response", "2.0 s"],
                      ["Tokens", "48k"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        {k}
                        <p className="text-[13px] font-semibold text-fg">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex h-14 items-end gap-1.5">
                    {bars.map((h, i) => (
                      <span
                        key={i}
                        className="flex-1 rounded-t bg-gradient-to-t from-accent/30 to-accent/80"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-line p-3">
                <p className="text-[11px] font-semibold text-fg">Runs breakdown</p>
                <p className="text-[9px] text-subtle">By status and processing mode</p>
                <div className="mt-3 flex h-1.5 overflow-hidden rounded-full">
                  <span className="w-[86%] bg-emerald-500" />
                  <span className="w-[8%] bg-accent" />
                  <span className="w-[6%] bg-rose-500" />
                </div>
                <div className="mt-3 space-y-2.5 text-[10px] text-fg">
                  {[
                    ["Document summary", 62],
                    ["Invoice extraction", 48],
                    ["Contract metadata", 30],
                  ].map(([label, w]) => (
                    <div key={label}>
                      <div className="flex justify-between">
                        {label}
                        <span className="text-subtle">{w}</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-surface-2">
                        <div className="h-1 rounded-full bg-accent" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
