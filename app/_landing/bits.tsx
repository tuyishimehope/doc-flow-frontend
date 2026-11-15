import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const GITHUB_URL = "https://github.com/tuyishimehope/DOC-FLOW";

const badgeColors = {
  PDF: "bg-rose-500",
  DOC: "bg-blue-500",
  PNG: "bg-emerald-500",
  TIF: "bg-violet-500",
} as const;

export type FileKind = keyof typeof badgeColors;

export function FileBadge({ kind, className }: { kind: FileKind; className?: string }) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[10px] text-[10px] font-bold tracking-wide text-white shadow-sm",
        badgeColors[kind],
        className,
      )}
    >
      {kind}
    </span>
  );
}

const pillColors = {
  queued: "bg-slate-100 text-slate-600 [--dot:var(--color-slate-500)]",
  processing: "bg-blue-50 text-accent [--dot:var(--accent)]",
  failed: "bg-rose-50 text-rose-600 [--dot:var(--color-rose-500)]",
  retry: "bg-amber-50 text-amber-700 [--dot:var(--color-amber-500)]",
  done: "bg-emerald-50 text-emerald-700 [--dot:var(--color-emerald-500)]",
} as const;

export type PillTone = keyof typeof pillColors;

export function Pill({
  tone,
  children,
  className,
  style,
}: {
  tone: PillTone;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap",
        pillColors[tone],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-(--dot)" />
      {children}
    </span>
  );
}

export function Eyebrow({ children, dark, className }: { children: ReactNode; dark?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase",
        dark ? "border-white/15 bg-white/5 text-blue-100" : "border-line bg-surface text-accent shadow-card",
        className,
      )}
    >
      <Sparkle className={dark ? "text-blue-300" : "text-accent"} />
      {children}
    </span>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 12 12" className={cn("size-3", className)} aria-hidden>
      <path d="M6 0c.4 3 2.6 5.6 6 6-3.4.4-5.6 3-6 6-.4-3-2.6-5.6-6-6 3.4-.4 5.6-3 6-6z" fill="currentColor" />
    </svg>
  );
}

/** Placeholder text lines for page mock-ups. */
export function Lines({ widths, className }: { widths: number[]; className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {widths.map((w, i) => (
        <div key={i} className="h-1.5 rounded-full bg-slate-200/80" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}
