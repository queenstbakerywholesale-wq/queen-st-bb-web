/**
 * OfflineBanner — Shows a subtle top banner when the user goes offline.
 * Automatically disappears when connection is restored.
 */
import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-[#5A3A2E] text-white text-sm font-medium py-2.5 px-4 shadow-md"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>인터넷 연결이 끊겼습니다. 연결 상태를 확인해주세요.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
