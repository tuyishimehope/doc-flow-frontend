"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DocFlowDocument } from "@/lib/types";
import { useProcessingRequests } from "@/lib/queries";
import { timeAgo } from "@/lib/utils";
import { DocumentStatusBadge, FileIcon, StatusBadge, TypeBadge } from "./badges";
import { Skeleton } from "./ui";

function LatestRun({ documentId }: { documentId: number }) {
  const { data, isPending } = useProcessingRequests(documentId);
  if (isPending) return <Skeleton className="h-5 w-20 rounded-full" />;
  const latest = data?.[0];
  if (!latest) return <span className="text-xs text-subtle">No runs</span>;
  return (
    <div className="flex items-center gap-3">
      <span className="hidden md:inline-flex">
        <TypeBadge type={latest.processing_type} />
      </span>
      <StatusBadge status={latest.status} />
    </div>
  );
}

export function DocumentRow({ doc }: { doc: DocFlowDocument }) {
  return (
    <Link
      href={`/documents/${doc.id}`}
      className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-2/60"
    >
      <FileIcon name={doc.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-fg">{doc.name}</p>
          <DocumentStatusBadge status={doc.status} />
        </div>
        <p className="mt-0.5 text-xs text-muted">Uploaded {timeAgo(doc.created_at)}</p>
      </div>
      <LatestRun documentId={doc.id} />
      <ChevronRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function DocumentRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <Skeleton className="size-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-20 rounded-full" />
    </div>
  );
}
