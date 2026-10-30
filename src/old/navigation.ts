"use client";
import { useRouter as useNextRouter } from "next/navigation";
import { useMemo } from "react";
export { usePathname, useSearchParams, useParams, notFound, redirect } from "next/navigation";
export function oldPath(href: string) {
  return href.startsWith("/") && !href.startsWith("//") && href !== "/old" && !href.startsWith("/old/") && !href.startsWith("/old?") ? `/old${href === "/" ? "" : href}` : href;
}
export function useRouter() {
  const router = useNextRouter();
  return useMemo(() => ({ ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => router.push(oldPath(href), options),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => router.replace(oldPath(href), options),
  }), [router]);
}
