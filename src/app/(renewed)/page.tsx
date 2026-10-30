import { Suspense } from "react";
import LoginCard from "@/components/login-card";
import MetadataRequest from "@/components/metadata-request";
import { petitionMetadata, type PageQuery } from "@/lib/petition-metadata";
export function generateMetadata({ searchParams }: { searchParams: PageQuery }) {
  return petitionMetadata(searchParams, {});
}
export default function Home() {
  return <><Suspense fallback={null}><MetadataRequest /></Suspense>
    <main id="main-content" tabIndex={-1} className="login-main">
      <Suspense fallback={<p role="status">Preparing sign-in…</p>}><LoginCard /></Suspense>
    </main></>;
}
