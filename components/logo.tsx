import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden>
      <defs>
        <linearGradient id="df-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c6cff" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#df-g)" />
      <path d="M10 8h7.5L22 12.5V24H10z" fill="white" fillOpacity=".95" />
      <path d="M17.5 8v4.5H22" fill="none" stroke="#4f46e5" strokeOpacity=".35" strokeWidth="1.2" />
      <path d="M13 16.5h6M13 19.5h4" stroke="#5b50f0" strokeWidth="1.6" strokeLinecap="round" />
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
