"use client";

import { useId } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  // Unique per copy: a shared id breaks when the first copy sits in a hidden (display:none) sidebar.
  const id = useId();
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="6" y1="0" x2="26" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#59a2ff" />
          <stop offset="1" stopColor="#1a63f0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      {/* A "D" whose bowl repeats inward, like a ripple: documents flowing through. */}
      <path d="M9.5 8.5v15h4.75a7.5 7.5 0 0 0 0-15z" fill="none" stroke="white" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M13.5 13a3 3 0 0 1 0 6" fill="none" stroke="#bcdaff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight text-fg">DocFlow</span>
    </Link>
  );
}
