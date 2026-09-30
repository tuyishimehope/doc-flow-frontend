// Shared by server and client components, so this module must not be "use client".
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white shadow-sm shadow-accent/25 hover:bg-accent-strong focus-visible:ring-accent/40",
  secondary:
    "bg-surface text-fg border border-line hover:bg-surface-2 focus-visible:ring-accent/30",
  ghost: "text-muted hover:text-fg hover:bg-surface-2 focus-visible:ring-accent/30",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500/40",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-xl",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(
    "inline-flex items-center justify-center font-medium whitespace-nowrap transition-all",
    "focus-visible:outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
    buttonVariants[variant],
    buttonSizes[size],
  );
}

