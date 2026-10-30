import { Suspense } from "react";
import DemoSessionAction from "@/components/demo-session-action";

export default function Page() {
  return (
    <Suspense fallback={<main id="main-content" className="page-loading">Loading…</main>}>
      <DemoSessionAction action="logout" />
    </Suspense>
  );
}
