import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    if (sessionStorage.getItem("pwa-install-dismissed")) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For iOS Safari (no beforeinstallprompt), show manual instructions
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !isStandalone) {
      setShowBanner(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!showBanner || dismissed) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[360px] z-[60] rounded-xl shadow-2xl p-4 flex items-start gap-3"
      style={{
        backgroundColor: "#5A3A2E",
        color: "#F5F0EB",
        fontFamily: "var(--font-body)",
        border: "1px solid #7A5A4E",
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "#D8C3A830" }}
      >
        <Download className="w-5 h-5" style={{ color: "#D8C3A8" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium mb-0.5" style={{ color: "#F5F0EB" }}>
          Install QSB Admin App
        </p>
        {isIOS && !deferredPrompt ? (
          <p className="text-xs" style={{ color: "#D8C3A8" }}>
            Tap the Share button, then "Add to Home Screen" to install this app.
          </p>
        ) : (
          <>
            <p className="text-xs mb-2" style={{ color: "#D8C3A8" }}>
              Get quick access to orders and management from your home screen.
            </p>
            <button
              onClick={handleInstall}
              className="px-3 py-1.5 text-xs rounded-md cursor-pointer transition-all hover:opacity-90"
              style={{
                backgroundColor: "#D8C3A8",
                color: "#5A3A2E",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              Install Now
            </button>
          </>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="cursor-pointer flex-shrink-0 mt-0.5"
        style={{ color: "#D8C3A880" }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
