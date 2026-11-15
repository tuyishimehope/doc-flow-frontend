import { ArrowRight, FileCheck2, MessageSquareQuote, ScanText } from "lucide-react";
import { FileBadge, Pill, Sparkle } from "@/app/_landing/bits";
import { at } from "@/app/_landing/at";

const POINTS = [
  { icon: ScanText, text: "Reads PDFs, Word files and scans, with OCR built in" },
  { icon: FileCheck2, text: "Summaries, invoice fields and contract terms, checked against a schema" },
  { icon: MessageSquareQuote, text: "Ask questions and get answers that cite the page" },
];

/** The blue panel beside the auth forms: a small request playing out, then what DocFlow does. */
export function AuthShowcase() {
  return (
    <div className="relative hidden p-3 lg:block">
      <div className="relative flex h-full min-h-[640px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-br from-[#2a6ff2] via-[#1742be] to-[#0d2a7a] px-12 py-12 text-white xl:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.22)_1px,transparent_1.2px)] bg-size-[22px_22px] [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
        <div className="pointer-events-none absolute -top-40 -right-24 size-[520px] rounded-full bg-sky-300/30 blur-[120px]" />

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-blue-50 uppercase">
            <Sparkle className="text-sky-200" /> AI document processing
          </span>
          <h2 className="lp-display mt-6 max-w-md text-[2.6rem] leading-[1.05] font-extrabold xl:text-5xl">
            From stacks of files to <span className="text-sky-200">structured data.</span>
          </h2>
        </div>

        <div className="relative my-auto py-10">
          <div className="relative mx-auto max-w-[440px]">
            <RequestCard />
            <ResultCard />
            <div
              className="lp-a lp-pop absolute -bottom-6 left-2 flex items-center gap-2.5 rounded-xl bg-slate-900/85 px-3.5 py-2.5 text-[13px] shadow-2xl backdrop-blur"
              style={at(2.0, 0.45)}
            >
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 font-mono text-xs text-sky-200">p. 2</span>
              “Payment due within 30 days”
            </div>
          </div>
        </div>

        <ul className="relative grid gap-3 text-[14px] text-blue-50/90">
          {POINTS.map(({ icon: Icon, text }, i) => (
            <li key={text} className="lp-a lp-rise flex items-center gap-3" style={at(0.3 + i * 0.08, 0.5, { "--y": "8px" })}>
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                <Icon className="size-4" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RequestCard() {
  return (
    <div
      className="lp-a lp-rise w-[300px] rounded-2xl bg-white p-4 text-fg shadow-2xl shadow-slate-950/30"
      style={at(0.2, 0.6, { "--y": "24px" })}
    >
      <p className="text-[10px] font-semibold tracking-[0.16em] text-subtle uppercase">New request</p>
      <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 p-2.5">
        <FileBadge kind="PDF" className="size-8 text-[9px]" />
        <div>
          <p className="text-[13px] font-semibold">invoice_0423.pdf</p>
          <p className="text-[11px] text-subtle">2 pages · 184 KB</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-subtle">
        <Pill tone="queued" className="lp-a lp-pop text-[11px]" style={at(0.6, 0.35)}>
          Queued
        </Pill>
        <ArrowRight className="lp-a lp-fade size-3" style={at(0.8, 0.3)} />
        <Pill tone="processing" className="lp-a lp-pop text-[11px]" style={at(0.95, 0.35)}>
          Processing
        </Pill>
        <ArrowRight className="lp-a lp-fade size-3" style={at(1.15, 0.3)} />
        <Pill tone="done" className="lp-a lp-pop text-[11px]" style={at(1.3, 0.35)}>
          Done
        </Pill>
      </div>
    </div>
  );
}

function ResultCard() {
  const rows = [
    ["Vendor", "Acme Supplies Ltd"],
    ["Invoice no.", "INV-0423"],
    ["Due date", "11 Apr 2026"],
  ];
  return (
    <div
      className="lp-a lp-rise relative -mt-6 ml-auto w-[300px] rounded-2xl bg-white p-4 text-fg shadow-2xl shadow-slate-950/30"
      style={at(1.1, 0.6, { "--y": "24px" })}
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">Invoice extraction</p>
        <Pill tone="done" className="text-[11px]">
          Completed
        </Pill>
      </div>
      <dl className="mt-1.5 text-[13px]">
        {rows.map(([k, v], i) => (
          <div
            key={k}
            className="lp-a lp-rise flex justify-between border-b border-line py-2"
            style={at(1.35 + i * 0.08, 0.4, { "--y": "6px" })}
          >
            <dt className="text-subtle">{k}</dt>
            <dd className="font-mono text-[12px]">{v}</dd>
          </div>
        ))}
        <div className="lp-a lp-rise flex justify-between pt-2" style={at(1.6, 0.4, { "--y": "6px" })}>
          <dt className="text-subtle">Total</dt>
          <dd className="font-mono text-[12px] font-semibold text-accent">€ 4,820.00</dd>
        </div>
      </dl>
    </div>
  );
}
