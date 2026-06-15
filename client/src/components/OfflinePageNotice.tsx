/**
 * OfflinePageNotice — Shows a subtle floating notice at the bottom
 * when viewing a cached page offline, indicating read-only mode.
 */
import { useState, useEffect } from "react";
import { WifiOff, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflinePageNotice() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (isOffline && !dismissed) {
      const timer = setTimeout(() => setDismissed(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [isOffline, dismissed]);

  const showNotice = isOffline && !dismissed;

  return (
    <AnimatePresence>
      {showNotice && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.5 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9998] flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg border border-stone-200/50 backdrop-blur-md"
          style={{ backgroundColor: "oklch(0.98 0.01 75 / 0.92)" }}
        >
          <div className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs font-medium text-stone-600">
              오프라인 읽기 전용 모드
            </span>
          </div>
          <div className="w-px h-3.5 bg-stone-300" />
          <span className="text-[11px] text-stone-400">
            캐시된 페이지를 보고 있습니다
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="ml-1 text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <WifiOff className="w-3 h-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
