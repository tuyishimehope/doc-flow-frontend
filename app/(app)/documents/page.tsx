import type { Metadata } from "next";
import { DocumentsView } from "./documents-view";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage({ searchParams }: PageProps<"/documents">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q : "";
  // Keyed so a new search from the top bar starts from that query.
  return <DocumentsView key={query} initialQuery={query} />;
}
