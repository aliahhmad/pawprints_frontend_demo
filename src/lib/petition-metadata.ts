import type { Metadata } from "next";
import seed from "../data/demo.json";

export type PageQuery = Promise<Record<string, string | string[] | undefined>>;

export async function petitionMetadata(
  searchParams: PageQuery,
  fallback: Metadata,
): Promise<Metadata> {
  const params = await searchParams;
  const id = Array.isArray(params.petition)
    ? params.petition[0]
    : params.petition;
  if (!id || !/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) return fallback;
  const petition = seed.petitions.find(item => item.id === Number(id) && !item.is_draft);
  if (!petition?.title.trim()) return fallback;
  const title = petition.title.replace(/&amp;/g, "&");
  const description = title.length > 200 ? `${title.slice(0, 200)}…` : title;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", siteName: "Pawprints" },
    twitter: { card: "summary", title, description },
  };
}
