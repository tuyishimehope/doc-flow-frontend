"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up (or down) from the last shown number to `value`; jumps straight there with reduced motion. */
export function useCountUp(value: number, duration = 900) {
  const [shown, setShown] = useState(0);
  const last = useRef(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = last.current;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = reduced ? 1 : Math.min(1, (now - start) / duration);
      const next = Math.round(from + (value - from) * (1 - Math.pow(1 - t, 3)));
      last.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return shown;
}
