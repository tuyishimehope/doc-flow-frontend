"use client";

import { useEffect } from "react";
import { wakeServer } from "@/lib/server-status";

/** Mounted on the sign-in and sign-up pages: one ping to start a sleeping server. */
export function WakeServer() {
  useEffect(() => wakeServer(), []);
  return null;
}
