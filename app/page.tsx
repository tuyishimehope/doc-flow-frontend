import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  FileSignature,
  FileText,
  Lock,
  Receipt,
  ScanText,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonClass } from "@/components/button-class";
import { LandingNavActions } from "./landing-nav";

const modes = [
  {
    icon: FileText,
    title: "Document summary",
    body: "Long reports condensed into the few paragraphs that matter, with the option to steer the focus.",
  },
  {
    icon: Receipt,
    title: "Invoice extraction",
    body: "Vendor, customer, dates, currency, subtotal, tax, total and every line item — validated and exportable.",
  },
  {
    icon: FileSignature,
    title: "Contract metadata",
    body: "Parties, effective and expiry dates, governing law, renewal and termination terms, and key obligations.",
  },
];

const features = [
  { icon: ScanText, title: "OCR built in", body: "Scanned PDFs, JPEG, PNG and TIFF are read with Tesseract." },
  { icon: Clock3, title: "Runs in the background", body: "Upload and move on. Status updates live as the worker runs." },
  { icon: Lock, title: "Private by default", body: "Every file and result is scoped to your account." },
  { icon: UploadCloud, title: "JSON & CSV export", body: "Download structured results straight into your tools." },
];

export default function Home() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[640px]" />
      <div className="pointer-events-none absolute top-[-220px] left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-accent opacity-20 blur-[140px]" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <LandingNavActions />
      </header>

      <section className="relative mx-auto max-w-4xl px-6 pt-16 pb-20 text-center sm:pt-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
          <Sparkles className="size-3.5 text-accent" /> AI document processing
        </div>
        <h1 className="mt-6 text-4xl leading-[1.08] font-semibold tracking-tight text-fg sm:text-6xl">
          From stacks of files
          <br />
          <span className="bg-linear-to-r from-[#5b4ff0] via-[#8b5cf6] to-[#c026d3] bg-clip-text text-transparent">
            to structured data.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          Upload PDFs, Word documents and scans. DocFlow extracts the text, runs the model in the background and
          returns summaries, invoice fields and contract metadata you can export.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/signup" className={buttonClass("primary", "lg")}>
            Start for free <ArrowRight className="size-4" />
          </Link>
          <Link href="/login" className={buttonClass("secondary", "lg")}>
            Sign in
          </Link>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {modes.map(({ icon: Icon, title, body }) => (
            <div key={title} className="group rounded-2xl border border-line bg-surface p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="grid size-11 place-items-center rounded-xl bg-accent-soft text-accent transition-colors group-hover:bg-accent group-hover:text-white">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-5 text-base font-semibold text-fg">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative border-y border-line bg-surface/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title}>
              <Icon className="size-5 text-accent" />
              <h4 className="mt-3 text-sm font-semibold text-fg">{title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-[#0d0b24] px-8 py-14 text-center sm:px-16">
          <div className="absolute -top-24 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#5b4ff0] opacity-50 blur-[100px]" />
          <h2 className="relative text-3xl font-semibold tracking-tight text-white">Process your first document in a minute.</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-white/60">
            Create an account, drop in a file and watch the result arrive.
          </p>
          <Link href="/signup" className={buttonClass("primary", "lg") + " relative mt-8"}>
            Create your account <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="relative mx-auto flex max-w-6xl items-center justify-between px-6 pb-10 text-xs text-subtle">
        <span>© {new Date().getFullYear()} DocFlow</span>
        <span>PDF · DOCX · JPEG · PNG · TIFF</span>
      </footer>
    </div>
  );
}
