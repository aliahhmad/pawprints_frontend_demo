"use client";
import { useAuth as useDemoAuth, AuthProvider } from "@/components/auth-provider";
import { signOutDemo } from "@/lib/demo-client";
import type { UserProfile } from "@/old/types/UserProfile";
export { AuthProvider };
export function useAuth() {
  const { user: original, loading } = useDemoAuth();
  const user: UserProfile | null = original ? { ...original, roles: original.roles || [], committees: original.committees?.map(c => ({ ...c, description: null })) || [] } : null;
  return { user, loading, isLoggedIn: !!user, isAdmin: false,
    isCommitteeMember: !!user?.roles.some(role => role.name === "committee_member"),
    logIn: (ref = "") => {
      const next = ref.startsWith("petition=") ? `/old?${ref}` : window.location.pathname + window.location.search;
      window.location.assign(`/old/login?next=${encodeURIComponent(next)}`);
    },
    logOut: () => { signOutDemo(); window.location.assign("/old"); },
  };
}
