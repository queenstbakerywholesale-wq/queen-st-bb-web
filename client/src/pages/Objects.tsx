/**
 * Objects — Minimal shop layout with live product data + Stripe checkout
 * Palette: brand-brown, parchment, cocoa, linen
 * Clean, premium presentation — focus on product and spacing
 * Fulfillment: shipping + pickup for regular items, pickup-only for cakes
 * Features: dynamic AusPost shipping, cake pickup booking in checkout
 */
import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import PageLayout from "@/components/PageLayout";
import { toast } from "sonner";
import {
  X, ShoppingBag, Plus, Minus, Truck, Store,
  AlertTriangle, MapPin, Calendar, Clock, Loader2, ChevronLeft, Gift, Check,
} from "lucide-react";
import { usePageImage } from "@/hooks/usePageImage";
import { isPickupOnlyType, DEFAULT_SHIPPING_FEE_AUD } from "@shared/const";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-objects-aKrCAfQFaFKVp7bwFWiYN7.webp";

type CartItem = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  imageUrl?: string;
  productType: string;
};

// Fallback static data when no products in DB
const fallbackObjects = [
  {
    category: "Ceramics",
    items: [
      { id: 901, name: "Atelier Espresso Cup", detail: "Hand-thrown stoneware, ivory glaze", price: 48, imageUrl: "", productType: "merchandise" },
      { id: 902, name: "Dessert Plate — Terracotta", detail: "Artisan ceramic, matte finish", price: 62, imageUrl: "", productType: "merchandise" },
      { id: 903, name: "Serving Bowl — Marble", detail: "Carrara marble, hand-polished", price: 185, imageUrl: "", productType: "merchandise" },
    ],
  },
  {
    category: "Textiles",
    items: [
      { id: 904, name: "Linen Napkin Set", detail: "Belgian linen, natural dye", price: 38, imageUrl: "", productType: "merchandise" },
      { id: 905, name: "Apron — Atelier Edition", detail: "Washed cotton, brass hardware", price: 95, imageUrl: "", productType: "merchandise" },
    ],
  },
  {
    category: "Confections",
    items: [
      { id: 906, name: "Chocolate Collection", detail: "Single-origin, hand-tempered", price: 42, imageUrl: "", productType: "merchandise" },
      { id: 907, name: "Biscotti Gift Box", detail: "Almond & pistachio, wrapped in tissue", price: 36, imageUrl: "", productType: "merchandise" },
      { id: 908, name: "House Blend Coffee", detail: "Medium roast, caramel & hazelnut notes", price: 28, imageUrl: "", productType: "merchandise" },
    ],
  },
];

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

// Generate next 14 days for date picker
function getAvailableDates(): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-AU", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    dates.push({ value, label });
  }
  return dates;
}

export default function Objects() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "details" | "pickup">("cart");
  const [fulfillmentType, setFulfillmentType] = useState<"shipping" | "pickup">("shipping");
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    phone: "",
    shippingAddress: "",
    shippingPostcode: "",
    pickupBranchId: 0,
    pickupDate: "",
    pickupTime: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardApplied, setGiftCardApplied] = useState<{ code: string; balance: number; discount: number } | null>(null);
  const [isCheckingGiftCard, setIsCheckingGiftCard] = useState(false);
  const [postcodeInput, setPostcodeInput] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedProduct, setSelectedProduct] = useState<{ id: number; name: string; detail: string; description?: string; price: number; imageUrl: string; productType: string } | null>(null);
  const [shippingQuote, setShippingQuote] = useState<{
    price: number;
    serviceName: string;
    estimatedDays: string | null;
    serviceCode: string;
  } | null>(null);
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);

  const { data: liveProducts } = trpc.publicProducts.list.useQuery({ limit: 100 });
  const { data: liveCategories } = trpc.publicProducts.categories.useQuery();
  const { data: branchesData } = trpc.publicBookings.branches.useQuery();
  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation();
  const shippingCalcQuery = trpc.stripe.calculateShipping.useQuery(
    { postcode: postcodeInput },
    { enabled: postcodeInput.length >= 4, staleTime: 60000 }
  );

  // Slot availability for cake pickup
  const slotsQuery = trpc.publicBookings.checkSlots.useQuery(
    { branchId: checkoutForm.pickupBranchId, date: checkoutForm.pickupDate },
    {
      enabled: checkoutForm.pickupBranchId > 0 && checkoutForm.pickupDate.length > 0,
      staleTime: 30000,
    }
  );

  const availableDates = useMemo(() => getAvailableDates(), []);

  // Detect if cart has cake items
  const hasCakeItems = useMemo(
    () => cart.some((item) => isPickupOnlyType(item.productType)),
    [cart]
  );

  // Force pickup when cart has cake items
  useEffect(() => {
    if (hasCakeItems && fulfillmentType !== "pickup") {
      setFulfillmentType("pickup");
    }
  }, [hasCakeItems, fulfillmentType]);

  // Update shipping quote when API returns
  useEffect(() => {
    if (shippingCalcQuery.data && !shippingCalcQuery.isLoading) {
      setShippingQuote({
        price: shippingCalcQuery.data.selectedPrice,
        serviceName: shippingCalcQuery.data.selectedService,
        estimatedDays: shippingCalcQuery.data.estimatedDays,
        serviceCode: shippingCalcQuery.data.quotes[0]?.serviceCode || "",
      });
      setIsCalculatingShipping(false);
    }
  }, [shippingCalcQuery.data, shippingCalcQuery.isLoading]);

  // Group live products by category
  // Category display order preference
  const categoryOrder = ["Mugs", "Tumblers", "Caps", "Eco Bags", "Postcards", "Other"];

  const displayData = useMemo(() => {
    if (!liveProducts || liveProducts.length === 0) return fallbackObjects;
    const categoryMap = new Map<number, string>();
    if (liveCategories) {
      for (const c of liveCategories) categoryMap.set(c.id, c.name);
    }
    const grouped: Record<string, { id: number; name: string; detail: string; description?: string; price: number; imageUrl: string; productType: string }[]> = {};
    for (const p of liveProducts) {
      // Only show merchandise items on Objects page (exclude food/cake/gelato)
      if (p.productType !== "merchandise") continue;
      const catName = p.categoryId ? categoryMap.get(p.categoryId) || "Other" : "Other";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push({
        id: p.id,
        name: p.name,
        detail: p.shortDescription || "",
        description: p.description || p.shortDescription || "",
        price: Number(p.price),
        imageUrl: p.imageUrl || "",
        productType: p.productType,
      });
    }
    // Sort categories by preferred order
    const sorted = Object.entries(grouped)
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => {
        const aIdx = categoryOrder.indexOf(a.category);
        const bIdx = categoryOrder.indexOf(b.category);
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
      });
    return sorted;
  }, [liveProducts, liveCategories]);

  // Available categories for filter tabs
  const availableCategories = useMemo(() => {
    const cats = displayData.map((d) => d.category);
    return ["All", ...cats];
  }, [displayData]);

  // Filtered display data based on active category
  const filteredDisplayData = useMemo(() => {
    if (activeCategory === "All") return displayData;
    return displayData.filter((d) => d.category === activeCategory);
  }, [displayData, activeCategory]);

  const addToCart = useCallback((item: { id: number; name: string; price: number; imageUrl?: string; productType: string }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === item.id);
      if (existing) {
        return prev.map((c) => c.productId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { productId: item.id, productName: item.name, price: item.price, quantity: 1, imageUrl: item.imageUrl || undefined, productType: item.productType }];
    });
    toast.success(`${item.name} added to bag`);
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) => prev.map((c) => c.productId === productId ? { ...c, quantity: c.quantity + delta } : c).filter((c) => c.quantity > 0));
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }, []);

  const cartSubtotal = useMemo(() => cart.reduce((sum, c) => sum + c.price * c.quantity, 0), [cart]);
  const shippingFee = fulfillmentType === "shipping" ? (shippingQuote?.price ?? DEFAULT_SHIPPING_FEE_AUD) : 0;
  const giftCardDiscount = giftCardApplied?.discount || 0;
  const cartTotal = Math.max(0, cartSubtotal + shippingFee - giftCardDiscount);
  const cartCount = useMemo(() => cart.reduce((sum, c) => sum + c.quantity, 0), [cart]);

  const selectedBranch = useMemo(() => {
    if (!branchesData || !checkoutForm.pickupBranchId) return null;
    return branchesData.find((b: any) => b.id === checkoutForm.pickupBranchId) || null;
  }, [branchesData, checkoutForm.pickupBranchId]);

  const handlePostcodeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    setPostcodeInput(cleaned);
    setCheckoutForm((f) => ({ ...f, shippingPostcode: cleaned }));
    if (cleaned.length >= 4) {
      setIsCalculatingShipping(true);
      setShippingQuote(null);
    }
  };

  // Validate before proceeding to payment
  const canProceedToPayment = useMemo(() => {
    if (!checkoutForm.name || !checkoutForm.email) return false;
    if (fulfillmentType === "shipping") {
      if (!checkoutForm.shippingAddress || postcodeInput.length < 4) return false;
    }
    if (fulfillmentType === "pickup") {
      if (!checkoutForm.pickupBranchId) return false;
      if (hasCakeItems && (!checkoutForm.pickupDate || !checkoutForm.pickupTime)) return false;
    }
    return true;
  }, [checkoutForm, fulfillmentType, postcodeInput, hasCakeItems]);

  const balanceCheckMutation = trpc.giftCards.checkBalance.useQuery(
    { code: giftCardCode },
    { enabled: false }
  );

  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    setIsCheckingGiftCard(true);
    try {
      const res = await fetch(`/api/trpc/giftCards.checkBalance?input=${encodeURIComponent(JSON.stringify({ code: giftCardCode.trim().toUpperCase() }))}`);
      const json = await res.json();
      const result = json?.result?.data;
      if (!result || result.status !== "active") {
        toast.error("Gift card is not active or not found");
        setIsCheckingGiftCard(false);
        return;
      }
      const balance = parseFloat(result.currentBalance);
      const totalBeforeDiscount = cartSubtotal + shippingFee;
      const discount = Math.min(balance, totalBeforeDiscount);
      setGiftCardApplied({ code: giftCardCode.trim().toUpperCase(), balance, discount });
      toast.success(`Gift card applied! -$${discount.toFixed(2)}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to verify gift card");
    } finally {
      setIsCheckingGiftCard(false);
    }
  };

  const handleRemoveGiftCard = () => {
    setGiftCardApplied(null);
    setGiftCardCode("");
    toast.info("Gift card removed");
  };

  const handleCheckout = async () => {
    if (!canProceedToPayment) {
      toast.error("Please complete all required fields");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await checkoutMutation.mutateAsync({
        items: cart.map((item) => ({
          ...item,
          imageUrl: item.imageUrl || undefined,
          size: item.size || undefined,
        })),
        customerName: checkoutForm.name,
        customerEmail: checkoutForm.email,
        customerPhone: checkoutForm.phone || undefined,
        fulfillmentType,
        shippingAddress: fulfillmentType === "shipping" ? checkoutForm.shippingAddress : undefined,
        shippingPostcode: fulfillmentType === "shipping" ? postcodeInput : undefined,
        shippingServiceCode: fulfillmentType === "shipping" && shippingQuote ? shippingQuote.serviceCode : undefined,
        pickupBranchId: fulfillmentType === "pickup" ? checkoutForm.pickupBranchId : undefined,
        pickupBranchName: fulfillmentType === "pickup" && selectedBranch ? (selectedBranch as any).name : undefined,
        pickupDate: hasCakeItems ? checkoutForm.pickupDate : undefined,
        pickupTime: hasCakeItems ? checkoutForm.pickupTime : undefined,
        giftCardCode: giftCardApplied?.code || undefined,
        giftCardAmount: giftCardApplied?.discount || undefined,
      });
      if (result.checkoutUrl) {
        toast.success("Redirecting to secure checkout...");
        window.open(result.checkoutUrl, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create checkout session");
    } finally {
      setIsProcessing(false);
    }
  };

  // Style constants
  const brown = "oklch(0.34 0.05 45)";
  const cream = "oklch(0.91 0.02 75)";
  const parchment = "oklch(0.95 0.01 75)";
  const midBrown = "oklch(0.45 0.06 45)";
  const borderColor = "oklch(0.84 0.025 72 / 0.4)";
  const accent = "oklch(0.55 0.12 35)";

  const inputStyle = {
    fontFamily: "var(--font-body)",
    borderColor,
    backgroundColor: "transparent",
    color: brown,
  };

  const labelStyle = {
    fontFamily: "var(--font-body)",
    fontWeight: 500 as const,
    letterSpacing: "0.05em",
    color: `${brown}80`,
  };

  // Available time slots for cake pickup
  const availableSlots = useMemo(() => {
    if (!slotsQuery.data?.slots) return [];
    return slotsQuery.data.slots.filter((s: any) => s.available);
  }, [slotsQuery.data]);

  return (
    <PageLayout
      heroImage={usePageImage("objects", "hero", DEFAULT_HERO)}
      heroTitle="Objects"
      heroSubtitle="Curated for the everyday ritual"
    >
      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => { setCartOpen(true); setCheckoutStep("cart"); }}
          className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          style={{ backgroundColor: brown, color: cream }}
        >
          <ShoppingBag size={20} />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center"
            style={{ backgroundColor: accent, color: "#fff" }}>
            {cartCount}
          </span>
        </motion.button>
      )}

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              className="fixed inset-0 z-[60]"
              style={{ backgroundColor: "oklch(0.34 0.05 45 / 0.4)" }}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md z-[70] flex flex-col shadow-2xl"
              style={{ backgroundColor: parchment }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor }}>
                {checkoutStep !== "cart" ? (
                  <button
                    onClick={() => setCheckoutStep(checkoutStep === "pickup" ? "details" : "cart")}
                    className="flex items-center gap-1 cursor-pointer"
                    style={{ color: `${brown}99` }}
                  >
                    <ChevronLeft size={18} />
                    <span className="text-xs uppercase" style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em" }}>Back</span>
                  </button>
                ) : (
                  <h2 className="text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: brown }}>
                    Your Bag ({cartCount})
                  </h2>
                )}
                <button onClick={() => setCartOpen(false)} className="p-1 cursor-pointer" style={{ color: `${brown}99` }}>
                  <X size={20} />
                </button>
              </div>

              {/* === STEP: CART === */}
              {checkoutStep === "cart" && (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                      <p className="text-center text-sm py-12" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}80` }}>
                        Your bag is empty
                      </p>
                    ) : (
                      <>
                        {cart.map((item) => (
                          <div key={item.productId} className="flex gap-4">
                            <div className="w-16 h-20 flex-shrink-0 overflow-hidden" style={{ backgroundColor: cream }}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ShoppingBag size={14} style={{ color: "oklch(0.72 0.03 65)" }} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm mb-1" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: brown }}>
                                {item.productName}
                              </h3>
                              <div className="flex items-center gap-2 mb-2">
                                <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: midBrown }}>
                                  ${item.price.toFixed(0)}
                                </p>
                                {isPickupOnlyType(item.productType) && (
                                  <span className="text-[9px] uppercase px-1.5 py-0.5" style={{
                                    fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.05em",
                                    backgroundColor: `${accent}18`, color: accent,
                                  }}>
                                    Pickup Only
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center border cursor-pointer" style={{ borderColor, color: `${brown}99` }}>
                                  <Minus size={12} />
                                </button>
                                <span className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: brown }}>
                                  {item.quantity}
                                </span>
                                <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center border cursor-pointer" style={{ borderColor, color: `${brown}99` }}>
                                  <Plus size={12} />
                                </button>
                                <button onClick={() => removeFromCart(item.productId)} className="ml-auto text-[10px] uppercase cursor-pointer" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: `${brown}66` }}>
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Cake items notice */}
                        {hasCakeItems && (
                          <div className="flex items-start gap-3 p-4 rounded" style={{ backgroundColor: `${accent}0A`, border: `1px solid ${accent}26` }}>
                            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: accent }} />
                            <p className="text-xs leading-relaxed" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: accent }}>
                              Your bag contains cake items. Cakes are available for pickup only. Shipping has been disabled for this order.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Cart Footer */}
                  {cart.length > 0 && (
                    <div className="p-6 border-t" style={{ borderColor }}>
                      {/* Fulfillment Type Selector */}
                      <div className="mb-4">
                        <p className="text-[10px] uppercase mb-2" style={labelStyle}>
                          Fulfillment Method
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => !hasCakeItems && setFulfillmentType("shipping")}
                            disabled={hasCakeItems}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border text-[11px] uppercase cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{
                              fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em",
                              borderColor: fulfillmentType === "shipping" ? brown : borderColor,
                              backgroundColor: fulfillmentType === "shipping" ? brown : "transparent",
                              color: fulfillmentType === "shipping" ? cream : brown,
                            }}
                          >
                            <Truck size={14} />
                            Shipping
                          </button>
                          <button
                            onClick={() => setFulfillmentType("pickup")}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 border text-[11px] uppercase cursor-pointer transition-all"
                            style={{
                              fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em",
                              borderColor: fulfillmentType === "pickup" ? brown : borderColor,
                              backgroundColor: fulfillmentType === "pickup" ? brown : "transparent",
                              color: fulfillmentType === "pickup" ? cream : brown,
                            }}
                          >
                            <Store size={14} />
                            Store Pickup
                          </button>
                        </div>
                        <p className="text-[10px] mt-1.5" style={{ fontFamily: "var(--font-body)", color: `${brown}60` }}>
                          {hasCakeItems
                            ? "Pickup required — cakes cannot be shipped"
                            : fulfillmentType === "shipping"
                              ? shippingQuote
                                ? `${shippingQuote.serviceName}: $${shippingQuote.price.toFixed(2)} AUD${shippingQuote.estimatedDays ? ` (${shippingQuote.estimatedDays} business days)` : ""}`
                                : `Estimated from $${DEFAULT_SHIPPING_FEE_AUD.toFixed(2)} AUD — enter postcode for exact rate`
                              : "Free — collect from our store"}
                        </p>
                      </div>

                      {/* Order Summary */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}99` }}>Subtotal</span>
                          <span className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: brown }}>
                            ${cartSubtotal.toFixed(2)}
                          </span>
                        </div>
                        {fulfillmentType === "shipping" && (
                          <div className="flex justify-between">
                            <span className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}99` }}>
                              Shipping
                              {isCalculatingShipping && <Loader2 size={10} className="inline ml-1 animate-spin" />}
                            </span>
                            <span className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: brown }}>
                              ${shippingFee.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t" style={{ borderColor }}>
                          <span className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: brown }}>Total</span>
                          <span className="text-sm" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: brown }}>
                            ${cartTotal.toFixed(2)} AUD
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setCheckoutStep("details")}
                        className="w-full py-3 text-[11px] uppercase cursor-pointer transition-opacity hover:opacity-80"
                        style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em", backgroundColor: brown, color: cream }}
                      >
                        Proceed to Checkout
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* === STEP: DETAILS (customer info + shipping/pickup) === */}
              {checkoutStep === "details" && (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <h3 className="text-base mb-1" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: brown }}>
                      Your Details
                    </h3>

                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={checkoutForm.name}
                      onChange={(e) => setCheckoutForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 text-sm border outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      placeholder="Email Address *"
                      value={checkoutForm.email}
                      onChange={(e) => setCheckoutForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-4 py-3 text-sm border outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-4 py-3 text-sm border outline-none"
                      style={inputStyle}
                    />

                    {/* === SHIPPING FIELDS === */}
                    {fulfillmentType === "shipping" && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Truck size={14} style={{ color: midBrown }} />
                          <p className="text-[10px] uppercase" style={labelStyle}>Shipping Details</p>
                        </div>

                        <textarea
                          placeholder="Shipping Address *"
                          value={checkoutForm.shippingAddress}
                          onChange={(e) => setCheckoutForm((f) => ({ ...f, shippingAddress: e.target.value }))}
                          rows={2}
                          className="w-full px-4 py-3 text-sm border outline-none resize-none"
                          style={inputStyle}
                        />

                        <div>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Postcode *"
                              value={postcodeInput}
                              onChange={(e) => handlePostcodeChange(e.target.value)}
                              maxLength={4}
                              className="w-full px-4 py-3 text-sm border outline-none pr-10"
                              style={inputStyle}
                            />
                            {isCalculatingShipping && (
                              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin" style={{ color: midBrown }} />
                            )}
                          </div>
                          {shippingQuote && (
                            <div className="mt-2 p-3 rounded" style={{ backgroundColor: `${cream}`, border: `1px solid ${borderColor}` }}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: brown }}>
                                    {shippingQuote.serviceName}
                                  </p>
                                  {shippingQuote.estimatedDays && (
                                    <p className="text-[10px] mt-0.5" style={{ fontFamily: "var(--font-body)", color: `${brown}70` }}>
                                      Est. {shippingQuote.estimatedDays} business days
                                    </p>
                                  )}
                                </div>
                                <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: brown }}>
                                  ${shippingQuote.price.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          )}
                          {!shippingQuote && postcodeInput.length < 4 && (
                            <p className="text-[10px] mt-1" style={{ fontFamily: "var(--font-body)", color: `${brown}60` }}>
                              Enter your 4-digit postcode for an accurate shipping quote
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* === PICKUP FIELDS === */}
                    {fulfillmentType === "pickup" && (
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin size={14} style={{ color: midBrown }} />
                          <p className="text-[10px] uppercase" style={labelStyle}>Pickup Location *</p>
                        </div>

                        {branchesData && branchesData.length > 0 ? (
                          <div className="space-y-2">
                            {branchesData.map((branch: any) => (
                              <button
                                key={branch.id}
                                onClick={() => {
                                  setCheckoutForm((f) => ({ ...f, pickupBranchId: branch.id, pickupDate: "", pickupTime: "" }));
                                }}
                                className="w-full text-left p-3 border cursor-pointer transition-all"
                                style={{
                                  fontFamily: "var(--font-body)",
                                  borderColor: checkoutForm.pickupBranchId === branch.id ? brown : borderColor,
                                  backgroundColor: checkoutForm.pickupBranchId === branch.id ? `${brown}08` : "transparent",
                                }}
                              >
                                <p className="text-sm" style={{ fontWeight: 500, color: brown }}>{branch.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: `${brown}70` }}>{branch.address}</p>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs p-3 border" style={{ fontFamily: "var(--font-body)", borderColor, color: `${brown}60` }}>
                            No pickup locations available. Please contact us.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Details Footer */}
                  <div className="p-6 border-t" style={{ borderColor }}>
                    {/* Gift Card Input */}
                    <div className="mb-4">
                      {!giftCardApplied ? (
                        <div>
                          <label className="text-[10px] uppercase tracking-[0.08em] mb-1.5 block" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: `${brown}80` }}>
                            <Gift className="w-3 h-3 inline mr-1" />Gift Card Code
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="QSB-XXXX-XXXX-XXXX"
                              value={giftCardCode}
                              onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                              className="flex-1 px-3 py-2 rounded border text-xs font-mono tracking-wider"
                              style={{ ...inputStyle, fontSize: "11px" }}
                            />
                            <button
                              onClick={handleApplyGiftCard}
                              disabled={isCheckingGiftCard || !giftCardCode.trim()}
                              className="px-3 py-2 rounded text-[10px] uppercase tracking-wider transition-opacity hover:opacity-80 disabled:opacity-40"
                              style={{ fontFamily: "var(--font-body)", fontWeight: 500, backgroundColor: brown, color: cream }}
                            >
                              {isCheckingGiftCard ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-2.5 rounded" style={{ backgroundColor: `${brown}08`, border: `1px solid ${borderColor}` }}>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5" style={{ color: "#2E7D32" }} />
                            <div>
                              <p className="text-[10px] font-mono" style={{ color: brown }}>{giftCardApplied.code}</p>
                              <p className="text-[9px]" style={{ color: `${brown}80` }}>Balance: ${giftCardApplied.balance.toFixed(2)}</p>
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveGiftCard}
                            className="text-[10px] underline cursor-pointer"
                            style={{ fontFamily: "var(--font-body)", color: `${brown}80` }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between">
                        <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: `${brown}80` }}>Subtotal</span>
                        <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: brown }}>${cartSubtotal.toFixed(2)}</span>
                      </div>
                      {fulfillmentType === "shipping" && (
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: `${brown}80` }}>Shipping</span>
                          <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: brown }}>${shippingFee.toFixed(2)}</span>
                        </div>
                      )}
                      {giftCardDiscount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#2E7D32" }}>Gift Card Discount</span>
                          <span className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#2E7D32" }}>-${giftCardDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t" style={{ borderColor }}>
                        <span className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: brown }}>Total</span>
                        <span className="text-sm" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: brown }}>
                          ${cartTotal.toFixed(2)} AUD
                        </span>
                      </div>
                    </div>

                    {hasCakeItems && checkoutForm.pickupBranchId > 0 ? (
                      <button
                        onClick={() => setCheckoutStep("pickup")}
                        className="w-full py-3 text-[11px] uppercase cursor-pointer transition-opacity hover:opacity-80"
                        style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em", backgroundColor: brown, color: cream }}
                      >
                        Select Pickup Date & Time
                      </button>
                    ) : (
                      <button
                        onClick={handleCheckout}
                        disabled={isProcessing || !canProceedToPayment}
                        className="w-full py-3 text-[11px] uppercase cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em", backgroundColor: brown, color: cream }}
                      >
                        {isProcessing ? "Processing..." : "Pay with Stripe"}
                      </button>
                    )}
                    <button
                      onClick={() => setCheckoutStep("cart")}
                      className="w-full py-2 text-[10px] uppercase tracking-[0.15em] cursor-pointer mt-1"
                      style={{ fontFamily: "var(--font-body)", color: `${brown}80` }}
                    >
                      Back to Bag
                    </button>
                  </div>
                </>
              )}

              {/* === STEP: PICKUP DATE/TIME (for cake orders) === */}
              {checkoutStep === "pickup" && (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <h3 className="text-base mb-1" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: brown }}>
                      Cake Pickup Booking
                    </h3>
                    <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: `${brown}80` }}>
                      Pickup from: <strong style={{ color: brown }}>{(selectedBranch as any)?.name || "Selected branch"}</strong>
                    </p>

                    {/* Date Selection */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar size={14} style={{ color: midBrown }} />
                        <p className="text-[10px] uppercase" style={labelStyle}>Select Pickup Date *</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {availableDates.map((d) => (
                          <button
                            key={d.value}
                            onClick={() => setCheckoutForm((f) => ({ ...f, pickupDate: d.value, pickupTime: "" }))}
                            className="text-left p-2.5 border cursor-pointer transition-all text-xs"
                            style={{
                              fontFamily: "var(--font-body)", fontWeight: 400,
                              borderColor: checkoutForm.pickupDate === d.value ? brown : borderColor,
                              backgroundColor: checkoutForm.pickupDate === d.value ? `${brown}08` : "transparent",
                              color: checkoutForm.pickupDate === d.value ? brown : `${brown}99`,
                            }}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Time Slot Selection */}
                    {checkoutForm.pickupDate && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Clock size={14} style={{ color: midBrown }} />
                          <p className="text-[10px] uppercase" style={labelStyle}>Select Pickup Time *</p>
                        </div>

                        {slotsQuery.isLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 size={16} className="animate-spin" style={{ color: midBrown }} />
                            <span className="ml-2 text-xs" style={{ fontFamily: "var(--font-body)", color: `${brown}80` }}>
                              Checking availability...
                            </span>
                          </div>
                        ) : availableSlots.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {availableSlots.map((slot: any) => (
                              <button
                                key={slot.time}
                                onClick={() => setCheckoutForm((f) => ({ ...f, pickupTime: slot.time }))}
                                className="p-2.5 border cursor-pointer transition-all text-xs text-center"
                                style={{
                                  fontFamily: "var(--font-body)", fontWeight: 400,
                                  borderColor: checkoutForm.pickupTime === slot.time ? brown : borderColor,
                                  backgroundColor: checkoutForm.pickupTime === slot.time ? `${brown}08` : "transparent",
                                  color: checkoutForm.pickupTime === slot.time ? brown : `${brown}99`,
                                }}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 text-center rounded" style={{ backgroundColor: `${accent}0A`, border: `1px solid ${accent}26` }}>
                            <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: accent }}>
                              No available time slots for this date. Please select another date.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Booking Summary */}
                    {checkoutForm.pickupDate && checkoutForm.pickupTime && (
                      <div className="p-4 rounded" style={{ backgroundColor: cream, border: `1px solid ${borderColor}` }}>
                        <p className="text-[10px] uppercase mb-2" style={labelStyle}>Pickup Booking Summary</p>
                        <div className="space-y-1">
                          <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: brown }}>
                            <strong>Location:</strong> {(selectedBranch as any)?.name}
                          </p>
                          <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: brown }}>
                            <strong>Date:</strong> {new Date(checkoutForm.pickupDate + "T12:00:00").toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          </p>
                          <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: brown }}>
                            <strong>Time:</strong> {checkoutForm.pickupTime}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pickup Footer */}
                  <div className="p-6 border-t" style={{ borderColor }}>
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between pt-1">
                        <span className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: brown }}>Total</span>
                        <span className="text-sm" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: brown }}>
                          ${cartTotal.toFixed(2)} AUD
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckout}
                      disabled={isProcessing || !canProceedToPayment}
                      className="w-full py-3 text-[11px] uppercase cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
                      style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em", backgroundColor: brown, color: cream }}
                    >
                      {isProcessing ? "Processing..." : "Pay with Stripe"}
                    </button>
                    <button
                      onClick={() => setCheckoutStep("details")}
                      className="w-full py-2 text-[10px] uppercase tracking-[0.15em] cursor-pointer mt-1"
                      style={{ fontFamily: "var(--font-body)", color: `${brown}80` }}
                    >
                      Back to Details
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Introduction */}
      <section className="py-20 md:py-28 px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <div className="editorial-rule mx-auto mb-8" />
            <p
              className="text-base md:text-lg"
              style={{ fontFamily: "var(--font-body)", fontWeight: 400, lineHeight: 1.7, color: `${brown}CC` }}
            >
              A carefully curated selection of objects that extend the Queen St BB
              experience into your home. Each piece chosen for its craft,
              materiality, and quiet beauty.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter Tabs */}
      <section className="px-6 md:px-10 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-4 py-2 rounded-full text-[10px] uppercase tracking-[0.12em] transition-all duration-300 cursor-pointer"
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  backgroundColor: activeCategory === cat ? brown : "transparent",
                  color: activeCategory === cat ? cream : `${brown}80`,
                  border: `1px solid ${activeCategory === cat ? brown : borderColor}`,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          {filteredDisplayData.map((category, ci) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: ci * 0.1 }}
              className="mb-16 md:mb-20 last:mb-0"
            >
              <div className="flex items-center gap-4 mb-10">
                <span
                  className="text-[10px] font-medium uppercase"
                  style={{ fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.04em", color: `${midBrown}80` }}
                >
                  {category.category}
                </span>
                <div className="flex-1 h-[1px]" style={{ backgroundColor: borderColor }} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                {category.items.map((item, ii) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: ii * 0.08 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedProduct(item)}
                  >
                    <div className="aspect-[4/5] mb-4 overflow-hidden relative rounded-sm" style={{ backgroundColor: cream }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", fontWeight: 400, letterSpacing: "0.04em", color: "oklch(0.72 0.03 65)" }}>
                            {category.category}
                          </span>
                        </div>
                      )}
                      {isPickupOnlyType(item.productType) && (
                        <div className="absolute top-3 left-3 px-2 py-1 text-[9px] uppercase" style={{
                          fontFamily: "var(--font-body)", fontWeight: 500, letterSpacing: "0.05em",
                          backgroundColor: "oklch(0.55 0.12 35 / 0.9)", color: "#fff",
                        }}>
                          Pickup Only
                        </div>
                      )}
                      <button
                        onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl, productType: item.productType })}
                        className="absolute bottom-0 left-0 right-0 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                        style={{ fontFamily: "var(--font-body)", backgroundColor: "oklch(0.34 0.05 45 / 0.9)", color: cream }}
                      >
                        Add to Bag
                      </button>
                    </div>
                    <h3 className="text-sm md:text-base mb-0.5 group-hover:opacity-60 transition-opacity duration-400" style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.005em", color: brown }}>
                      {item.name}
                    </h3>
                    <p className="text-[10px] md:text-[11px] mb-1.5 line-clamp-1" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}73` }}>
                      {item.detail}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs md:text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: midBrown }}>
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedProduct(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[201] md:w-[90vw] md:max-w-3xl md:max-h-[85vh] overflow-y-auto rounded-lg shadow-2xl"
              style={{ backgroundColor: parchment }}
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer"
                style={{ backgroundColor: `${brown}10` }}
              >
                <X size={16} style={{ color: brown }} />
              </button>
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="aspect-square md:aspect-[4/5] w-full overflow-hidden rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                    {selectedProduct.imageUrl ? (
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: cream }}>
                        <span className="text-sm" style={{ color: `${brown}50` }}>No image</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
                  <div>
                    <h2
                      className="text-xl md:text-2xl mb-2"
                      style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: brown }}
                    >
                      {selectedProduct.name}
                    </h2>
                    <p
                      className="text-lg mb-4"
                      style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: midBrown }}
                    >
                      ${selectedProduct.price.toFixed(2)}
                    </p>
                    <div className="h-[1px] mb-4" style={{ backgroundColor: borderColor }} />
                    <p
                      className="text-sm leading-relaxed"
                      style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: `${brown}CC`, lineHeight: 1.7 }}
                    >
                      {selectedProduct.description || selectedProduct.detail || "A beautifully crafted piece from our Queen St BB collection."}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart({ id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, imageUrl: selectedProduct.imageUrl, productType: selectedProduct.productType });
                      setSelectedProduct(null);
                    }}
                    className="mt-6 w-full py-3.5 text-[10px] font-medium uppercase tracking-[0.2em] text-center cursor-pointer rounded-sm transition-opacity hover:opacity-90"
                    style={{ fontFamily: "var(--font-body)", backgroundColor: brown, color: cream }}
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quote */}
      <section className="py-20 md:py-28 px-6 md:px-10" style={{ backgroundColor: cream }}>
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <p className="text-xl md:text-2xl italic" style={{ fontFamily: "var(--font-display)", fontWeight: 500, lineHeight: 1.5, color: brown }}>
              "The objects we choose shape the rituals we keep."
            </p>
            <div className="editorial-rule mx-auto mt-8" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
