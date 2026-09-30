"use client";

import Link from "next/link";
import { Archive, ArrowRight, FileStack, FileText, FolderOpen, HardDrive, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/app-shell";
import { typeIcons } from "@/components/badges";
import { DocumentRow, DocumentRowSkeleton } from "@/components/document-row";
import { buttonClass, Card, CardHeader, EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { keys, useDocuments, useMe } from "@/lib/queries";
import type { ProcessingType } from "@/lib/types";
import { errorText, PROCESSING_TYPES } from "@/lib/utils";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function Stat({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number | undefined;
  icon: typeof FileText;
  loading: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <Icon className="size-4 text-subtle" />
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-14" />
      ) : (
        <p className="mt-2 text-3xl font-semibold tracking-tight text-fg tabular-nums">{value ?? 0}</p>
      )}
    </Card>
  );
}

export function DashboardView() {
  const { data: me } = useMe();
  const recent = useDocuments({ limit: 6 });
  const active = useDocuments({ limit: 1, status: "ACTIVE" });
  const archived = useDocuments({ limit: 1, status: "ARCHIVED" });
  const files = useQuery({ queryKey: keys.files({ limit: 1 }), queryFn: () => api.listFiles({ limit: 1 }) });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title={
          <>
            {greeting()}
            {me ? `, ${me.first_name}` : ""}
          </>
        }
        description="Here's what's happening with your documents."
        actions={
          <Link href="/documents/new" className={buttonClass("primary")}>
            <Plus className="size-4" /> New document
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total documents" value={recent.data?.total} icon={FileStack} loading={recent.isPending} />
        <Stat label="Active" value={active.data?.total} icon={FolderOpen} loading={active.isPending} />
        <Stat label="Archived" value={archived.data?.total} icon={Archive} loading={archived.isPending} />
        <Stat label="Stored files" value={files.data?.total} icon={HardDrive} loading={files.isPending} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <CardHeader
            title="Recent documents"
            description="Latest uploads and their most recent run"
            action={
              <Link href="/documents" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
                View all <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          {recent.error ? (
            <div className="p-5">
              <ErrorBanner message={errorText(recent.error)} />
            </div>
          ) : recent.isPending ? (
            <div className="divide-y divide-line">
              {Array.from({ length: 4 }, (_, i) => <DocumentRowSkeleton key={i} />)}
            </div>
          ) : recent.data.documents.length === 0 ? (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="No documents yet"
              description="Upload your first PDF, Word document or scan to see DocFlow in action."
              action={
                <Link href="/documents/new" className={buttonClass("primary")}>
                  <Plus className="size-4" /> Upload a document
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-line">
              {recent.data.documents.map((doc) => <DocumentRow key={doc.id} doc={doc} />)}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="relative overflow-hidden p-5">
            <div className="absolute -top-16 -right-16 size-44 rounded-full bg-accent opacity-15 blur-3xl" />
            <h3 className="relative text-[15px] font-semibold text-fg">What can DocFlow do?</h3>
            <p className="relative mt-1 text-[13px] text-muted">Pick a mode when you upload.</p>
            <ul className="relative mt-4 space-y-3">
              {(Object.keys(PROCESSING_TYPES) as ProcessingType[]).map((t) => {
                const Icon = typeIcons[t];
                return (
                  <li key={t} className="flex gap-3">
                    <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                      <Icon className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fg">{PROCESSING_TYPES[t].label}</p>
                      <p className="text-xs leading-relaxed text-muted">{PROCESSING_TYPES[t].description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card className="p-5">
            <h3 className="text-[15px] font-semibold text-fg">Supported formats</h3>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["PDF", "DOCX", "JPEG", "PNG", "TIFF"].map((f) => (
                <span key={f} className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted">
                  {f}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Scanned PDFs and images are read with OCR. Files up to 10 MB.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
