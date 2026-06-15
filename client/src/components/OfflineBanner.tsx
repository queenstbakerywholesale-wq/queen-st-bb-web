/**
 * OfflineBanner — Shows a subtle top banner when the user goes offline.
 * Includes a "Retry" button and shows a toast when connection is restored.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      wasOfflineRef.current = true;
    };
    const handleOnline = () => {
      setIsOffline(false);
      if (wasOfflineRef.current) {
        toast.success("다시 연결되었습니다", {
          duration: 3000,
          icon: "✓",
        });
        wasOfflineRef.current = false;
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      // Attempt a lightweight network request to check connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      await fetch("/api/trpc/auth.me", {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);
      // If fetch succeeds, the browser should fire the "online" event
      // But in case it doesn't, manually update state
      if (!navigator.onLine) {
        // Still offline according to browser
        toast.error("아직 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setIsOffline(false);
        if (wasOfflineRef.current) {
          toast.success("다시 연결되었습니다", {
            duration: 3000,
            icon: "✓",
          });
          wasOfflineRef.current = false;
        }
      }
    } catch {
      toast.error("아직 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsRetrying(false);
    }
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 bg-[#5A3A2E] text-white text-sm font-medium py-2.5 px-4 shadow-md"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>인터넷 연결이 끊겼습니다. 연결 상태를 확인해주세요.</span>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xs font-semibold disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? "animate-spin" : ""}`} />
            다시 시도
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
