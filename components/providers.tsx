"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { ApiError, setUnauthorizedHandler } from "@/lib/api";
import { tokenStore } from "@/lib/auth-store";

function makeQueryClient() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        retry: (count, error) =>
          // Don't retry client errors (401, 404, ...), only network/server hiccups.
          !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 2,
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
    return () => setUnauthorizedHandler(null);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors closeButton position="bottom-right" />
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
