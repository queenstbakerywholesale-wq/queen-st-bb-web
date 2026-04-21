import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useLocation } from "wouter";

const ADMIN_BASE = "/admin-angela91";

export default function AdminLogin() {
  const { login, isLoggingIn, loginError, isAuthenticated, isLoading } = useAdminAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, navigate] = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(ADMIN_BASE);
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Block search engine indexing
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    const prev = meta.content;
    meta.content = "noindex, nofollow";
    return () => {
      if (prev) meta.content = prev;
      else meta.remove();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(password);
      // Navigation will happen via the useEffect above after refetch
    } catch (err: any) {
      setError(err?.message || "Invalid password");
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F5F0EB" }}
      >
        <div
          className="text-sm tracking-[0.04em] uppercase animate-pulse"
          style={{
            fontFamily: "var(--font-body, 'Jost', sans-serif)",
            color: "#5A3A2E80",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F5F0EB" }}
    >
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-12">
          <h1
            className="text-2xl font-medium tracking-[0.04em] mb-2"
            style={{
              fontFamily: "var(--font-display, 'Cormorant Garamond', serif)",
              color: "#5A3A2E",
            }}
          >
            QUEEN ST BB
          </h1>
          <p
            className="text-[10px] uppercase tracking-[0.25em]"
            style={{
              fontFamily: "var(--font-body, 'Jost', sans-serif)",
              color: "#5A3A2E",
              opacity: 0.5,
            }}
          >
            Administration
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 text-sm border-b focus:outline-none transition-colors"
              style={{
                fontFamily: "var(--font-body, 'Jost', sans-serif)",
                backgroundColor: "transparent",
                borderColor: "#5A3A2E30",
                color: "#5A3A2E",
              }}
            />
          </div>

          {(error || loginError) && (
            <p
              className="text-xs"
              style={{
                fontFamily: "var(--font-body, 'Jost', sans-serif)",
                color: "#A0522D",
              }}
            >
              {error || loginError}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoggingIn || !password}
            className="w-full py-3 text-[11px] uppercase tracking-[0.04em] font-medium transition-all duration-300 disabled:opacity-40"
            style={{
              fontFamily: "var(--font-body, 'Jost', sans-serif)",
              backgroundColor: "#5A3A2E",
              color: "#F5F0EB",
            }}
          >
            {isLoggingIn ? "Verifying..." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}
