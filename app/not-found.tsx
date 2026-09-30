import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { buttonClass } from "@/components/button-class";

export default function NotFound() {
  return (
    <div className="grid flex-1 place-items-center px-6 py-24 text-center">
      <div>
        <LogoMark className="mx-auto size-10" />
        <p className="mt-6 font-mono text-sm text-accent">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-fg">Page not found</h1>
        <p className="mt-2 text-sm text-muted">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/" className={buttonClass("primary") + " mt-8"}>
          Go home
        </Link>
      </div>
    </div>
  );
}
