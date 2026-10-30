export const SIGNATURE_GOAL = 200;
export const PETITIONS_PER_PAGE = 20;
export const PETITION_STATUSES = [
  "Active",
  "Charged",
  "Responded",
  "Expired",
] as const;
export const SORT_OPTIONS = [
  { value: "", label: "Recommended" },
  { value: "-created_at", label: "Newest first" },
  { value: "created_at", label: "Oldest first" },
  { value: "-total_signatures", label: "Most signatures" },
  { value: "total_signatures", label: "Fewest signatures" },
] as const;

export interface PetitionFilters {
  query: string;
  status: string;
  tag: string;
  sort: string;
}

export function parsePage(value: string | null): number {
  if (!value || !/^[1-9]\d*$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page <= 2147483647 ? page : 1;
}

export function parseFilters(
  params: Pick<URLSearchParams, "get">
): PetitionFilters {
  const status = params.get("status") || "";
  const tag = params.get("tag") || "";
  const sort = params.get("sort") || "";
  return {
    query: (params.get("query") || "").slice(0, 500),
    status: /^[0-3]$/.test(status) ? status : "",
    tag: /^[1-9]\d*$/.test(tag) ? tag : "",
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? sort : "",
  };
}

export function petitionSearchParams(
  filters: PetitionFilters,
  page = 1
): URLSearchParams {
  const params = new URLSearchParams({
    page: String(page),
    items_per_page: String(PETITIONS_PER_PAGE),
  });
  if (filters.query.trim()) params.set("query", filters.query.trim());
  if (filters.status) params.set("status", filters.status);
  if (filters.tag) params.set("tag_id", filters.tag);
  if (filters.sort) params.set("sort", filters.sort);
  return params;
}

export function safeReturnPath(value: string | null): string {
  if (!value || /[\\\r\n]/.test(value)) return "/petitions";
  try {
    const url = new URL(value, "http://pawprints.local");
    if (
      url.origin !== "http://pawprints.local" ||
      url.pathname !== value.split(/[?#]/)[0] ||
      !(
        url.pathname === "/petitions" ||
        url.pathname === "/create" ||
        url.pathname === "/profile" ||
        /^\/petitions\/[1-9]\d*$/.test(url.pathname)
      )
    )
      return "/petitions";
    return url.pathname + url.search;
  } catch {
    return "/petitions";
  }
}

export function authorName(
  author: { first_name: string; last_name: string; username: string } | null
) {
  return author
    ? [author.first_name, author.last_name].filter(Boolean).join(" ") ||
        author.username
    : "Unknown author";
}

export function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

export function legacyLink(path: string) {
  return `/continue?to=${encodeURIComponent(path)}`;
}
