import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { Gift, Search, CreditCard, ArrowLeft, Clock, ArrowDownCircle, ArrowUpCircle, RefreshCw, ShieldX, Plus } from "lucide-react";
import { toast } from "sonner";
import { Link, useSearch } from "wouter";

const RECHARGE_AMOUNTS = [20, 30, 50, 70, 100, 150, 200];

export default function MyGiftCards() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [code, setCode] = useState("");
  const [lookupCode, setLookupCode] = useState("");
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(50);

  // Read URL params for auto-fill
  const searchString = useSearch();
  useEffect(() => {
    const params = new URLSearchParams(searchString);
    const urlCode = params.get("code");
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      setLookupCode(urlCode.toUpperCase());
    }
    if (params.get("recharged") === "true") {
      toast.success("E-Card recharged successfully!");
    }
    if (params.get("cancelled") === "true") {
      toast.info("Recharge cancelled");
    }
  }, []);

  const balanceQuery = trpc.giftCards.checkBalance.useQuery(
    { code: lookupCode },
    { enabled: !!lookupCode }
  );

  const rechargeMutation = trpc.giftCards.rechargeCard.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to payment...");
        window.open(data.checkoutUrl, "_blank");
      }
    },
    onError: (err) => toast.error(err.message || "Recharge failed"),
  });

  const handleCheckBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      toast.error("Please enter a gift card code");
      return;
    }
    setLookupCode(cleaned);
  };

  const handleRecharge = () => {
    if (!lookupCode) return;
    rechargeMutation.mutate({
      code: lookupCode,
      amount: rechargeAmount,
      origin: window.location.origin,
    });
  };

  const card = balanceQuery.data;

  return (
    <div style={{ backgroundColor: "#FAFAF8", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ backgroundColor: "#5A3A2E" }} className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.1em] mb-6 opacity-70 hover:opacity-100 transition-opacity" style={{ fontFamily: "var(--font-body)", color: "#D8C3A8" }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl mb-3" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#F5F0EB", letterSpacing: "0.01em" }}>
            E-Card Balance
          </h1>
          <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 300, color: "#D8C3A8" }}>
            Check balance, view history, and recharge your e-card
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-8">
        {/* Balance Check Form */}
        <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: "#fff", border: "1px solid #E8DDD0", boxShadow: "0 4px 20px rgba(90,58,46,0.06)" }}>
          <form onSubmit={handleCheckBalance} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#5A3A2E40" }} />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter e-card code (e.g., QSB-XXXX-XXXX-XXXX)"
                className="w-full pl-10 pr-4 py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5A3A2E20]"
                style={{ fontFamily: "var(--font-body)", backgroundColor: "#FAFAF8", borderColor: "#E8DDD0", color: "#5A3A2E" }}
              />
            </div>
            <button
              type="submit"
              disabled={balanceQuery.isFetching}
              className="px-6 py-3 text-[11px] uppercase tracking-[0.06em] rounded-lg transition-all cursor-pointer whitespace-nowrap"
              style={{ fontFamily: "var(--font-body)", fontWeight: 500, backgroundColor: "#5A3A2E", color: "#F5F0EB" }}
            >
              {balanceQuery.isFetching ? "Checking..." : "Check Balance"}
            </button>
          </form>
        </div>

        {/* Balance Result */}
        {balanceQuery.isError && (
          <div className="rounded-xl p-6 mb-8 text-center" style={{ backgroundColor: "#FFF5F5", border: "1px solid #FFCDD2" }}>
            <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#C62828" }}>
              E-Card not found. Please check the code and try again.
            </p>
          </div>
        )}

        {card && (
          <div className="space-y-6">
            {/* Card Summary */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E8DDD0", boxShadow: "0 4px 20px rgba(90,58,46,0.06)" }}>
              <div className="p-6" style={{ background: "linear-gradient(135deg, #5A3A2E 0%, #8B6F5E 100%)" }}>
                <div className="flex items-center justify-between mb-6">
                  <Gift className="w-8 h-8" style={{ color: "#D8C3A8" }} />
                  <span className="text-[10px] uppercase tracking-[0.1em] px-3 py-1 rounded-full" style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    backgroundColor: card.status === "active" ? "rgba(76,175,80,0.2)" : "rgba(255,255,255,0.15)",
                    color: card.status === "active" ? "#A5D6A7" : "#D8C3A8",
                  }}>
                    {card.status}
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-[0.1em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#D8C3A8" }}>
                  Current Balance
                </p>
                <p className="text-4xl mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#F5F0EB" }}>
                  ${Number(card.currentBalance).toFixed(2)}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#D8C3A880" }}>
                    Original: ${Number(card.initialAmount).toFixed(2)} AUD
                  </p>
                  <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#D8C3A880", letterSpacing: "0.05em" }}>
                    {card.code}
                  </p>
                </div>
              </div>

              <div className="p-6 grid grid-cols-2 gap-4" style={{ backgroundColor: "#fff" }}>
                {card.recipientName && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.06em] mb-0.5" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>Recipient</p>
                    <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>{card.recipientName}</p>
                  </div>
                )}
                {card.purchaserName && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.06em] mb-0.5" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>From</p>
                    <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>{card.purchaserName}</p>
                  </div>
                )}
                {card.expiresAt && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.06em] mb-0.5" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>Expires</p>
                    <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>
                      {new Date(card.expiresAt).toLocaleDateString("en-AU", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                  </div>
                )}
                {card.recipientMessage && (
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase tracking-[0.06em] mb-0.5" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>Message</p>
                    <p className="text-sm italic" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E", lineHeight: 1.6 }}>
                      "{card.recipientMessage}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recharge Section */}
            {(card.status === "active" || card.status === "depleted") && (
              <div className="rounded-xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #E8DDD0", boxShadow: "0 4px 20px rgba(90,58,46,0.06)" }}>
                {!showRecharge ? (
                  <button
                    onClick={() => setShowRecharge(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed transition-all hover:border-[#5A3A2E] hover:bg-[#5A3A2E08]"
                    style={{ borderColor: "#E8DDD0" }}
                  >
                    <Plus className="w-4 h-4" style={{ color: "#5A3A2E" }} />
                    <span className="text-sm uppercase tracking-[0.04em]" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>
                      Recharge This Card
                    </span>
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm uppercase tracking-[0.06em]" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        Recharge Amount
                      </h3>
                      <button onClick={() => setShowRecharge(false)} className="text-xs" style={{ color: "#8B7355" }}>Cancel</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {RECHARGE_AMOUNTS.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setRechargeAmount(amount)}
                          className="py-2.5 rounded-lg border-2 transition-all text-sm"
                          style={{
                            fontFamily: "var(--font-body)",
                            fontWeight: 500,
                            borderColor: rechargeAmount === amount ? "#5A3A2E" : "#E8DDD0",
                            backgroundColor: rechargeAmount === amount ? "#5A3A2E" : "transparent",
                            color: rechargeAmount === amount ? "#FFFFFF" : "#5A3A2E",
                          }}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleRecharge}
                      disabled={rechargeMutation.isPending}
                      className="w-full py-3 rounded-lg text-sm uppercase tracking-wider transition-all disabled:opacity-50"
                      style={{ fontFamily: "var(--font-body)", fontWeight: 500, backgroundColor: "#5A3A2E", color: "#FFFFFF" }}
                    >
                      {rechargeMutation.isPending ? "Processing..." : `Recharge $${rechargeAmount} AUD`}
                    </button>
                    <p className="text-[11px] text-center mt-2" style={{ color: "#8B7355" }}>
                      You'll be redirected to Stripe for secure payment.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Non-refundable Policy */}
            <div className="rounded-lg p-4 flex items-start gap-3" style={{ backgroundColor: "#FFF8E1", border: "1px solid #FFE082" }}>
              <ShieldX className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#F57C00" }} />
              <div>
                <p className="text-xs font-medium" style={{ fontFamily: "var(--font-body)", color: "#E65100" }}>Non-Refundable</p>
                <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--font-body)", color: "#F57C00" }}>
                  E-Card balances cannot be refunded or exchanged for cash. Recharging is available at any time.
                </p>
              </div>
            </div>

            {/* Transaction History */}
            {card.transactions && card.transactions.length > 0 && (
              <div className="rounded-xl p-6" style={{ backgroundColor: "#fff", border: "1px solid #E8DDD0", boxShadow: "0 4px 20px rgba(90,58,46,0.06)" }}>
                <h3 className="text-sm uppercase tracking-[0.06em] mb-4" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>
                  Transaction History
                </h3>
                <div className="space-y-3">
                  {card.transactions.map((tx: any, i: number) => {
                    const isDeduction = tx.type === "redemption" || tx.type === "admin_deduction" || tx.type === "void";
                    const isRecharge = tx.type === "recharge";
                    return (
                      <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < card.transactions.length - 1 ? "1px solid #5A3A2E08" : "none" }}>
                        <div className="flex items-center gap-3">
                          {isDeduction ? (
                            <ArrowDownCircle className="w-4 h-4" style={{ color: "#C62828" }} />
                          ) : isRecharge ? (
                            <RefreshCw className="w-4 h-4" style={{ color: "#1565C0" }} />
                          ) : (
                            <ArrowUpCircle className="w-4 h-4" style={{ color: "#2E7D32" }} />
                          )}
                          <div>
                            <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>
                              {tx.type === "activation" ? "Card Activated" :
                               tx.type === "redemption" ? "Redeemed" :
                               tx.type === "recharge" ? "Recharged" :
                               tx.type === "admin_deduction" ? "Balance Adjusted" :
                               tx.type === "void" ? "Voided" :
                               tx.type === "refund" ? "Refund" :
                               tx.type === "adjustment" ? "Adjustment" : tx.type}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3" style={{ color: "#5A3A2E40" }} />
                              <p className="text-[11px]" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>
                                {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("en-AU", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                              </p>
                            </div>
                            {tx.note && (
                              <p className="text-[11px] mt-0.5" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E50" }}>
                                {tx.note}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm" style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          color: isDeduction ? "#C62828" : isRecharge ? "#1565C0" : "#2E7D32",
                        }}>
                          {isDeduction ? "-" : "+"}${Number(tx.amount).toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!card && !balanceQuery.isError && !lookupCode && (
          <div className="text-center py-12">
            <Gift className="w-12 h-12 mx-auto mb-4" style={{ color: "#5A3A2E20" }} />
            <p className="text-sm mb-2" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>
              Enter your e-card code above
            </p>
            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>
              Your code is printed on your e-card or included in the email you received
            </p>
          </div>
        )}

        {/* Buy Gift Card CTA */}
        <div className="text-center py-8">
          <Link href="/gift-cards" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.06em] transition-colors hover:opacity-80" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>
            <Gift className="w-3.5 h-3.5" /> Purchase an E-Card
          </Link>
        </div>
      </div>
    </div>
  );
}
