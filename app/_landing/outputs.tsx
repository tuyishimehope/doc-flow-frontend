"use client";

import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow, Lines } from "./bits";
import { at, Reveal } from "./motion";

interface Output {
  tab: string;
  page: { title: string; sub: string };
  fields: { label: string; value: string; wide?: boolean; strong?: boolean }[];
  list: { title: string; rows: [string, string][] };
}

const OUTPUTS: Output[] = [
  {
    tab: "Document summary",
    page: { title: "REPORT", sub: "Q1 operations review" },
    fields: [
      { label: "Title", value: "Q1 operations review" },
      { label: "Pages", value: "14" },
      {
        label: "Summary",
        value:
          "Revenue rose 12% on the quarter while delivery times fell to 2.4 days. Two suppliers missed targets; the report recommends renegotiating both contracts before June.",
        wide: true,
        strong: true,
      },
    ],
    list: {
      title: "Key points",
      rows: [
        ["Revenue up 12% quarter on quarter", "p. 2"],
        ["Average delivery time 2.4 days", "p. 5"],
        ["Renegotiate two supplier contracts", "p. 11"],
      ],
    },
  },
  {
    tab: "Invoice extraction",
    page: { title: "INVOICE", sub: "Acme Supplies Ltd" },
    fields: [
      { label: "Vendor", value: "Acme Supplies Ltd" },
      { label: "Customer", value: "Northwind Traders" },
      { label: "Invoice date", value: "12 Mar 2026" },
      { label: "Due date", value: "11 Apr 2026" },
      { label: "Currency", value: "EUR" },
      { label: "Subtotal", value: "4,016.67" },
      { label: "Tax (20%)", value: "803.33" },
      { label: "Total", value: "4,820.00", strong: true },
    ],
    list: {
      title: "Line items",
      rows: [
        ["Steel brackets × 120", "1,440.00"],
        ["Mounting kit × 40", "2,576.67"],
      ],
    },
  },
  {
    tab: "Contract metadata",
    page: { title: "SERVICE AGREEMENT", sub: "Northwind Ltd · Lakeside Properties" },
    fields: [
      { label: "Parties", value: "Northwind Ltd, Lakeside Properties", wide: true },
      { label: "Effective date", value: "1 Apr 2026" },
      { label: "Expiry date", value: "31 Mar 2029" },
      { label: "Governing law", value: "England and Wales" },
      { label: "Renewal", value: "Auto, 12 months" },
      { label: "Termination", value: "60 days' written notice", wide: true, strong: true },
    ],
    list: {
      title: "Obligations",
      rows: [
        ["Tenant keeps the premises insured", "§ 6.2"],
        ["Landlord handles structural repairs", "§ 7.1"],
      ],
    },
  },
];

export function Outputs() {
  const [tab, setTab] = useState(1);
  const out = OUTPUTS[tab];
  return (
    <section className="relative pt-20 pb-8 sm:pt-24">
      <Reveal className="mx-auto max-w-[1200px] px-5 sm:px-6">
        <div className="text-center">
          <div className="lp-a lp-rise" style={at(0, 0.5, { "--y": "12px" })}>
            <Eyebrow>What you get back</Eyebrow>
          </div>
          <h2
            className="lp-display lp-a lp-rise mt-5 text-[clamp(2.1rem,4.6vw,3.6rem)] leading-[1.05] font-extrabold text-fg"
            style={at(0.08)}
          >
            Three jobs. One <span className="lp-gradient-text">structured</span> result.
          </h2>
          <p className="lp-a lp-rise mx-auto mt-5 max-w-[600px] text-[17px] leading-relaxed text-muted" style={at(0.16)}>
            Pick what the document is for. DocFlow validates the output against a schema before you see it.
          </p>
        </div>

        <div className="lp-a lp-rise mt-12 flex justify-center" style={at(0.24)}>
          <div role="tablist" className="flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 shadow-card">
            {OUTPUTS.map((o, i) => (
              <button
                key={o.tab}
                role="tab"
                aria-selected={i === tab}
                onClick={() => setTab(i)}
                className={cn(
                  "rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors sm:px-5",
                  i === tab ? "bg-fg text-white" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {o.tab}
              </button>
            ))}
          </div>
        </div>

        <div
          className="lp-a lp-rise mx-auto mt-6 max-w-[1100px] rounded-[28px] border border-line bg-surface p-4 shadow-[0_30px_60px_-30px_rgb(11_20_48/0.2)] sm:p-6"
          style={at(0.32, 0.7, { "--y": "40px" })}
        >
          {/* Keyed by tab so the scan and the fields replay on every switch. */}
          <div key={tab} role="tabpanel" className="grid gap-6 md:grid-cols-[360px_1fr]">
            <PageMock out={out} />
            <div className="min-w-0 py-2">
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold tracking-wide text-subtle">Fields</span>
                <span className="lp-a lp-pop inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700" style={at(1.2, 0.4)}>
                  <span className="size-1.5 rounded-full bg-emerald-500" /> Schema valid
                </span>
              </div>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {out.fields.map((f, i) => (
                  <div
                    key={f.label}
                    className={cn(
                      "lp-a lp-rise rounded-xl border px-3 py-2",
                      f.wide && "sm:col-span-2",
                      f.strong ? "border-accent/20 bg-accent-soft" : "border-line bg-surface-2/50",
                    )}
                    style={at(0.45 + i * 0.07, 0.45, { "--y": "8px" })}
                  >
                    <p className="text-xs text-subtle">{f.label}</p>
                    <p
                      className={cn(
                        "lp-a lp-type mt-0.5 font-mono text-[14px]",
                        f.strong ? "font-semibold text-accent" : "text-fg",
                        f.wide && f.value.length > 60 && "font-sans text-[14px] leading-relaxed",
                      )}
                      style={at(0.55 + i * 0.07, f.value.length > 60 ? 0.9 : 0.5)}
                    >
                      {f.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[13px] font-semibold tracking-wide text-subtle">{out.list.title}</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                {out.list.rows.map(([a, b], i) => (
                  <li
                    key={a}
                    className="lp-a lp-rise flex justify-between gap-4 text-fg"
                    style={at(1.0 + i * 0.08, 0.4, { "--y": "6px" })}
                  >
                    <span>{a}</span>
                    <span className="font-mono text-[13px] text-muted">{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex justify-end gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white">
                  <ArrowDown className="size-3.5" /> Export JSON
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium text-fg">
                  <ArrowDown className="size-3.5" /> Export CSV
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function PageMock({ out }: { out: Output }) {
  return (
    <div className="relative hidden overflow-hidden rounded-2xl border border-line bg-surface-2/60 p-8 md:block">
      <div className="relative mx-auto h-[360px] max-w-[280px] rounded-sm bg-surface p-6 shadow-lg shadow-slate-900/5">
        <p className="text-lg font-bold text-fg">{out.page.title}</p>
        <p className="text-[11px] text-subtle">{out.page.sub}</p>
        <Lines className="mt-7" widths={[62, 92, 96, 88, 94]} />
        <div className="lp-a lp-pop mt-7 rounded-md border border-accent/40 bg-accent-soft/70 p-2" style={at(0.95, 0.45)}>
          <div className="flex justify-between">
            <span className="h-1.5 w-1/2 rounded-full bg-accent/30" />
            <span className="h-1.5 w-1/4 rounded-full bg-accent/70" />
          </div>
        </div>
        <Lines className="mt-6" widths={[80, 66]} />
      </div>
      <span className="lp-a lp-sweep absolute inset-x-0 h-px opacity-0 bg-accent shadow-[0_0_12px_2px_rgb(23_66_190/0.35)]" style={at(0.1, 0.8)} />
    </div>
  );
}
