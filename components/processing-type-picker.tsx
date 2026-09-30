"use client";

import { Check } from "lucide-react";
import type { ProcessingType } from "@/lib/types";
import { cn, PROCESSING_TYPES } from "@/lib/utils";
import { typeIcons } from "./badges";

export function ProcessingTypePicker({
  value,
  onChange,
  compact,
}: {
  value: ProcessingType;
  onChange: (value: ProcessingType) => void;
  compact?: boolean;
}) {
  return (
    <div role="radiogroup" className={cn("grid gap-3", !compact && "sm:grid-cols-3")}>
      {(Object.keys(PROCESSING_TYPES) as ProcessingType[]).map((type) => {
        const meta = PROCESSING_TYPES[type];
        const Icon = typeIcons[type];
        const selected = value === type;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(type)}
            className={cn(
              "relative flex rounded-2xl border text-left transition-all",
              compact ? "items-center gap-3 p-3" : "flex-col gap-3 p-4",
              selected
                ? "border-accent bg-accent-soft/60 ring-4 ring-accent/10"
                : "border-line bg-surface hover:border-subtle/60",
            )}
          >
            <div
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
                selected ? "bg-accent text-white" : "bg-surface-2 text-muted",
              )}
            >
              <Icon className="size-[18px]" />
            </div>
            <div className="min-w-0 pr-5">
              <p className="text-sm font-semibold text-fg">{meta.label}</p>
              {!compact && <p className="mt-1 text-xs leading-relaxed text-muted">{meta.description}</p>}
            </div>
            <span
              className={cn(
                "absolute top-3 right-3 grid size-5 place-items-center rounded-full border transition-all",
                selected ? "border-accent bg-accent text-white" : "border-line",
              )}
            >
              {selected && <Check className="size-3" strokeWidth={3} />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
