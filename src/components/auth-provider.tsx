"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { DEMO_CHANGE_EVENT, DemoError, getCurrentUser } from "@/lib/demo-client";
import type { UserProfile } from "@/lib/types";

const AuthContext = createContext<{
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
} | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  useEffect(() => {
    window.addEventListener(DEMO_CHANGE_EVENT, retry);
    window.addEventListener("storage", retry);
    return () => {
      window.removeEventListener(DEMO_CHANGE_EVENT, retry);
      window.removeEventListener("storage", retry);
    };
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    getCurrentUser(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setUser(data);
          setError(null);
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setUser(null);
        setError(
          error instanceof DemoError && error.status === 401
            ? null
            : "We couldn’t read the example account. You can still browse sample petitions."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [attempt]);
  return (
    <AuthContext.Provider value={{ user, loading, error, retry }}>
      {children}
    </AuthContext.Provider>
  );
}

const subscribeToHydration = () => () => {};
const clientHydrated = () => true;
const serverHydrated = () => false;

export function useClientHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    clientHydrated,
    serverHydrated
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  const hydrated = useClientHydrated();
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  // Deferred navigation can hydrate after the session request has completed.
  // Match the server's initial account state for that first hydration render.
  return hydrated
    ? value
    : { ...value, user: null, loading: true, error: null };
}
