import { Suspense } from "react";
import PetitionsScreen from "@/components/petitions-screen";
import MetadataRequest from "@/components/metadata-request";
import { petitionMetadata, type PageQuery } from "@/lib/petition-metadata";

export function generateMetadata({
  searchParams,
}: {
  searchParams: PageQuery;
}) {
  return petitionMetadata(searchParams, { title: "Campus petitions" });
}

export default function PetitionsPage() {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="page-loading" role="status">
          Loading your campus…
        </main>
      }
    >
      <MetadataRequest />
      <PetitionsScreen />
    </Suspense>
  );
}
