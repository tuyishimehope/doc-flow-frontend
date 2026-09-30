import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { UploadForm } from "@/components/upload-form";

export const metadata: Metadata = { title: "New document" };

export default function NewDocumentPage() {
  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <PageHeader
        eyebrow={
          <Link href="/documents" className="inline-flex items-center gap-1 text-[13px] font-medium text-muted hover:text-fg">
            <ArrowLeft className="size-3.5" /> Documents
          </Link>
        }
        title="New document"
        description="Upload a file and choose how DocFlow should process it."
      />
      <UploadForm />
    </div>
  );
}
