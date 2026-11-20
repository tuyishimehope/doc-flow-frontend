/**
 * Tracks whether the API is reachable. On the free hosting plan the server sleeps when
 * idle and takes up to a minute or two to start again; meanwhile requests hang or fail
 * with a gateway error. While that happens we poll /health and, once it answers, tell
 * listeners (the query client refetches) so the user doesn't have to reload.
 */

export type ServerPhase = "ok" | "waking" | "down" | "ready";

export interface ServerStatus {
  phase: ServerPhase;
  /** When the current wait started (ms since epoch), for the elapsed-time display. */
  since: number | null;
}

/** A request with no response after this long probably hit a sleeping server. */
export const SLOW_REQUEST_MS = 5_000;
/** After this long without an answer we stop saying "starting" and suggest checking back. */
const GIVE_UP_MS = 150_000;
/**
 * Health checks back off (5s, 8s, 13s, … up to 30s), so one wake-up costs about seven
 * requests instead of a steady stream: the hosting plan has a monthly request limit.
 */
const pollDelay = (attempt: number) => Math.min(5_000 * 1.6 ** attempt, 30_000);
const READY_NOTICE_MS = 2_500;

let status: ServerStatus = { phase: "ok", since: null };
const listeners = new Set<() => void>();
const recoveredListeners = new Set<() => void>();
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let readyTimer: ReturnType<typeof setTimeout> | undefined;
let healthUrl = "";
let pollAttempt = 0;
let woken = false;

function set(next: ServerStatus) {
  status = next;
  listeners.forEach((l) => l());
}

export const serverStatus = {
  get: () => status,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Called once a wait ends, so failed requests can run again. */
  onRecovered(listener: () => void) {
    recoveredListeners.add(listener);
    return () => recoveredListeners.delete(listener);
  },
  configure(url: string) {
    healthUrl = url;
  },

  /** A request got an answer from the app itself. */
  reachable() {
    if (status.phase !== "waking" && status.phase !== "down") return;
    clearTimeout(pollTimer);
    set({ phase: "ready", since: null });
    recoveredListeners.forEach((l) => l());
    clearTimeout(readyTimer);
    readyTimer = setTimeout(() => set({ phase: "ok", since: null }), READY_NOTICE_MS);
  },

  /** A request failed to connect, hit a gateway error, or is taking suspiciously long. */
  unreachable() {
    if (status.phase === "waking" || status.phase === "down") return;
    clearTimeout(readyTimer);
    set({ phase: "waking", since: Date.now() });
    poll();
  },

  /** "Try again" from the banner after giving up. */
  retry() {
    set({ phase: "waking", since: Date.now() });
    poll();
  },
};

function poll(first = true) {
  clearTimeout(pollTimer);
  if (first) pollAttempt = 0;
  pollTimer = setTimeout(async () => {
    pollAttempt += 1;
    if (status.phase !== "waking") return;
    if (status.since && Date.now() - status.since > GIVE_UP_MS) {
      set({ phase: "down", since: status.since });
      return;
    }
    try {
      const response = await fetch(healthUrl, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      // 503 here means "up but a dependency is degraded": the app itself answered.
      if (response.ok || (response.status === 503 && isJson(response))) {
        serverStatus.reachable();
        return;
      }
    } catch {}
    poll(false);
  }, pollDelay(pollAttempt));
}

/**
 * Starts a sleeping server so it's likely up by the time the user submits the form.
 * Sent once per visit, and only when someone heads to sign in or sign up, never on every page view.
 */
export function wakeServer() {
  if (woken || !healthUrl) return;
  woken = true;
  fetch(healthUrl, { cache: "no-store" }).catch(() => {});
}

/** Gateway errors from the host come back as HTML or plain text; the app always answers JSON. */
export function isJson(response: Response) {
  return (response.headers.get("content-type") ?? "").includes("application/json");
}
