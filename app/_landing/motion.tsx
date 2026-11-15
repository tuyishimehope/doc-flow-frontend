"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

export { at } from "./at";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** True once the element has scrolled into view (and stays true). */
export function useInView<T extends Element>(ref: RefObject<T | null>, threshold = 0.25) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, inView]);
  return inView;
}

/** Holds the `.lp-a` animations inside it until it scrolls into view. */
export function Reveal({
  children,
  className,
  threshold,
  as: Tag = "div",
  id,
}: {
  children: ReactNode;
  className?: string;
  threshold?: number;
  as?: "div" | "section";
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, threshold);
  return (
    <Tag ref={ref} id={id} data-in={inView ? "true" : "false"} className={className}>
      {children}
    </Tag>
  );
}

/** Reveals `text` a few characters at a time once `active`; all at once with reduced motion. */
export function useTyped(text: string, active: boolean, { delay = 0, step = 28, chunk = 2 } = {}) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    const instant = prefersReducedMotion();
    let n = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      n = instant ? text.length : Math.min(text.length, n + chunk);
      setCount(n);
      if (n < text.length) timer = setTimeout(tick, step);
    };
    timer = setTimeout(tick, instant ? 0 : delay);
    return () => clearTimeout(timer);
  }, [text, active, delay, step, chunk]);
  return { shown: text.slice(0, count), done: count >= text.length };
}

/**
 * Scroll progress (0..1) of `ref` through the viewport, written to the CSS variable
 * `name` on the element; `start`/`end` are the element's top offsets, in viewport
 * heights, where progress is 0 and 1.
 */
export function useScrollVar<T extends HTMLElement>(
  ref: RefObject<T | null>,
  name: string,
  { start = 0, end = 1, onChange }: { start?: number; end?: number; onChange?: (p: number) => void } = {},
) {
  const callback = useRef(onChange);
  useEffect(() => {
    callback.current = onChange;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const top = el.getBoundingClientRect().top;
      const p = Math.min(1, Math.max(0, (start * vh - top) / ((start - end) * vh || 1)));
      el.style.setProperty(name, p.toFixed(4));
      callback.current?.(p);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref, name, start, end]);
}
