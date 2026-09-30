"use client";

import { useRef, useState, type DragEvent } from "react";
import { UploadCloud, X } from "lucide-react";
import { ACCEPT_ATTR, cn, formatBytes, isAcceptedFile, MAX_UPLOAD_BYTES } from "@/lib/utils";
import { FileIcon } from "./badges";

export function Dropzone({
  file,
  onFile,
  onError,
  disabled,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!isAcceptedFile(f)) return onError("Unsupported file type. Use PDF, DOCX, JPEG, PNG or TIFF.");
    if (f.size > MAX_UPLOAD_BYTES) return onError(`File is ${formatBytes(f.size)}; the limit is 10 MB.`);
    onFile(f);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) pick(e.dataTransfer.files[0]);
  }

  if (file) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
        <FileIcon name={file.name} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">{file.name}</p>
          <p className="mt-0.5 text-xs text-muted">{formatBytes(file.size)}</p>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onFile(null)}
            aria-label="Remove file"
            className="grid size-8 place-items-center rounded-lg text-subtle hover:bg-surface-2 hover:text-fg"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all",
        "focus-visible:ring-4 focus-visible:ring-accent/20 focus-visible:outline-none",
        dragging ? "border-accent bg-accent-soft/60" : "border-line bg-surface hover:border-accent/50 hover:bg-accent-soft/30",
      )}
    >
      <div
        className={cn(
          "grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent transition-transform",
          dragging ? "scale-110" : "group-hover:-translate-y-0.5",
        )}
      >
        <UploadCloud className="size-7" />
      </div>
      <p className="mt-4 text-[15px] font-medium text-fg">
        {dragging ? "Drop to upload" : (
          <>
            Drag & drop a file, or <span className="text-accent">browse</span>
          </>
        )}
      </p>
      <p className="mt-1 text-xs text-muted">PDF, DOCX, JPEG, PNG or TIFF · up to 10 MB</p>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
