"use client";

import { useSyncExternalStore } from "react";

const TOKEN_KEY = "docflow.token";

type Listener = () => void;
const listeners = new Set<Listener>();

function read(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export const tokenStore = {
  get: read,
  set(token: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Storage may be unavailable (private mode); the session just won't persist.
    }
    emit();
  },
  clear() {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {}
    emit();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
};

/**
 * `undefined` while hydrating (the server can't see localStorage),
 * then the stored token or `null`.
 */
export function useToken(): string | null | undefined {
  return useSyncExternalStore(tokenStore.subscribe, read, () => undefined);
}
