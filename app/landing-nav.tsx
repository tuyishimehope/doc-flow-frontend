"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { useToken } from "@/lib/auth-store";
import { wakeServer } from "@/lib/server-status";
import { cn } from "@/lib/utils";

export function LandingNavActions() {
  const token = useToken();
  if (token) {
    return (
      <Link href="/dashboard" className={cn(buttonClass("secondary", "md"), "rounded-full border-0 bg-white [--fg:var(--color-brand-950)] hover:bg-brand-50")}>
        Open dashboard <ArrowRight className="size-4" />
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1 sm:gap-3">
      <Link href="/login" onClick={wakeServer} className={cn(buttonClass("ghost", "md"), "hidden rounded-full text-white hover:bg-white/10 hover:text-white sm:inline-flex")}>
        Sign in
      </Link>
      <Link href="/signup" onClick={wakeServer} className={cn(buttonClass("secondary", "md"), "rounded-full border-0 bg-white [--fg:var(--color-brand-950)] hover:bg-brand-50")}>
        Get started <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
