import { FileSignature, FileText, Receipt } from "lucide-react";
import type { DocumentStatus, ProcessingStatus, ProcessingType } from "@/lib/types";
import { cn, PROCESSING_TYPES } from "@/lib/utils";

const statusStyles: Record<ProcessingStatus, { label: string; className: string; dot: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/20",
    dot: "bg-slate-400",
  },
  QUEUED: {
    label: "Queued",
    className: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
    dot: "bg-sky-500 animate-pulse",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
    dot: "bg-amber-500 animate-pulse",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
    dot: "bg-emerald-500",
  },
  FAILED: {
    label: "Failed",
    className: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
    dot: "bg-rose-500",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20",
    dot: "bg-zinc-400",
  },
};

const pill = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap";

export function StatusBadge({ status, className }: { status: ProcessingStatus; className?: string }) {
  const s = statusStyles[status];
  return (
    <span className={cn(pill, s.className, className)}>
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  if (status === "ACTIVE") return null;
  return (
    <span className={cn(pill, "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:ring-zinc-500/20")}>
      {status === "ARCHIVED" ? "Archived" : "Deleted"}
    </span>
  );
}

export const typeIcons: Record<ProcessingType, typeof FileText> = {
  DOCUMENT_SUMMARY: FileText,
  INVOICE_EXTRACTION: Receipt,
  CONTRACT_METADATA: FileSignature,
};

export function TypeBadge({ type }: { type: ProcessingType }) {
  const Icon = typeIcons[type];
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted">
      <Icon className="size-3.5" />
      {PROCESSING_TYPES[type].short}
    </span>
  );
}

const extColors: Record<string, string> = {
  pdf: "from-rose-500 to-orange-500",
  docx: "from-brand-400 to-brand-600",
  jpg: "from-emerald-500 to-teal-500",
  jpeg: "from-emerald-500 to-teal-500",
  png: "from-emerald-500 to-teal-500",
  tif: "from-cyan-500 to-sky-600",
  tiff: "from-cyan-500 to-sky-600",
};

export function FileIcon({ name, className }: { name: string; className?: string }) {
  const ext = (name.split(".").pop() ?? "").toLowerCase();
  return (
    <div
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-br text-[10px] font-bold tracking-wide text-white uppercase shadow-sm",
        extColors[ext] ?? "from-zinc-500 to-zinc-600",
        className,
      )}
    >
      {ext.slice(0, 4) || "file"}
    </div>
  );
}
