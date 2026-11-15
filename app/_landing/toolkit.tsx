"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Lock, Mic, Plus, Receipt } from "lucide-react";
import { buttonClass } from "@/components/button-class";
import { cn } from "@/lib/utils";
import { Eyebrow, GITHUB_URL, Lines } from "./bits";
import { at, useInView, useTyped } from "./motion";

export function Toolkit() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 0.2);
  return (
    <section id="features" className="relative overflow-hidden bg-[#06132f] py-24 text-white sm:py-32">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,rgb(23_66_190/0.75),transparent_70%)]" />
      <div ref={ref} data-in={inView ? "true" : "false"} className="relative mx-auto max-w-[1200px] px-5 sm:px-6">
        <div className="text-center">
          <div className="lp-a lp-rise" style={at(0, 0.5, { "--y": "12px" })}>
            <Eyebrow dark>Built for real work</Eyebrow>
          </div>
          <h2
            className="lp-display lp-a lp-rise mt-5 text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.05] font-extrabold"
            style={at(0.08)}
          >
            The rest of the toolkit.
          </h2>
          <p className="lp-a lp-rise mx-auto mt-4 max-w-[600px] text-[17px] leading-relaxed text-blue-100/70" style={at(0.16)}>
            Chat with your files and images, and keep every result private to your account.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-6">
          <Tile index={0} className="md:col-span-4" title="Chat with files and images" body="Streaming answers, image attachments and voice input, in one thread per document.">
            <ChatMini active={inView} />
          </Tile>
          <Tile index={1} className="md:col-span-2" title="Runs in the background" body="Uploads return straight away. A failed job is retried 3 times with backoff before it is marked FAILED.">
            <RetryRing />
          </Tile>
          <Tile index={2} className="md:col-span-2" title="OCR built in" body="Scanned PDFs, JPEG, PNG and TIFF are read before the model runs.">
            <OcrMini />
          </Tile>
          <Tile index={3} className="md:col-span-2" title="Private by default" body="Every file and result belongs to one account, with per-user storage.">
            <div className="flex flex-col items-center pt-2">
              <div className="grid size-24 place-items-center rounded-[26px] bg-gradient-to-b from-[#3b7bf0] to-[#1742be] shadow-[0_20px_40px_-10px_rgb(23_66_190/0.8)] ring-1 ring-white/20">
                <Lock className="size-9 text-white" strokeWidth={1.75} />
              </div>
              <span className="mt-4 rounded-full bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-300">
                scoped to your account
              </span>
            </div>
          </Tile>
          <Tile index={4} className="md:col-span-2" title="JSON & CSV export" body="Download structured results straight into your tools.">
            <JsonMini />
          </Tile>
        </div>
      </div>
    </section>
  );
}

function Tile({
  index,
  title,
  body,
  className,
  children,
}: {
  index: number;
  title: string;
  body: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "lp-a lp-rise flex flex-col rounded-[24px] border border-white/10 bg-[#0c1f4d]/70 p-6 sm:p-7",
        className,
      )}
      style={at(0.25 + index * 0.08, 0.8, { "--y": "40px" })}
    >
      <div className="flex min-h-[190px] flex-1 items-center justify-center">{children}</div>
      <h3 className="mt-6 text-[19px] font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-blue-100/65">{body}</p>
    </div>
  );
}

const CHAT_ANSWER = "The receipt totals €46.80, including €7.80 VAT. It was paid by card on 3 March.";

function ChatMini({ active }: { active: boolean }) {
  const { shown, done } = useTyped(CHAT_ANSWER, active, { delay: 1300, step: 32, chunk: 2 });
  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="ml-auto flex w-fit items-center gap-2.5 rounded-xl bg-[#1f6bff] py-1.5 pr-4 pl-1.5 text-sm">
        <span className="grid size-8 place-items-center rounded-lg bg-white/20">
          <Receipt className="size-4" />
        </span>
        What does this receipt total?
      </div>
      <div className="mt-3 min-h-[64px] max-w-[80%] rounded-xl bg-white/[0.07] px-4 py-3 text-sm leading-relaxed text-blue-50">
        {shown}
        {!done && active && <span className="ml-0.5 inline-block h-4 w-0.5 translate-y-0.5 animate-pulse bg-sky-300" />}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-blue-100/40">
        Ask anything…
        <span className="ml-auto grid size-7 place-items-center rounded-md bg-white/10 text-blue-100/70">
          <Plus className="size-3.5" />
        </span>
        <span className="grid size-7 place-items-center rounded-md bg-white/10 text-blue-100/70">
          <Mic className="size-3.5" />
        </span>
        <span className="grid size-7 place-items-center rounded-md bg-[#1f6bff] text-white">
          <ArrowUp className="size-3.5" />
        </span>
      </div>
    </div>
  );
}

function RetryRing() {
  const r = 70;
  const len = 2 * Math.PI * r;
  return (
    <div className="relative size-[180px]">
      <svg viewBox="0 0 180 180" className="size-full -rotate-90" aria-hidden>
        <circle cx="90" cy="90" r={r} fill="none" stroke="rgb(255 255 255 / 0.08)" strokeWidth="8" />
        <circle
          cx="90"
          cy="90"
          r={r}
          fill="none"
          stroke="#5aa9ff"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={len}
          className="lp-a lp-ring"
          style={at(0.6, 1.4, { "--len": len, strokeDashoffset: len * 0.25 })}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="lp-display text-5xl font-extrabold">3</p>
          <p className="mt-1 text-xs text-blue-100/70">retries with backoff</p>
        </div>
      </div>
    </div>
  );
}

function OcrMini() {
  return (
    <div className="relative w-full max-w-[290px] overflow-hidden rounded-xl bg-slate-100 p-5">
      <Lines widths={[66, 80, 95, 72, 84, 70]} className="[&>div]:bg-slate-300/80" />
      <span
        className="lp-a lp-sweep absolute inset-x-0 h-0.5 bg-sky-400 opacity-0 shadow-[0_0_14px_3px_rgb(56_189_248/0.5)]"
        style={at(0.9, 1.4)}
      />
      <span className="absolute right-3 bottom-3 rounded-md bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-white">
        Tesseract
      </span>
    </div>
  );
}

function JsonMini() {
  const lines: ReactNode[] = [
    "{",
    <>
      {"  "}&quot;vendor&quot;: <span className="text-sky-300">&quot;Acme Supplies Ltd&quot;</span>,
    </>,
    <>
      {"  "}&quot;total&quot;: <span className="text-sky-300">4820.00</span>,
    </>,
    <>
      {"  "}&quot;currency&quot;: <span className="text-sky-300">&quot;EUR&quot;</span>,
    </>,
    <>{"  "}&quot;line_items&quot;: [ … ]</>,
    "}",
  ];
  return (
    <div className="w-full">
      <pre className="font-mono text-[12px] leading-relaxed text-blue-50/90">
        {lines.map((l, i) => (
          <div key={i} className="lp-a lp-type w-fit" style={at(0.9 + i * 0.12, 0.35)}>
            {l}
          </div>
        ))}
      </pre>
      <div className="mt-4 flex flex-wrap gap-2">
        {["invoice_0423.json", "invoice_0423.csv"].map((f, i) => (
          <span
            key={f}
            className="lp-a lp-pop inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[11px]"
            style={at(1.8 + i * 0.1, 0.4)}
          >
            <ArrowDown className="size-3" /> {f}
          </span>
        ))}
      </div>
    </div>
  );
}

export function FinalCta() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, 0.35);
  return (
    <section className="px-5 pt-24 pb-20 sm:px-6 sm:pt-28">
      <div ref={ref} data-in={inView ? "true" : "false"} className="mx-auto max-w-[1200px]">
        <div
          className="lp-a lp-panel relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#2a6ff2] via-accent to-[#11349a] px-6 py-20 text-center text-white shadow-[0_40px_80px_-30px_rgb(23_66_190/0.6)] sm:py-24"
          style={at(0, 0.9)}
        >
          <div className="lp-a lp-dotfield lp-dotmask pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.35)_1px,transparent_1.2px)] bg-size-[22px_22px]" style={at(0.2, 1.4)} />
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[700px] -translate-x-1/2 rounded-full bg-white/25 blur-[90px]" />
          <h2 className="lp-display relative text-[clamp(2.1rem,5vw,3.6rem)] leading-[1.05] font-extrabold">
            Process your first document
            <br />
            in a minute.
          </h2>
          <p className="relative mt-4 text-[17px] text-white/80">
            Create an account, drop in a file and watch the result arrive.
          </p>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(buttonClass("secondary", "lg"), "border-transparent bg-white px-6 text-accent hover:bg-white/90")}
            >
              Create your account <ArrowRight className="size-4" />
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonClass("ghost", "lg"), "border border-white/30 bg-white/10 px-6 text-white hover:bg-white/20 hover:text-white")}
            >
              View on GitHub <ArrowUpRight className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
