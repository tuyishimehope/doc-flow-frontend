"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { ApiError, setUnauthorizedHandler } from "@/lib/api";
import { tokenStore } from "@/lib/auth-store";
import { serverStatus } from "@/lib/server-status";
import { ServerStatusBanner } from "./server-status-banner";

function makeQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        retry: (count, error) => {
          // The server is asleep: don't hammer it. The banner's health check notices when it's up
          // and the failed queries run again then (see onRecovered below).
          if (error instanceof ApiError && error.isTransient) return false;
          // Don't retry client errors (401, 404, ...), only server hiccups.
          return !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2;
        },
        retryDelay: (count) => Math.min(1_000 * 2 ** count, 30_000),
      },
      mutations: {
        // The request never reached the app (no connection, or the host answered while it boots),
        // so sending it again can't do the work twice. Sign-in and uploads then just wait it out.
        // A few spaced-out tries (about two minutes in all) rather than a burst.
        retry: (count, error) => error instanceof ApiError && error.isTransient && count < 5,
        retryDelay: (count) => Math.min(8_000 * 1.6 ** count, 40_000),
      },
    },
  });

  // File previews hold object URLs; free them when the cache drops the entry.
  client.getQueryCache().subscribe((event) => {
    if (event.type === "removed" && event.query.queryKey[0] === "file-blob") {
      const data = event.query.state.data as { url?: string } | undefined;
      if (data?.url) URL.revokeObjectURL(data.url);
    }
  });
  return client;
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      tokenStore.clear();
      queryClient.clear();
    });
    // Once a sleeping server is back, rerun whatever failed while it was starting.
    const stopRecovered = serverStatus.onRecovered(() => {
      queryClient.invalidateQueries({ predicate: (q) => q.state.status === "error" });
    });
    return () => {
      setUnauthorizedHandler(null);
      stopRecovered();
    };
  }, [queryClient]);


  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ServerStatusBanner />
      <Toaster richColors closeButton position="bottom-right" />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
