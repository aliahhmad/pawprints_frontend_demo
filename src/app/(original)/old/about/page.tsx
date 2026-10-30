import { Suspense } from "react";
import OriginalPage from "@/old/app/about/page";
export default function Page() {
  return <Suspense fallback={<main id="main-content">Loading Pawprints…</main>}><OriginalPage /></Suspense>;
}
