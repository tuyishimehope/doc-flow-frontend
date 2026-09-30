import clsx, { type ClassValue } from "clsx";
import type { ProcessingType } from "./types";

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/tiff": [".tif", ".tiff"],
};

export const ACCEPT_ATTR = Object.entries(ACCEPTED_TYPES)
  .flatMap(([mime, exts]) => [mime, ...exts])
  .join(",");

export function isAcceptedFile(file: File) {
  const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
  return Object.entries(ACCEPTED_TYPES).some(
    ([mime, exts]) => file.type === mime || exts.includes(ext),
  );
}

export const PROCESSING_TYPES: Record<
  ProcessingType,
  { label: string; short: string; description: string }
> = {
  DOCUMENT_SUMMARY: {
    label: "Document summary",
    short: "Summary",
    description: "A concise, readable summary of the key information.",
  },
  INVOICE_EXTRACTION: {
    label: "Invoice extraction",
    short: "Invoice",
    description: "Vendor, dates, totals, tax and every line item.",
  },
  CONTRACT_METADATA: {
    label: "Contract metadata",
    short: "Contract",
    description: "Parties, key dates, governing law, renewal and obligations.",
  },
};

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// The API returns naive UTC timestamps (no offset); treat them as UTC.
export function parseDate(value: string) {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return parseDate(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(value: string | null | undefined) {
  if (!value) return "—";
  const seconds = Math.round((Date.now() - parseDate(value).getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const steps: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
    [Infinity, "year"],
  ];
  let amount = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(amount) < size) return rtf.format(-Math.round(amount), unit);
    amount /= size;
  }
  return formatDate(value);
}

export function fileExtension(name: string) {
  return (name.split(".").pop() ?? "").toLowerCase();
}

export function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}
