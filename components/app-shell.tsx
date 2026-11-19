"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  FileStack,
  LayoutDashboard,
  LogOut,
  Menu,
  MessagesSquare,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "./logo";
import { buttonClass, Skeleton } from "./ui";
import { useMe, useStats } from "@/lib/queries";
import { useAuthActions } from "@/lib/use-auth";
import { cn } from "@/lib/utils";

const MENU = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileStack, count: true },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (pathname.startsWith(href + "/") && pathname !== "/documents/new");
}

function NavItem({
  href,
  label,
  icon: Icon,
  badge,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors",
        active ? "font-semibold text-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      {/* The active marker slides in from the sidebar's edge. */}
      <span
        className={cn(
          "absolute top-1/2 -left-4 h-8 w-1.5 -translate-y-1/2 rounded-r-full bg-accent transition-transform duration-300",
          active ? "translate-x-0" : "-translate-x-2",
        )}
      />
      <Icon className={cn("size-[19px] transition-colors", active ? "text-accent" : "text-subtle group-hover:text-fg")} />
      {label}
      {!!badge && (
        <span className="ml-auto rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuthActions();
  const stats = useStats();
  const active = stats.data?.documents.active;
  return (
    <div className="flex h-full flex-col p-4">
      <div className="px-2 pt-2 pb-6">
        <Logo href="/dashboard" />
      </div>

      <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] text-subtle uppercase">Menu</p>
      <nav className="space-y-0.5">
        {MENU.map((item) => (
          <NavItem key={item.href} {...item} badge={item.count ? active : undefined} onNavigate={onNavigate} />
        ))}
      </nav>

      <p className="px-3 pt-7 pb-2 text-[11px] font-semibold tracking-[0.14em] text-subtle uppercase">General</p>
      <nav className="space-y-0.5">
        <NavItem href="/settings" label="Settings" icon={Settings} onNavigate={onNavigate} />
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-muted transition-colors hover:bg-surface-2 hover:text-fg"
        >
          <LogOut className="size-[19px] text-subtle" />
          Log out
        </button>
      </nav>

      <PromoCard onNavigate={onNavigate} />
    </div>
  );
}

/** The sidebar's call to action: the Q&A flow is the newest thing to try. */
function PromoCard({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="relative mt-auto overflow-hidden rounded-[22px] bg-gradient-to-b from-brand-950 via-brand-700 to-brand-500 p-4 text-white">
      <svg className="pointer-events-none absolute -right-10 -bottom-12 size-44 text-white/15" viewBox="0 0 100 100" aria-hidden>
        {[18, 30, 42].map((r) => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="1.2" />
        ))}
      </svg>
      <span className="grid size-8 place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
        <MessagesSquare className="size-4" />
      </span>
      <p className="relative mt-3 text-[15px] leading-snug font-semibold">Ask your PDFs anything</p>
      <p className="relative mt-1 text-xs text-white/75">Answers cite the page they came from.</p>
      <Link
        href="/documents/new?mode=ask"
        onClick={onNavigate}
        className="relative mt-4 flex items-center justify-center gap-1.5 rounded-full bg-white py-2 text-[13px] font-semibold text-brand-700 transition-transform hover:scale-[1.02]"
      >
        Upload a PDF <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

/** Searches documents by name; ⌘K / Ctrl+K focuses it from anywhere. */
function SearchBox() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/documents?q=${encodeURIComponent(q)}` : "/documents");
    input.current?.blur();
  }

  return (
    <form onSubmit={submit} role="search" className="relative hidden max-w-md flex-1 sm:block">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-subtle" />
      <input
        ref={input}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search documents"
        aria-label="Search documents"
        className="h-11 w-full rounded-full border border-transparent bg-surface-2 pr-16 pl-11 text-sm text-fg placeholder:text-subtle focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15 focus:outline-none"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 font-sans text-[11px] text-muted">
        ⌘K
      </kbd>
    </form>
  );
}

function UserChip() {
  const { data: me, isPending } = useMe();
  const initials = me ? `${me.first_name[0] ?? ""}${me.last_name[0] ?? ""}`.toUpperCase() : "";
  return (
    <Link href="/settings" className="flex items-center gap-3 rounded-full py-1 pr-1 pl-1 transition-colors hover:bg-surface-2 sm:pr-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 text-[13px] font-semibold text-white ring-2 ring-surface">
        {initials}
      </span>
      <span className="hidden min-w-0 md:block">
        {isPending ? (
          <>
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-1.5 h-3 w-32" />
          </>
        ) : (
          <>
            <span className="block max-w-[180px] truncate text-sm font-semibold text-fg">
              {me?.first_name} {me?.last_name}
            </span>
            <span className="block max-w-[180px] truncate text-xs text-muted">{me?.email}</span>
          </>
        )}
      </span>
    </Link>
  );
}

function IconLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:bg-accent-soft hover:text-accent"
    >
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-1 gap-4 p-3 lg:p-4">
      <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[260px] shrink-0 overflow-y-auto rounded-[28px] border border-line/70 bg-surface shadow-card lg:block">
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
            "absolute inset-y-0 left-0 w-72 overflow-y-auto bg-surface shadow-xl transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute top-6 right-4 grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2"
          >
            <X className="size-4" />
          </button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
        <header className="sticky top-3 z-30 flex h-16 items-center gap-3 rounded-[24px] border border-line/70 bg-surface/85 px-3 shadow-card backdrop-blur-xl lg:top-4 lg:px-4">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface-2 lg:hidden"
          >
            <Menu className="size-5" />
          </button>
          <span className="sm:hidden">
            <Logo href="/dashboard" />
          </span>
          <SearchBox />
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:contents">
              <IconLink href="/chat" label="Chat">
                <MessagesSquare className="size-[18px]" />
              </IconLink>
            </span>
            <Link
              href="/documents/new"
              aria-label="New document"
              title="New document"
              className={cn(buttonClass("primary"), "size-11 rounded-full px-0")}
            >
              <Plus className="size-5" />
            </Link>
            <UserChip />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-1 py-4 sm:px-2 lg:py-6">{children}</main>
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
        <h1 className="lp-display truncate text-[28px] leading-tight font-bold text-fg sm:text-[34px]">{title}</h1>
        {description && <p className="mt-1.5 text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
