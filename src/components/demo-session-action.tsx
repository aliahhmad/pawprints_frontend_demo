"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { signInDemo, signOutDemo } from "@/lib/demo-client";
import { safeReturnPath } from "@/lib/petitions";

export default function DemoSessionAction({ action }: { action: "login" | "logout" }) {
  const params = useSearchParams();
  const next = safeReturnPath(params.get("next"));
  useEffect(() => {
    if (action === "logout") signOutDemo();
    else signInDemo();
    window.location.replace(action === "logout" ? "/" : next);
  }, [action, next]);
  return (
    <main id="main-content" className="page-loading" role="status">
      {action === "logout" ? "Leaving the example account…" : "Opening the example account…"}
    </main>
  );
}
