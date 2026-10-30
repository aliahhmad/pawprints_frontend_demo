"use client";
import { useAuth } from "@/components/auth-provider";
import { comparisonRoute } from "@/lib/design-routes";
export function DesignSwitch({ inDialog = false, oldDesign = false }: { inDialog?: boolean; oldDesign?: boolean }) {
  const old = oldDesign;
  const { user } = useAuth();
  function change(target: "old" | "new") {
    const pathname = window.location.pathname;
    const isOld = pathname === "/old" || pathname.startsWith("/old/");
    if (isOld === (target === "old")) return;
    window.location.assign(comparisonRoute(pathname, window.location.search, target, !!user?.roles?.some(role => role.name === "committee_member")));
  }
  return <div className={`design-switch ${inDialog ? "dialog-design-switch" : "site-design-switch"}`} role="group" aria-label="Website design">
    <span className="design-switch-label">Compare</span>
    <button type="button" aria-pressed={old} onClick={() => change("old")}>Old website</button>
    <button type="button" aria-pressed={!old} onClick={() => change("new")}>New website</button>
  </div>;
}
