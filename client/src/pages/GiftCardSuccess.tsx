/**
 * Gift Card Success — After purchase, show the gift card with download option
 */
import { useRef } from "react";
import { trpc } from "@/lib/trpc";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useSearch } from "wouter";

const CARD_IMAGES: Record<string, { gradient: string; accent: string }> = {
  classic: {
    gradient: "linear-gradient(135deg, #3A2A1E 0%, #5A4A3E 50%, #3A2A1E 100%)",
    accent: "#D8C3A8",
  },
  floral: {
    gradient: "linear-gradient(135deg, #F5E6D3 0%, #E8D5C0 50%, #DCC5A8 100%)",
    accent: "#8B6B4A",
  },
  minimal: {
    gradient: "linear-gradient(135deg, #FAFAF8 0%, #F0EDE8 50%, #E8E4DD 100%)",
    accent: "#3A2A1E",
  },
  celebration: {
    gradient: "linear-gradient(135deg, #5A3A2E 0%, #8B5E3C 50%, #C4956A 100%)",
    accent: "#FFD700",
  },
  coffee: {
    gradient: "linear-gradient(135deg, #2C1810 0%, #4A2C20 50%, #6B3A28 100%)",
    accent: "#E8D5C0",
  },
  dessert: {
    gradient: "linear-gradient(135deg, #F8E8D8 0%, #F0D8C0 50%, #E8C8A8 100%)",
    accent: "#5A3A2E",
  },
};

export default function GiftCardSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const code = params.get("code") || "";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: card, isLoading } = trpc.giftCards.getByCode.useQuery(
    { code },
    { enabled: !!code }
  );

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  const downloadImage = () => {
    if (!card) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    const style = CARD_IMAGES[card.selectedImage] || CARD_IMAGES.classic;
    const isDark = ["classic", "coffee", "celebration"].includes(card.selectedImage);

    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    if (card.selectedImage === "classic") {
      gradient.addColorStop(0, "#3A2A1E");
      gradient.addColorStop(0.5, "#5A4A3E");
      gradient.addColorStop(1, "#3A2A1E");
    } else if (card.selectedImage === "floral") {
      gradient.addColorStop(0, "#F5E6D3");
      gradient.addColorStop(0.5, "#E8D5C0");
      gradient.addColorStop(1, "#DCC5A8");
    } else if (card.selectedImage === "minimal") {
      gradient.addColorStop(0, "#FAFAF8");
      gradient.addColorStop(0.5, "#F0EDE8");
      gradient.addColorStop(1, "#E8E4DD");
    } else if (card.selectedImage === "celebration") {
      gradient.addColorStop(0, "#5A3A2E");
      gradient.addColorStop(0.5, "#8B5E3C");
      gradient.addColorStop(1, "#C4956A");
    } else if (card.selectedImage === "coffee") {
      gradient.addColorStop(0, "#2C1810");
      gradient.addColorStop(0.5, "#4A2C20");
      gradient.addColorStop(1, "#6B3A28");
    } else {
      gradient.addColorStop(0, "#F8E8D8");
      gradient.addColorStop(0.5, "#F0D8C0");
      gradient.addColorStop(1, "#E8C8A8");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rounded corners (clip)
    ctx.save();

    const textColor = isDark ? "#FFFFFF" : style.accent;
    const subtextColor = isDark ? "rgba(255,255,255,0.7)" : style.accent + "99";

    // Brand name
    ctx.font = "500 28px 'Playfair Display', Georgia, serif";
    ctx.fillStyle = textColor;
    ctx.fillText("Queen St BB", 40, 55);

    ctx.font = "500 10px 'Inter', Arial, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.fillText("GIFT CARD", 40, 75);

    // Amount
    ctx.font = "500 48px 'Playfair Display', Georgia, serif";
    ctx.fillStyle = style.accent;
    ctx.textAlign = "right";
    ctx.fillText(`$${card.initialAmount}`, canvas.width - 40, 60);

    ctx.font = "500 12px 'Inter', Arial, sans-serif";
    ctx.fillStyle = subtextColor;
    ctx.fillText("AUD", canvas.width - 40, 82);

    // Recipient
    ctx.textAlign = "left";
    if (card.recipientName) {
      ctx.font = "500 16px 'Inter', Arial, sans-serif";
      ctx.fillStyle = textColor;
      ctx.fillText(`For: ${card.recipientName}`, 40, canvas.height - 100);
    }

    if (card.personalMessage) {
      ctx.font = "italic 13px 'Inter', Arial, sans-serif";
      ctx.fillStyle = subtextColor;
      const msg = card.personalMessage.length > 80
        ? card.personalMessage.slice(0, 80) + "..."
        : card.personalMessage;
      ctx.fillText(`"${msg}"`, 40, canvas.height - 72);
    }

    // Code
    ctx.font = "500 14px 'Courier New', monospace";
    ctx.fillStyle = subtextColor;
    ctx.fillText(card.code, 40, canvas.height - 30);

    ctx.textAlign = "right";
    ctx.font = "500 10px 'Inter', Arial, sans-serif";
    ctx.fillText("A DESSERT ATELIER", canvas.width - 40, canvas.height - 30);

    ctx.restore();

    // Download
    const link = document.createElement("a");
    link.download = `queen-st-bb-gift-card-${card.code}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Gift card image downloaded!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF7F2" }}>
        <div className="animate-spin w-8 h-8 border-2 border-[#3A2A1E] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#FAF7F2" }}>
        <Navigation variant="solid" />
        <div className="pt-32 pb-24 px-6 text-center">
          <h1
            className="text-3xl mb-4"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#3A2A1E" }}
          >
            Gift Card Not Found
          </h1>
          <p style={{ fontFamily: "var(--font-body)", color: "#8B7355" }}>
            This gift card may still be processing. Please check your email for confirmation.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  const style = CARD_IMAGES[card.selectedImage] || CARD_IMAGES.classic;
  const isDark = ["classic", "coffee", "celebration"].includes(card.selectedImage);
  const textColor = isDark ? "#FFFFFF" : style.accent;
  const subtextColor = isDark ? "rgba(255,255,255,0.7)" : style.accent + "99";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF7F2" }}>
      <Navigation variant="solid" />
      <canvas ref={canvasRef} className="hidden" />

      <section className="pt-32 pb-24 px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: "#E8F5E9" }}>
            <Check className="w-7 h-7 text-green-700" />
          </div>

          <h1
            className="text-3xl md:text-4xl mb-3"
            style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#3A2A1E" }}
          >
            Your Gift Card is Ready!
          </h1>
          <p
            className="text-sm mb-10"
            style={{ fontFamily: "var(--font-body)", color: "#8B7355" }}
          >
            {card.status === "active"
              ? "Payment confirmed. Your gift card is now active and ready to use."
              : "Your gift card is being processed. It will be active shortly."}
          </p>

          {/* Gift Card Preview */}
          <div
            className="relative w-full max-w-md mx-auto aspect-[1.6/1] rounded-xl overflow-hidden shadow-2xl mb-8"
            style={{ background: style.gradient }}
          >
            <div className="absolute top-5 left-6">
              <p className="text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: textColor, letterSpacing: "0.02em" }}>
                Queen St BB
              </p>
              <p className="text-[9px] uppercase mt-0.5" style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.08em", color: subtextColor }}>
                Gift Card
              </p>
            </div>
            <div className="absolute top-5 right-6 text-right">
              <p className="text-2xl md:text-3xl" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: style.accent }}>
                ${card.initialAmount}
              </p>
              <p className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.05em", color: subtextColor }}>
                AUD
              </p>
            </div>
            <div className="absolute bottom-14 left-6 right-6">
              {card.recipientName && (
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: textColor }}>
                  For: {card.recipientName}
                </p>
              )}
              {card.personalMessage && (
                <p className="text-xs mt-1 opacity-80 line-clamp-2" style={{ fontFamily: "var(--font-body)", color: subtextColor, fontStyle: "italic" }}>
                  "{card.personalMessage}"
                </p>
              )}
            </div>
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between">
              <p className="text-[11px] font-mono tracking-wider" style={{ color: subtextColor }}>
                {card.code}
              </p>
              <p className="text-[9px] uppercase" style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.05em", color: subtextColor }}>
                A Dessert Atelier
              </p>
            </div>
          </div>

          {/* Code & Actions */}
          <div className="max-w-md mx-auto space-y-4">
            <div
              className="flex items-center justify-between px-5 py-3 rounded-lg"
              style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8DDD0" }}
            >
              <span className="font-mono text-sm tracking-wider" style={{ color: "#3A2A1E" }}>
                {card.code}
              </span>
              <button
                onClick={copyCode}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Copy className="w-4 h-4" style={{ color: "#8B7355" }} />
              </button>
            </div>

            <button
              onClick={downloadImage}
              className="w-full py-3.5 rounded-lg text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                backgroundColor: "#3A2A1E",
                color: "#FFFFFF",
                letterSpacing: "0.06em",
              }}
            >
              <Download className="w-4 h-4" />
              Download Gift Card Image
            </button>

            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#8B7355" }}>
              Present this code in-store or share the downloaded image with your recipient.
              Valid for 3 years from purchase date.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
