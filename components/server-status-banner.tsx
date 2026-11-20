"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckCircle2, CloudOff, Loader2, RotateCcw } from "lucide-react";
import { serverStatus, type ServerStatus } from "@/lib/server-status";
import { cn } from "@/lib/utils";

const SERVER_SNAPSHOT: ServerStatus = { phase: "ok", since: null };

function useElapsed(since: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!since) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);
  return since ? Math.max(0, Math.round((now - since) / 1000)) : 0;
}

/** A small pill at the top of every page while the API is asleep and starting up. */
export function ServerStatusBanner() {
  const status = useSyncExternalStore(serverStatus.subscribe, serverStatus.get, () => SERVER_SNAPSHOT);
  const elapsed = useElapsed(status.phase === "waking" ? status.since : null);

  if (status.phase === "ok") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex justify-center px-3" role="status" aria-live="polite">
      <div
        className={cn(
          "pointer-events-auto flex max-w-[560px] items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-xl backdrop-blur-xl",
          "animate-[lp-rise_0.35s_ease-out_both] [--y:-12px]",
          status.phase === "down"
            ? "border-rose-200 bg-white/95 text-rose-800 dark:border-rose-500/30 dark:bg-[#1a1116]/95 dark:text-rose-200"
            : status.phase === "ready"
              ? "border-emerald-200 bg-white/95 text-emerald-800 dark:border-emerald-500/30 dark:bg-[#0f1a16]/95 dark:text-emerald-200"
              : "border-brand-200 bg-white/95 text-fg dark:border-brand-500/30 dark:bg-[#0f1626]/95",
        )}
      >
        {status.phase === "waking" && (
          <>
            <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-accent" />
            <div>
              <p className="font-semibold">
                Waking up the server… <span className="font-normal text-muted tabular-nums">{elapsed}s</span>
              </p>
              <p className="mt-0.5 text-[13px] text-muted">
                DocFlow sleeps when it hasn&apos;t been used for a while, and can take up to a minute to start. Your
                request will go through on its own; there&apos;s no need to reload.
              </p>
            </div>
          </>
        )}
        {status.phase === "ready" && (
          <>
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <p className="font-semibold">The server is ready.</p>
          </>
        )}
        {status.phase === "down" && (
          <>
            <CloudOff className="mt-0.5 size-4 shrink-0 text-rose-500" />
            <div>
              <p className="font-semibold">Still can&apos;t reach the server</p>
              <p className="mt-0.5 text-[13px] opacity-80">
                Check your internet connection. If it&apos;s fine, the service may be down; please try again in a few
                minutes.
              </p>
            </div>
            <button
              onClick={() => serverStatus.retry()}
              className="ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <RotateCcw className="size-3.5" /> Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
