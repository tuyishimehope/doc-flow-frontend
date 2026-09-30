import type { Metadata } from "next";
import { DocumentDetailView } from "./document-detail-view";

export const metadata: Metadata = { title: "Document" };

export default async function DocumentPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params;
  return <DocumentDetailView id={Number(id)} />;
}
