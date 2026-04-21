/**
 * Order Success — shown after successful Stripe payment
 */
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

export default function OrderSuccess() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id"));
  }, []);

  const { data, isLoading } = trpc.stripe.verifySession.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "oklch(0.95 0.01 75)" }}
    >
      <div className="max-w-lg w-full text-center py-20">
        {isLoading ? (
          <div>
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-6"
              style={{ borderColor: "oklch(0.34 0.05 45 / 0.3)", borderTopColor: "transparent" }} />
            <p className="text-sm font-light" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.6)" }}>
              Verifying your payment...
            </p>
          </div>
        ) : data?.status === "paid" ? (
          <>
            <div className="w-16 h-16 mx-auto mb-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "oklch(0.34 0.05 45)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="oklch(0.91 0.02 75)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-light mb-4"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
              Thank You
            </h1>
            <div className="editorial-rule mx-auto mb-6" />
            <p className="text-sm font-light mb-2"
              style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.7)" }}>
              Your order has been confirmed.
            </p>
            {data.orderNumber && (
              <p className="text-xs font-light mb-6"
                style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.5)" }}>
                Order number: <strong>{data.orderNumber}</strong>
              </p>
            )}
            {data.customerEmail && (
              <p className="text-xs font-light mb-8"
                style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.5)" }}>
                A confirmation will be sent to {data.customerEmail}
              </p>
            )}
            <Link href="/">
              <span className="inline-block px-8 py-3 text-[11px] font-medium uppercase tracking-[0.2em] cursor-pointer transition-opacity hover:opacity-80"
                style={{ fontFamily: "var(--font-body)", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.91 0.02 75)" }}>
                Return Home
              </span>
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-light mb-4"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
              Order Received
            </h1>
            <div className="editorial-rule mx-auto mb-6" />
            <p className="text-sm font-light mb-8"
              style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.7)" }}>
              We have received your order. You will receive a confirmation shortly.
            </p>
            <Link href="/">
              <span className="inline-block px-8 py-3 text-[11px] font-medium uppercase tracking-[0.2em] cursor-pointer transition-opacity hover:opacity-80"
                style={{ fontFamily: "var(--font-body)", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.91 0.02 75)" }}>
                Return Home
              </span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
