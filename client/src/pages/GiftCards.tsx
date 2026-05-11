/**
 * Gift Cards — Public purchase page
 * Luxury editorial design with amount selection, image selection, and Stripe checkout
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Gift, Check, Download, Search } from "lucide-react";

const AMOUNTS = [30, 50, 70, 100, 150, 200];

const CARD_IMAGES: Record<string, { label: string; gradient: string; accent: string }> = {
  classic: {
    label: "Classic",
    gradient: "linear-gradient(135deg, #3A2A1E 0%, #5A4A3E 50%, #3A2A1E 100%)",
    accent: "#D8C3A8",
  },
  floral: {
    label: "Floral",
    gradient: "linear-gradient(135deg, #F5E6D3 0%, #E8D5C0 50%, #DCC5A8 100%)",
    accent: "#8B6B4A",
  },
  minimal: {
    label: "Minimal",
    gradient: "linear-gradient(135deg, #FAFAF8 0%, #F0EDE8 50%, #E8E4DD 100%)",
    accent: "#3A2A1E",
  },
  celebration: {
    label: "Celebration",
    gradient: "linear-gradient(135deg, #5A3A2E 0%, #8B5E3C 50%, #C4956A 100%)",
    accent: "#FFD700",
  },
  coffee: {
    label: "Coffee",
    gradient: "linear-gradient(135deg, #2C1810 0%, #4A2C20 50%, #6B3A28 100%)",
    accent: "#E8D5C0",
  },
  dessert: {
    label: "Dessert",
    gradient: "linear-gradient(135deg, #F8E8D8 0%, #F0D8C0 50%, #E8C8A8 100%)",
    accent: "#5A3A2E",
  },
};

function GiftCardPreview({
  image,
  amount,
  recipientName,
  message,
  code,
}: {
  image: string;
  amount: number;
  recipientName?: string;
  message?: string;
  code?: string;
}) {
  const style = CARD_IMAGES[image] || CARD_IMAGES.classic;
  const isDark = ["classic", "coffee", "celebration"].includes(image);
  const textColor = isDark ? "#FFFFFF" : style.accent;
  const subtextColor = isDark ? "rgba(255,255,255,0.7)" : `${style.accent}99`;

  return (
    <div
      className="relative w-full aspect-[1.6/1] rounded-xl overflow-hidden shadow-xl"
      style={{ background: style.gradient }}
    >
      {/* Brand */}
      <div className="absolute top-5 left-6">
        <p
          className="text-lg md:text-xl"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            color: textColor,
            letterSpacing: "0.02em",
          }}
        >
          Queen St BB
        </p>
        <p
          className="text-[9px] uppercase mt-0.5"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            letterSpacing: "0.08em",
            color: subtextColor,
          }}
        >
          Gift Card
        </p>
      </div>

      {/* Amount */}
      <div className="absolute top-5 right-6 text-right">
        <p
          className="text-2xl md:text-3xl"
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            color: style.accent,
          }}
        >
          ${amount}
        </p>
        <p
          className="text-[10px] uppercase"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            letterSpacing: "0.05em",
            color: subtextColor,
          }}
        >
          AUD
        </p>
      </div>

      {/* Recipient & Message */}
      <div className="absolute bottom-14 left-6 right-6">
        {recipientName && (
          <p
            className="text-sm"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              color: textColor,
            }}
          >
            For: {recipientName}
          </p>
        )}
        {message && (
          <p
            className="text-xs mt-1 opacity-80 line-clamp-2"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              color: subtextColor,
              fontStyle: "italic",
            }}
          >
            "{message}"
          </p>
        )}
      </div>

      {/* Code */}
      <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
        <p
          className="text-[11px] font-mono tracking-wider"
          style={{ color: subtextColor }}
        >
          {code || "QSB-XXXX-XXXX-XXXX"}
        </p>
        <p
          className="text-[9px] uppercase"
          style={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            letterSpacing: "0.05em",
            color: subtextColor,
          }}
        >
          A Dessert Atelier
        </p>
      </div>

      {/* Decorative corner */}
      <div
        className="absolute top-0 right-0 w-20 h-20 opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${style.accent}, transparent)`,
        }}
      />
    </div>
  );
}

export default function GiftCards() {
  const [step, setStep] = useState<"select" | "details" | "processing">("select");
  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [selectedImage, setSelectedImage] = useState<string>("classic");
  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");

  // Balance check
  const [checkCode, setCheckCode] = useState("");
  const [showBalanceCheck, setShowBalanceCheck] = useState(false);

  const balanceQuery = trpc.giftCards.checkBalance.useQuery(
    { code: checkCode },
    { enabled: checkCode.length >= 10 }
  );

  const purchaseMutation = trpc.giftCards.purchaseGiftCard.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        toast.success("Redirecting to payment...");
        window.open(data.checkoutUrl, "_blank");
      }
      setStep("select");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create checkout session");
      setStep("details");
    },
  });

  const canProceed = useMemo(() => {
    if (step === "select") return selectedAmount > 0;
    if (step === "details") return purchaserName.trim() && purchaserEmail.trim();
    return false;
  }, [step, selectedAmount, purchaserName, purchaserEmail]);

  const handlePurchase = () => {
    setStep("processing");
    purchaseMutation.mutate({
      amount: selectedAmount,
      selectedImage: selectedImage as any,
      purchaserName: purchaserName.trim(),
      purchaserEmail: purchaserEmail.trim(),
      recipientName: recipientName.trim() || undefined,
      recipientEmail: recipientEmail.trim() || undefined,
      personalMessage: personalMessage.trim() || undefined,
      origin: window.location.origin,
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF7F2" }}>
      <Navigation variant="solid" />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-6 md:px-10">
        <div className="max-w-5xl mx-auto text-center">
          <h1
            className="text-4xl md:text-6xl mb-4"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              color: "#3A2A1E",
              letterSpacing: "0.01em",
              lineHeight: 1.15,
            }}
          >
            Gift Cards
          </h1>
          <p
            className="text-base md:text-lg max-w-xl mx-auto"
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 400,
              color: "#5A4A3E",
              lineHeight: 1.6,
            }}
          >
            Share the joy of artisan desserts. Choose an amount, select a beautiful design,
            and send a digital gift card to someone special.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-24 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left — Preview */}
            <div className="sticky top-28">
              <GiftCardPreview
                image={selectedImage}
                amount={selectedAmount}
                recipientName={recipientName}
                message={personalMessage}
              />
              <p
                className="text-center mt-4 text-xs"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 400,
                  color: "#8B7355",
                }}
              >
                Preview — your gift card will look like this
              </p>
            </div>

            {/* Right — Form */}
            <div>
              {step === "select" && (
                <div className="space-y-8">
                  {/* Amount Selection */}
                  <div>
                    <h3
                      className="text-sm uppercase mb-4"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                        color: "#5A4A3E",
                      }}
                    >
                      Select Amount
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {AMOUNTS.map((amount) => (
                        <button
                          key={amount}
                          onClick={() => setSelectedAmount(amount)}
                          className="py-4 rounded-lg border-2 transition-all duration-300"
                          style={{
                            borderColor:
                              selectedAmount === amount
                                ? "#3A2A1E"
                                : "#E8DDD0",
                            backgroundColor:
                              selectedAmount === amount
                                ? "#3A2A1E"
                                : "transparent",
                          }}
                        >
                          <span
                            className="text-lg"
                            style={{
                              fontFamily: "var(--font-display)",
                              fontWeight: 500,
                              color:
                                selectedAmount === amount
                                  ? "#FFFFFF"
                                  : "#3A2A1E",
                            }}
                          >
                            ${amount}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Image Selection */}
                  <div>
                    <h3
                      className="text-sm uppercase mb-4"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                        color: "#5A4A3E",
                      }}
                    >
                      Choose Design
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(CARD_IMAGES).map(([id, style]) => (
                        <button
                          key={id}
                          onClick={() => setSelectedImage(id)}
                          className="relative aspect-[1.6/1] rounded-lg overflow-hidden border-2 transition-all duration-300"
                          style={{
                            borderColor:
                              selectedImage === id ? "#3A2A1E" : "#E8DDD0",
                            background: style.gradient,
                          }}
                        >
                          {selectedImage === id && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <span
                            className="absolute bottom-1.5 left-2 text-[9px] uppercase"
                            style={{
                              fontFamily: "var(--font-body)",
                              fontWeight: 500,
                              letterSpacing: "0.04em",
                              color: ["classic", "coffee", "celebration"].includes(id)
                                ? "rgba(255,255,255,0.8)"
                                : "#5A4A3E",
                            }}
                          >
                            {style.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setStep("details")}
                    disabled={!canProceed}
                    className="w-full py-4 rounded-lg text-sm uppercase tracking-wider transition-all duration-300 disabled:opacity-40"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      backgroundColor: "#3A2A1E",
                      color: "#FFFFFF",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Continue — ${selectedAmount} AUD
                  </button>
                </div>
              )}

              {step === "details" && (
                <div className="space-y-6">
                  <button
                    onClick={() => setStep("select")}
                    className="text-sm mb-2 flex items-center gap-1"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      color: "#8B7355",
                    }}
                  >
                    ← Back to selection
                  </button>

                  {/* Your Details */}
                  <div>
                    <h3
                      className="text-sm uppercase mb-3"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                        color: "#5A4A3E",
                      }}
                    >
                      Your Details
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Your Name *"
                        value={purchaserName}
                        onChange={(e) => setPurchaserName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border text-sm"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 400,
                          borderColor: "#E8DDD0",
                          backgroundColor: "#FFFFFF",
                          color: "#3A2A1E",
                        }}
                      />
                      <input
                        type="email"
                        placeholder="Your Email *"
                        value={purchaserEmail}
                        onChange={(e) => setPurchaserEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border text-sm"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 400,
                          borderColor: "#E8DDD0",
                          backgroundColor: "#FFFFFF",
                          color: "#3A2A1E",
                        }}
                      />
                    </div>
                  </div>

                  {/* Recipient (Optional) */}
                  <div>
                    <h3
                      className="text-sm uppercase mb-3"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                        color: "#5A4A3E",
                      }}
                    >
                      Recipient (Optional)
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Recipient's Name"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border text-sm"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 400,
                          borderColor: "#E8DDD0",
                          backgroundColor: "#FFFFFF",
                          color: "#3A2A1E",
                        }}
                      />
                      <input
                        type="email"
                        placeholder="Recipient's Email (to send card directly)"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border text-sm"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 400,
                          borderColor: "#E8DDD0",
                          backgroundColor: "#FFFFFF",
                          color: "#3A2A1E",
                        }}
                      />
                      <textarea
                        placeholder="Personal message (max 500 characters)"
                        value={personalMessage}
                        onChange={(e) => setPersonalMessage(e.target.value.slice(0, 500))}
                        rows={3}
                        className="w-full px-4 py-3 rounded-lg border text-sm resize-none"
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 400,
                          borderColor: "#E8DDD0",
                          backgroundColor: "#FFFFFF",
                          color: "#3A2A1E",
                        }}
                      />
                      <p
                        className="text-right text-[11px]"
                        style={{ color: "#8B7355" }}
                      >
                        {personalMessage.length}/500
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handlePurchase}
                    disabled={!canProceed || purchaseMutation.isPending}
                    className="w-full py-4 rounded-lg text-sm uppercase tracking-wider transition-all duration-300 disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      backgroundColor: "#3A2A1E",
                      color: "#FFFFFF",
                      letterSpacing: "0.06em",
                    }}
                  >
                    <Gift className="w-4 h-4" />
                    {purchaseMutation.isPending
                      ? "Creating..."
                      : `Pay $${selectedAmount} AUD with Stripe`}
                  </button>

                  <p
                    className="text-center text-xs"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "#8B7355",
                    }}
                  >
                    You'll be redirected to Stripe for secure payment.
                    Gift card will be activated instantly after payment.
                  </p>
                </div>
              )}

              {step === "processing" && (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-[#3A2A1E] border-t-transparent rounded-full mx-auto mb-4" />
                  <p
                    className="text-sm"
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "#5A4A3E",
                    }}
                  >
                    Creating your gift card...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Balance Check Section */}
          <div className="mt-24 pt-16 border-t" style={{ borderColor: "#E8DDD0" }}>
            <div className="max-w-lg mx-auto text-center">
              <h2
                className="text-2xl md:text-3xl mb-3"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 500,
                  color: "#3A2A1E",
                }}
              >
                Check Your Balance
              </h2>
              <p
                className="text-sm mb-6"
                style={{
                  fontFamily: "var(--font-body)",
                  color: "#8B7355",
                }}
              >
                Enter your gift card code to check the remaining balance.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="QSB-XXXX-XXXX-XXXX"
                  value={checkCode}
                  onChange={(e) => setCheckCode(e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-lg border text-sm font-mono tracking-wider text-center"
                  style={{
                    borderColor: "#E8DDD0",
                    backgroundColor: "#FFFFFF",
                    color: "#3A2A1E",
                  }}
                />
                <button
                  onClick={() => setShowBalanceCheck(true)}
                  disabled={checkCode.length < 10}
                  className="px-5 py-3 rounded-lg transition-all disabled:opacity-40"
                  style={{
                    backgroundColor: "#3A2A1E",
                    color: "#FFFFFF",
                  }}
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {showBalanceCheck && balanceQuery.data && (
                <div
                  className="mt-6 p-6 rounded-xl text-left"
                  style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8DDD0" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs uppercase"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        letterSpacing: "0.05em",
                        color: "#8B7355",
                      }}
                    >
                      Current Balance
                    </span>
                    <span
                      className="text-xs uppercase px-2 py-0.5 rounded-full"
                      style={{
                        fontFamily: "var(--font-body)",
                        fontWeight: 500,
                        backgroundColor:
                          balanceQuery.data.status === "active"
                            ? "#E8F5E9"
                            : balanceQuery.data.status === "depleted"
                              ? "#FFEBEE"
                              : "#FFF3E0",
                        color:
                          balanceQuery.data.status === "active"
                            ? "#2E7D32"
                            : balanceQuery.data.status === "depleted"
                              ? "#C62828"
                              : "#E65100",
                      }}
                    >
                      {balanceQuery.data.status}
                    </span>
                  </div>
                  <p
                    className="text-3xl"
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 500,
                      color: "#3A2A1E",
                    }}
                  >
                    ${balanceQuery.data.currentBalance} AUD
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{ color: "#8B7355" }}
                  >
                    Original value: ${balanceQuery.data.initialAmount} AUD
                  </p>
                </div>
              )}

              {showBalanceCheck && checkCode.length >= 10 && !balanceQuery.data && !balanceQuery.isLoading && (
                <p
                  className="mt-4 text-sm"
                  style={{ color: "#C62828" }}
                >
                  Gift card not found. Please check the code and try again.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
