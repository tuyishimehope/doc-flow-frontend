"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToken } from "@/lib/auth-store";
import { Spinner } from "./ui";

function FullScreenSpinner() {
  return (
    <div className="grid flex-1 place-items-center py-24">
      <Spinner className="size-6" />
    </div>
  );
}

/** Renders children only when signed in; otherwise redirects to /login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useToken();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (token === null) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [token, router, pathname]);

  if (!token) return <FullScreenSpinner />;
  return children;
}

/** Auth pages bounce signed-in users to the dashboard. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const token = useToken();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
    }
  }, [token, router]);

  if (token === undefined || token) return <FullScreenSpinner />;
  return children;
}
