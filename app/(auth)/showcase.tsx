import { CheckCircle2, FileSignature, Receipt, Sparkles } from "lucide-react";

export function AuthShowcase() {
  return (
    <div className="relative hidden overflow-hidden bg-[#0d0b24] lg:flex lg:flex-col lg:justify-center lg:px-16">
      <div className="absolute -top-40 -right-32 size-[520px] rounded-full bg-[#5b4ff0] opacity-40 blur-[120px]" />
      <div className="absolute -bottom-48 -left-24 size-[420px] rounded-full bg-[#c026d3] opacity-25 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative max-w-lg">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
          <Sparkles className="size-3.5 text-[#a59dff]" /> OCR + AI extraction
        </div>
        <h2 className="mt-5 text-4xl leading-tight font-semibold tracking-tight text-white">
          Turn documents into data you can use.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-white/60">
          Drop in invoices, contracts or reports. DocFlow reads them, runs the model in the
          background and hands you structured results.
        </p>

        <div className="relative mt-10">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#5b4ff0]/30 text-[#b9b3ff]">
                <Receipt className="size-4.5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">acme-invoice-0421.pdf</p>
                <p className="text-xs text-white/50">Invoice extraction</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-300">
                <CheckCircle2 className="size-3" /> Completed
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-3 gap-3 text-xs">
              {[
                ["Vendor", "Acme Ltd"],
                ["Due", "May 15"],
                ["Total", "$4,280.00"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-white/[0.04] px-3 py-2">
                  <dt className="text-white/40">{k}</dt>
                  <dd className="mt-0.5 font-medium text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="absolute -right-6 -bottom-8 w-60 rotate-2 rounded-2xl border border-white/10 bg-[#16133a]/90 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <FileSignature className="size-3.5 text-[#e28cff]" /> Contract metadata
            </div>
            <p className="mt-2 text-sm text-white">Renews annually, 60-day notice</p>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-linear-to-r from-[#7b70ff] to-[#e28cff]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
