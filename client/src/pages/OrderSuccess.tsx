/**
 * Order Success — shown after successful Stripe payment
 * Shows fulfillment details: shipping address or pickup location
 */
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Truck, Store } from "lucide-react";

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

  const brown = "oklch(0.34 0.05 45)";
  const cream = "oklch(0.91 0.02 75)";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ backgroundColor: "oklch(0.95 0.01 75)" }}
    >
      <div className="max-w-lg w-full text-center py-20">
        {isLoading ? (
          <div>
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-6"
              style={{ borderColor: `${brown}4D`, borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}B3` }}>
              Verifying your payment...
            </p>
          </div>
        ) : data?.status === "paid" ? (
          <>
            <div className="w-16 h-16 mx-auto mb-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: brown }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={cream} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl mb-4"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.01em", color: brown }}>
              Thank You
            </h1>
            <div className="editorial-rule mx-auto mb-6" />
            <p className="text-sm mb-2"
              style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}B3` }}>
              Your order has been confirmed.
            </p>
            {data.orderNumber && (
              <p className="text-xs mb-4"
                style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}99` }}>
                Order number: <strong style={{ fontWeight: 500 }}>{data.orderNumber}</strong>
              </p>
            )}

            {/* Fulfillment Info */}
            <div className="mx-auto max-w-xs mb-6 p-4 text-left" style={{ backgroundColor: `${brown}08`, border: `1px solid ${brown}1A` }}>
              <div className="flex items-center gap-2 mb-2">
                {data.fulfillmentType === "shipping" ? (
                  <Truck size={14} style={{ color: brown }} />
                ) : (
                  <Store size={14} style={{ color: brown }} />
                )}
                <span className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.05em", color: brown }}>
                  {data.fulfillmentType === "shipping" ? "Shipping" : "Store Pickup"}
                </span>
              </div>
              {data.fulfillmentType === "shipping" && data.shippingAddress && (
                <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}80`, lineHeight: 1.5 }}>
                  {data.shippingAddress}
                </p>
              )}
              {data.fulfillmentType === "pickup" && data.pickupBranchName && (
                <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}80`, lineHeight: 1.5 }}>
                  Collect from: {data.pickupBranchName}
                </p>
              )}
              {data.hasCakeItems && (
                <p className="text-[10px] mt-2" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "oklch(0.55 0.12 35)" }}>
                  This order contains cake items (pickup only)
                </p>
              )}
            </div>

            {data.customerEmail && (
              <p className="text-xs mb-8"
                style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}99` }}>
                A confirmation will be sent to {data.customerEmail}
              </p>
            )}
            <Link href="/">
              <span className="inline-block px-8 py-3 text-[11px] uppercase cursor-pointer transition-opacity hover:opacity-80"
                style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em", backgroundColor: brown, color: cream }}>
                Return Home
              </span>
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl mb-4"
              style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.01em", color: brown }}>
              Order Received
            </h1>
            <div className="editorial-rule mx-auto mb-6" />
            <p className="text-sm mb-8"
              style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}B3` }}>
              We have received your order. You will receive a confirmation shortly.
            </p>
            <Link href="/">
              <span className="inline-block px-8 py-3 text-[11px] uppercase cursor-pointer transition-opacity hover:opacity-80"
                style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em", backgroundColor: brown, color: cream }}>
                Return Home
              </span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
