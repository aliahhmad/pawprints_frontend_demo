export function comparisonRoute(pathname: string, search: string, target: "old" | "new", committee = false) {
  const isOld = pathname === "/old" || pathname.startsWith("/old/");
  let path = pathname;
  if (target === "old" && !isOld) {
    path = pathname === "/" || pathname === "/petitions" ? "/old" : `/old${pathname}`;
    const detail = pathname.match(/^\/petitions\/(\d+)$/);
    const selected = detail?.[1] || new URLSearchParams(search).get("petition");
    if (committee && selected && /^[1-9]\d*$/.test(selected)) return `/old/review/${selected}`;
    if (detail) { const params = new URLSearchParams(search); params.set("petition", detail[1]); return `/old?${params}`; }
  } else if (target === "new" && isOld) {
    path = pathname.slice(4) || "/petitions";
    if (path === "/login") path = "/";
    if (path.startsWith("/review/")) path = path.replace("/review/", "/petitions/");
  }
  return path + (search ? `?${search.replace(/^\?/, "")}` : "");
}
