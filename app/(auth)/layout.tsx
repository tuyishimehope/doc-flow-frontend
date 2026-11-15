import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { GuestOnly } from "@/components/guards";
import { AuthShowcase } from "./showcase";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="landing relative grid min-h-screen flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative flex flex-col overflow-hidden px-6 py-7 sm:px-12">
        <div className="pointer-events-none absolute -top-48 -left-40 size-[560px] rounded-full bg-[radial-gradient(closest-side,rgb(79_143_247/0.22),transparent)]" />

        <div className="relative flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            <ArrowLeft className="size-3.5" /> Back to home
          </Link>
        </div>

        <div className="relative flex flex-1 items-center justify-center py-14">
          <div className="w-full max-w-[400px] animate-fade-up">
            <GuestOnly>{children}</GuestOnly>
          </div>
        </div>

        <p className="relative text-xs text-subtle">© {new Date().getFullYear()} DocFlow</p>
      </div>
      <AuthShowcase />
    </div>
  );
}
