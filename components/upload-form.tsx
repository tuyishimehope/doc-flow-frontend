"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { MessagesSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ProcessingType } from "@/lib/types";
import { useStoreForQuestions, useUploadDocument } from "@/lib/queries";
import { cn, errorText, fileExtension, formatBytes } from "@/lib/utils";
import { Dropzone } from "./dropzone";
import { ProcessingTypePicker } from "./processing-type-picker";
import { Button, ErrorBanner, Textarea } from "./ui";

export type UploadMode = "process" | "ask";

// Mirrors DOCUMENT_QA_MAX_MB / DOCUMENT_QA_MAX_PAGES on the backend.
const QA_MAX_BYTES = 10 * 1024 * 1024;
const QA_MAX_PAGES = 40;

export function UploadForm({ initialMode = "process" }: { initialMode?: UploadMode }) {
  const router = useRouter();
  const [mode, setMode] = useState<UploadMode>(initialMode);
  const process = useUploadDocument();
  const store = useStoreForQuestions();
  const upload = mode === "ask" ? store : process;
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<ProcessingType>("DOCUMENT_SUMMARY");
  const [instructions, setInstructions] = useState("");
  const [progress, setProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return setFileError("Choose a file to upload.");
    setProgress(0);
    if (mode === "ask") {
      if (fileExtension(file.name) !== "pdf") return setFileError("Questions work on PDFs only.");
      if (file.size > QA_MAX_BYTES) {
        return setFileError(`For questions the PDF must be ${formatBytes(QA_MAX_BYTES)} or smaller.`);
      }
      store.mutate(
        { file, onProgress: setProgress },
        {
          onSuccess: (res) => {
            toast.success("Ready for questions", { description: `${res.pages} pages read.` });
            router.push(`/documents/${res.document_id}?tab=ask`);
          },
        },
      );
      return;
    }
    process.mutate(
      { file, processing_type: type, instructions: instructions.trim() || undefined, onProgress: setProgress },
      {
        onSuccess: (res) => {
          toast.success("Upload complete", { description: "Processing has started in the background." });
          router.push(`/documents/${res.document_id}`);
        },
      },
    );
  }

  const error = fileError ?? (upload.error ? errorText(upload.error) : null);
  const uploading = upload.isPending;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-3">
        <StepLabel n={1} title="Choose a document" />
        <Dropzone
          file={file}
          disabled={uploading}
          onFile={(f) => {
            setFile(f);
            setFileError(null);
            process.reset();
            store.reset();
          }}
          onError={setFileError}
        />
      </section>

      <section className="space-y-3">
        <StepLabel n={2} title="What should DocFlow do?" />
        <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
          <ModeOption
            selected={mode === "process"}
            onSelect={() => setMode("process")}
            icon={Sparkles}
            title="Process it"
            description="Summarise it, or extract invoice or contract fields."
            disabled={uploading}
          />
          <ModeOption
            selected={mode === "ask"}
            onSelect={() => {
              setMode("ask");
              setFileError(null);
            }}
            icon={MessagesSquare}
            title="Ask questions about it"
            description={`PDFs up to ${QA_MAX_PAGES} pages. Answers quote the pages they come from.`}
            disabled={uploading}
          />
        </div>
        {mode === "process" && <ProcessingTypePicker value={type} onChange={setType} />}
      </section>

      {mode === "process" && (
        <section className="space-y-3">
          <StepLabel n={3} title="Instructions" optional />
          <Textarea
            placeholder="e.g. Focus on payment terms and flag anything unusual."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            disabled={uploading}
          />
        </section>
      )}

      {error && <ErrorBanner message={error} />}

      <div className="flex flex-col-reverse items-stretch gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
        {uploading ? (
          <div className="flex flex-1 items-center gap-3 sm:max-w-xs">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.max(4, progress * 100)}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs text-muted tabular-nums">
              {Math.round(progress * 100)}%
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted">
            {mode === "ask"
              ? "DocFlow reads the text of each page and keeps it for your questions."
              : "Processing runs in the background — you can leave the page."}
          </p>
        )}
        <Button type="submit" size="lg" loading={uploading}>
          {!uploading && (mode === "ask" ? <MessagesSquare className="size-4" /> : <Sparkles className="size-4" />)}
          {uploading ? "Uploading…" : mode === "ask" ? "Upload & ask" : "Upload & process"}
        </Button>
      </div>
    </form>
  );
}

function StepLabel({ n, title, optional }: { n: number; title: string; optional?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-6 place-items-center rounded-full bg-fg text-[11px] font-semibold text-bg">{n}</span>
      <h2 className="text-sm font-semibold text-fg">{title}</h2>
      {optional && <span className="text-xs text-subtle">Optional</span>}
    </div>
  );
}

function ModeOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  description,
  disabled,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: typeof Sparkles;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 text-left transition-all disabled:opacity-60",
        selected ? "border-accent bg-accent-soft/60 ring-4 ring-accent/10" : "border-line bg-surface hover:border-subtle/60",
      )}
    >
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl transition-colors",
          selected ? "bg-accent text-white" : "bg-surface-2 text-muted",
        )}
      >
        <Icon className="size-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-fg">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">{description}</span>
      </span>
    </button>
  );
}
