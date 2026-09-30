"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileStack, LayoutDashboard, LogOut, Menu, Plus, Settings, X } from "lucide-react";
import { Logo } from "./logo";
import { buttonClass, Skeleton } from "./ui";
import { useMe } from "@/lib/queries";
import { useAuthActions } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileStack },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5">
      {nav.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || (pathname.startsWith(href + "/") && pathname !== "/documents/new");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2/60 hover:text-fg",
            )}
          >
            <Icon className={cn("size-[18px]", active && "text-accent")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard() {
  const { data: me, isPending } = useMe();
  const { logout } = useAuthActions();
  const initials = me ? `${me.first_name[0] ?? ""}${me.last_name[0] ?? ""}`.toUpperCase() : "";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#7c6cff] to-[#c026d3] text-xs font-semibold text-white">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        {isPending ? (
          <>
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-1.5 h-3 w-32" />
          </>
        ) : (
          <>
            <p className="truncate text-sm font-medium text-fg">
              {me?.first_name} {me?.last_name}
            </p>
            <p className="truncate text-xs text-muted">{me?.email}</p>
          </>
        )}
      </div>
      <button
        onClick={logout}
        title="Sign out"
        aria-label="Sign out"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-fg"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-1">
        <Logo href="/dashboard" />
      </div>
      <Link href="/documents/new" onClick={onNavigate} className={buttonClass("primary", "md")}>
        <Plus className="size-4" /> New document
      </Link>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto">
        <UserCard />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-bg lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-40 lg:hidden", open ? "visible" : "invisible")}>
        <div
          className={cn("absolute inset-0 bg-black/40 transition-opacity", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-72 border-r border-line bg-bg shadow-xl transition-transform",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute top-5 right-4 grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
          >
            <X className="size-4" />
          </button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/80 px-4 backdrop-blur lg:hidden">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2"
          >
            <Menu className="size-5" />
          </button>
          <Logo href="/dashboard" />
          <Link href="/documents/new" aria-label="New document" className={buttonClass("primary", "sm") + " size-9 px-0"}>
            <Plus className="size-4" />
          </Link>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="truncate text-2xl font-semibold tracking-tight text-fg sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
