import { useState, useEffect, useCallback } from "react";

/**
 * Hook to track network connectivity status.
 * Returns isOnline state and a manual check function.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch("/api/trpc/auth.me", {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isOnline, checkConnection };
}
