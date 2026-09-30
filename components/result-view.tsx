"use client";

import type { ReactNode } from "react";
import { RefreshCcw, ScrollText, Users, XCircle } from "lucide-react";
import type { ContractMetadata, InvoiceExtraction, ProcessingResult } from "@/lib/types";

function isInvoice(r: ProcessingResult["result"]): r is InvoiceExtraction {
  return typeof r === "object" && r !== null && "line_items" in r;
}
function isContract(r: ProcessingResult["result"]): r is ContractMetadata {
  return typeof r === "object" && r !== null && "key_obligations" in r;
}

export function ResultView({ result }: { result: ProcessingResult }) {
  const r = result.result;
  if (typeof r === "string") return <SummaryResult text={r} />;
  if (isInvoice(r)) return <InvoiceResult invoice={r} />;
  if (isContract(r)) return <ContractResult contract={r} />;
  // Unknown shape (e.g. a new processing type on the backend) — show raw JSON.
  return (
    <pre className="overflow-x-auto rounded-xl bg-surface-2 p-4 font-mono text-xs text-fg">
      {JSON.stringify(r, null, 2)}
    </pre>
  );
}

const Empty = () => <span className="text-subtle">—</span>;
const show = (v: string | null | undefined) => (v ? v : <Empty />);

// ---------- Summary ----------

function SummaryResult({ text }: { text: string }) {
  // Render lightweight structure (paragraphs, bullet lists, **bold** headings) without a markdown lib.
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-4 text-[15px] leading-7 text-fg">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        if (lines.every((l) => /^\s*([-*•]|\d+\.)\s+/.test(l))) {
          return (
            <ul key={i} className="space-y-1.5 pl-1">
              {lines.map((l, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{inline(l.replace(/^\s*([-*•]|\d+\.)\s+/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        const heading = block.match(/^#{1,4}\s+(.*)$/);
        if (heading && lines.length === 1) {
          return (
            <h3 key={i} className="pt-2 text-base font-semibold">
              {heading[1]}
            </h3>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    ),
  );
}

// ---------- Invoice ----------

function money(value: number | null, currency: string | null) {
  if (value === null || value === undefined) return <Empty />;
  try {
    if (currency && /^[A-Z]{3}$/.test(currency)) {
      return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
    }
  } catch {}
  return `${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ""}`;
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-fg">{children}</dd>
    </div>
  );
}

function InvoiceResult({ invoice: inv }: { invoice: InvoiceExtraction }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-linear-to-br from-accent-soft to-transparent p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Invoice</p>
          <p className="mt-1 text-xl font-semibold text-fg">{inv.invoice_number ?? "Untitled invoice"}</p>
          <p className="mt-1 text-sm text-muted">
            {inv.vendor_name ?? "Unknown vendor"} → {inv.customer_name ?? "Unknown customer"}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Total due</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-fg tabular-nums">
            {money(inv.total, inv.currency)}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Detail label="Invoice date">{show(inv.invoice_date)}</Detail>
        <Detail label="Due date">{show(inv.due_date)}</Detail>
        <Detail label="Vendor">{show(inv.vendor_name)}</Detail>
        <Detail label="Customer">{show(inv.customer_name)}</Detail>
      </dl>

      <div className="overflow-hidden rounded-xl border border-line">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left text-xs font-medium text-muted">
              <tr>
                <th className="px-4 py-2.5">Description</th>
                <th className="px-4 py-2.5 text-right">Qty</th>
                <th className="px-4 py-2.5 text-right">Unit price</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {inv.line_items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted">
                    No line items were found.
                  </td>
                </tr>
              ) : (
                inv.line_items.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-fg">{item.description}</td>
                    <td className="px-4 py-3 text-right text-muted tabular-nums">{item.quantity ?? <Empty />}</td>
                    <td className="px-4 py-3 text-right text-muted tabular-nums">{money(item.unit_price, inv.currency)}</td>
                    <td className="px-4 py-3 text-right font-medium text-fg tabular-nums">{money(item.amount, inv.currency)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <dl className="space-y-2 border-t border-line bg-surface-2/50 px-4 py-3 text-sm">
          {[
            ["Subtotal", inv.subtotal],
            ["Tax", inv.tax],
          ].map(([label, v]) => (
            <div key={label as string} className="flex justify-end gap-8">
              <dt className="text-muted">{label}</dt>
              <dd className="w-32 text-right text-fg tabular-nums">{money(v as number | null, inv.currency)}</dd>
            </div>
          ))}
          <div className="flex justify-end gap-8 border-t border-line pt-2 font-semibold">
            <dt className="text-fg">Total</dt>
            <dd className="w-32 text-right text-fg tabular-nums">{money(inv.total, inv.currency)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// ---------- Contract ----------

function TermCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm leading-relaxed text-fg">{children}</div>
    </div>
  );
}

function ContractResult({ contract: c }: { contract: ContractMetadata }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-linear-to-br from-accent-soft to-transparent p-5">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">{c.contract_type ?? "Contract"}</p>
        <p className="mt-1 text-xl font-semibold text-fg">{c.title ?? "Untitled contract"}</p>
        {c.parties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {c.parties.map((p) => (
              <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-fg">
                <Users className="size-3 text-accent" /> {p}
              </span>
            ))}
          </div>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <Detail label="Effective date">{show(c.effective_date)}</Detail>
        <Detail label="Expiration date">{show(c.expiration_date)}</Detail>
        <Detail label="Governing law">{show(c.governing_law)}</Detail>
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <TermCard icon={<RefreshCcw className="size-3.5" />} label="Renewal terms">
          {show(c.renewal_terms)}
        </TermCard>
        <TermCard icon={<XCircle className="size-3.5" />} label="Termination terms">
          {show(c.termination_terms)}
        </TermCard>
      </div>

      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-fg">
          <ScrollText className="size-4 text-accent" /> Key obligations
        </h4>
        {c.key_obligations.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No obligations were identified.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {c.key_obligations.map((o, i) => (
              <li key={i} className="flex gap-3 rounded-xl bg-surface-2/60 px-4 py-3 text-sm leading-relaxed text-fg">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
                  {i + 1}
                </span>
                {o}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
