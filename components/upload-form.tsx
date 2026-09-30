"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { ProcessingType } from "@/lib/types";
import { useUploadDocument } from "@/lib/queries";
import { errorText } from "@/lib/utils";
import { Dropzone } from "./dropzone";
import { ProcessingTypePicker } from "./processing-type-picker";
import { Button, ErrorBanner, Textarea } from "./ui";

export function UploadForm() {
  const router = useRouter();
  const upload = useUploadDocument();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<ProcessingType>("DOCUMENT_SUMMARY");
  const [instructions, setInstructions] = useState("");
  const [progress, setProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return setFileError("Choose a file to upload.");
    setProgress(0);
    upload.mutate(
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
            upload.reset();
          }}
          onError={setFileError}
        />
      </section>

      <section className="space-y-3">
        <StepLabel n={2} title="What should DocFlow do?" />
        <ProcessingTypePicker value={type} onChange={setType} />
      </section>

      <section className="space-y-3">
        <StepLabel n={3} title="Instructions" optional />
        <Textarea
          placeholder="e.g. Focus on payment terms and flag anything unusual."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          disabled={uploading}
        />
      </section>

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
          <p className="text-xs text-muted">Processing runs in the background — you can leave the page.</p>
        )}
        <Button type="submit" size="lg" loading={uploading}>
          {!uploading && <Sparkles className="size-4" />}
          {uploading ? "Uploading…" : "Upload & process"}
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
