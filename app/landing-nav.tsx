"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { useToken } from "@/lib/auth-store";
import { cn } from "@/lib/utils";

export function LandingNavActions() {
  const token = useToken();
  if (token) {
    return (
      <Link href="/dashboard" className={cn(buttonClass("primary", "md"), "shadow-md shadow-accent/25")}>
        Open dashboard <ArrowRight className="size-4" />
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1 sm:gap-3">
      <Link href="/login" className={cn(buttonClass("ghost", "md"), "text-fg")}>
        Sign in
      </Link>
      <Link href="/signup" className={cn(buttonClass("primary", "md"), "shadow-md shadow-accent/25")}>
        Get started <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
