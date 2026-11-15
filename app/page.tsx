import Link from "next/link";
import { Logo } from "@/components/logo";
import { API_URL } from "@/lib/api";
import { AskSection } from "./_landing/ask-demo";
import { GITHUB_URL } from "./_landing/bits";
import { Hero } from "./_landing/hero";
import { HowItWorks } from "./_landing/how-it-works";
import { Outputs } from "./_landing/outputs";
import { FinalCta, Toolkit } from "./_landing/toolkit";
import { LandingNavActions } from "./landing-nav";

const DOCS_URL = `${API_URL}/docs`;

const NAV = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Docs", href: DOCS_URL, external: true },
  { label: "GitHub", href: GITHUB_URL, external: true },
];

const STACK = ["FastAPI", "Celery + Redis", "PostgreSQL", "MinIO", "Tesseract OCR", "OpenAI"];

export default function Home() {
  return (
    <div className="landing relative flex-1 overflow-x-clip">
      {/* Frame lines at the content edges, as in the design. */}
      <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-[1200px] -translate-x-1/2 border-x border-line/70 xl:block" />

      <header className="relative z-20 border-b border-line/70">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-6 px-5 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-8 text-[15px] text-muted md:flex">
            {NAV.map((n) =>
              n.external ? (
                <a key={n.label} href={n.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-fg">
                  {n.label}
                </a>
              ) : (
                <a key={n.label} href={n.href} className="transition-colors hover:text-fg">
                  {n.label}
                </a>
              ),
            )}
          </nav>
          <LandingNavActions />
        </div>
      </header>

      <main className="relative">
        <Hero />

        <section className="mx-auto mt-16 max-w-[1200px] px-5 sm:mt-20 sm:px-6">
          <div className="grid grid-cols-2 border-y border-line sm:grid-cols-3 lg:grid-cols-[1.6fr_repeat(6,1fr)]">
            <p className="col-span-2 flex items-center py-6 text-sm leading-snug text-muted sm:col-span-3 lg:col-span-1 lg:py-0 lg:pr-6">
              Built on a stack
              <br className="hidden lg:block" /> you can run yourself
            </p>
            {STACK.map((s) => (
              <span
                key={s}
                className="lp-display flex h-20 items-center justify-center border-t border-line text-center text-[15px] font-semibold tracking-[-0.02em] text-slate-400 lg:h-28 lg:border-t-0 lg:border-l"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        <HowItWorks />
        <Outputs />
        <AskSection />
        <Toolkit />
        <FinalCta />
      </main>

      <footer className="relative mx-auto max-w-[1200px] px-5 sm:px-6">
        <div className="grid gap-10 border-t border-line py-14 md:grid-cols-[1fr_auto]">
          <div>
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              AI document processing.
              <br />
              PDF · DOCX · JPEG · PNG · TIFF
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm sm:grid-cols-3 sm:gap-16">
            <FooterColumn
              title="Product"
              links={[
                ["How it works", "#how"],
                ["Features", "#features"],
                ["Dashboard", "/dashboard"],
              ]}
            />
            <FooterColumn
              title="Developers"
              links={[
                ["GitHub", GITHUB_URL],
                ["API docs", DOCS_URL],
                ["Self-host", `${GITHUB_URL}#readme`],
              ]}
            />
            <FooterColumn
              title="Account"
              links={[
                ["Sign in", "/login"],
                ["Get started", "/signup"],
              ]}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 border-t border-line py-6 text-[13px] text-subtle sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} DocFlow</span>
          <span>Built with FastAPI, Celery and PostgreSQL</span>
        </div>
      </footer>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.16em] text-subtle uppercase">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("/") ? (
              <Link href={href} className="text-fg hover:text-accent">
                {label}
              </Link>
            ) : href.startsWith("#") ? (
              <a href={href} className="text-fg hover:text-accent">
                {label}
              </a>
            ) : (
              <a href={href} target="_blank" rel="noreferrer" className="text-fg hover:text-accent">
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
