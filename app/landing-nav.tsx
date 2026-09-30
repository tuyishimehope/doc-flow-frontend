"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { useToken } from "@/lib/auth-store";

export function LandingNavActions() {
  const token = useToken();
  if (token) {
    return (
      <Link href="/dashboard" className={buttonClass("primary", "sm")}>
        Open dashboard <ArrowRight className="size-3.5" />
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className={buttonClass("ghost", "sm")}>
        Sign in
      </Link>
      <Link href="/signup" className={buttonClass("primary", "sm")}>
        Get started
      </Link>
    </div>
  );
}
