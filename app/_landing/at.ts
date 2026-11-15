import type { CSSProperties } from "react";

/** Delay (and optional duration) for an `.lp-a` animation, in seconds. Safe in server components. */
export function at(delay: number, duration?: number, extra?: Record<string, string | number>): CSSProperties {
  return {
    "--d": `${delay}s`,
    ...(duration !== undefined && { "--t": `${duration}s` }),
    ...extra,
  } as CSSProperties;
}
