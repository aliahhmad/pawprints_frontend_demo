import { Suspense } from "react";
import OriginalPage from "@/old/app/page";
export default function Page(props: Parameters<typeof OriginalPage>[0]) {
  return <Suspense fallback={<main id="main-content">Loading Pawprints…</main>}><OriginalPage {...props} /></Suspense>;
}
