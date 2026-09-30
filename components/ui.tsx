"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./button-class";

// ---------- Button ----------

export { buttonClass };

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
  }
>(function Button({ variant, size, loading, className, children, disabled, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(buttonClass(variant, size), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
});

// ---------- Inputs ----------

const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-fg placeholder:text-subtle " +
  "transition-shadow focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 " +
  "disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  trailing,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  htmlFor: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg">
          {label}
        </label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: ReactNode; trailing?: ReactNode }
>(function Input({ label, hint, trailing, className, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const input = <input ref={ref} id={inputId} className={cn(fieldClass, "h-11", className)} {...props} />;
  if (!label) return input;
  return (
    <Field label={label} hint={hint} htmlFor={inputId} trailing={trailing}>
      {input}
    </Field>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; hint?: ReactNode }
>(function Textarea({ label, hint, className, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const el = (
    <textarea
      ref={ref}
      id={inputId}
      className={cn(fieldClass, "min-h-24 py-3 leading-relaxed resize-y", className)}
      {...props}
    />
  );
  if (!label) return el;
  return (
    <Field label={label} hint={hint} htmlFor={inputId}>
      {el}
    </Field>
  );
});

// ---------- Surfaces ----------

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-surface shadow-card", className)}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-2", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-muted", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      <div className="grid size-12 place-items-center rounded-2xl border border-line bg-surface-2 text-muted">
        {icon}
      </div>
      <h3 className="mt-4 text-[15px] font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorBanner({ message, className }: { message: string; className?: string }) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700",
        "dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
        className,
      )}
    >
      {message}
    </div>
  );
}

// ---------- Dialog ----------

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && <div className="mt-1.5 text-sm text-muted">{description}</div>}
        <div className="mt-6">{children}</div>
      </div>
    </dialog>
  );
}
