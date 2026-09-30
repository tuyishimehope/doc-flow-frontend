"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText, Plus, Search, SearchX } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { DocumentRow, DocumentRowSkeleton } from "@/components/document-row";
import { Button, buttonClass, Card, EmptyState, ErrorBanner, Spinner } from "@/components/ui";
import { useDocuments } from "@/lib/queries";
import type { DocumentStatus } from "@/lib/types";
import { cn, errorText } from "@/lib/utils";

const PAGE_SIZE = 10;
const tabs: { label: string; value: DocumentStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Active", value: "ACTIVE" },
  { label: "Archived", value: "ARCHIVED" },
];

export function DocumentsView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DocumentStatus | undefined>(undefined);
  const [page, setPage] = useState(0);
  const q = useDeferredValue(search.trim());

  const { data, error, isPending, isFetching, isPlaceholderData } = useDocuments({
    skip: page * PAGE_SIZE,
    limit: PAGE_SIZE,
    q: q || undefined,
    status,
  });

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);
  const filtered = !!q || !!status;

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Documents"
        description="Everything you've uploaded, with the status of its latest run."
        actions={
          <Link href="/documents/new" className={buttonClass("primary")}>
            <Plus className="size-4" /> New document
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-line bg-surface p-1">
          {tabs.map((t) => (
            <button
              key={t.label}
              onClick={() => {
                setStatus(t.value);
                setPage(0);
              }}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                status === t.value ? "bg-surface-2 text-fg shadow-sm" : "text-muted hover:text-fg",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="h-10 w-full rounded-xl border border-line bg-surface pr-9 pl-10 text-sm text-fg placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/15 focus:outline-none"
          />
          {isFetching && !isPending && (
            <Spinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <div className="p-5">
            <ErrorBanner message={errorText(error)} />
          </div>
        ) : isPending ? (
          <div className="divide-y divide-line">
            {Array.from({ length: 6 }, (_, i) => <DocumentRowSkeleton key={i} />)}
          </div>
        ) : data.documents.length === 0 ? (
          filtered ? (
            <EmptyState
              icon={<SearchX className="size-5" />}
              title="No matching documents"
              description="Try a different search or filter."
            />
          ) : (
            <EmptyState
              icon={<FileText className="size-5" />}
              title="No documents yet"
              description="Upload a document to get a summary, invoice fields or contract metadata."
              action={
                <Link href="/documents/new" className={buttonClass("primary")}>
                  <Plus className="size-4" /> Upload a document
                </Link>
              }
            />
          )
        ) : (
          <div className={cn("divide-y divide-line transition-opacity", isPlaceholderData && "opacity-60")}>
            {data.documents.map((doc) => <DocumentRow key={doc.id} doc={doc} />)}
          </div>
        )}

        {total > 0 && (
          <div className="flex items-center justify-between border-t border-line px-5 py-3">
            <p className="text-xs text-muted tabular-nums">
              {from}–{to} of {total}
            </p>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-4" /> Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!data?.has_more || isPlaceholderData}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
