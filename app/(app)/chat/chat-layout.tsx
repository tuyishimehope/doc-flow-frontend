"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ConversationList } from "./conversation-list";

const ListContext = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

/** The conversation drawer below the md breakpoint. */
export const useConversationDrawer = () => useContext(ListContext);

export function ChatLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const drawer = useMemo(() => ({ open, setOpen }), [open]);

  return (
    <ListContext.Provider value={drawer}>
      {/* Fills the viewport under the shell: its main padding (and the mobile header below lg). */}
      <div className="relative flex h-[calc(100dvh-7.5rem)] min-h-[28rem] overflow-hidden rounded-2xl border border-line bg-surface shadow-card lg:h-[calc(100dvh-5rem)]">
        <aside className="hidden w-72 shrink-0 border-r border-line md:block">
          <ConversationList />
        </aside>

        {/* Below md the list slides over the thread. */}
        <div className={cn("absolute inset-0 z-20 md:hidden", open ? "visible" : "invisible")}>
          <div
            className={cn("absolute inset-0 bg-black/30 transition-opacity", open ? "opacity-100" : "opacity-0")}
            onClick={() => setOpen(false)}
          />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-line bg-surface shadow-xl transition-transform",
              open ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <ConversationList onNavigate={() => setOpen(false)} />
          </aside>
        </div>

        <section className="flex min-w-0 flex-1 flex-col">{children}</section>
      </div>
    </ListContext.Provider>
  );
}
