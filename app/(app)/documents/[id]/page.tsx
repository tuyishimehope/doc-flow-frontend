import type { Metadata } from "next";
import { DocumentDetailView } from "./document-detail-view";

export const metadata: Metadata = { title: "Document" };

const positive = (value: string | string[] | undefined) => {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export default async function DocumentPage({ params, searchParams }: PageProps<"/documents/[id]">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return (
    <DocumentDetailView
      key={id}
      id={Number(id)}
      initialTab={query.tab === "ask" ? "ask" : query.tab === "processing" ? "processing" : null}
      initialConversationId={positive(query.c)}
      initialPage={positive(query.page)}
    />
  );
}
