/**
 * Objects — Minimal shop layout with live product data + Stripe checkout
 * Palette: brand-brown, parchment, cocoa, linen
 * Clean, premium presentation — focus on product and spacing
 */
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import PageLayout from "@/components/PageLayout";
import { toast } from "sonner";
import { X, ShoppingBag, Plus, Minus } from "lucide-react";
import { usePageImage } from "@/hooks/usePageImage";

const DEFAULT_HERO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663564421247/kKmGie8G5N5Yj6wNmxZVBs/hero-objects-aKrCAfQFaFKVp7bwFWiYN7.webp";

// Cart item type
type CartItem = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  imageUrl?: string;
};

// Fallback static data when no products in DB
const fallbackObjects = [
  {
    category: "Ceramics",
    items: [
      { id: 901, name: "Atelier Espresso Cup", detail: "Hand-thrown stoneware, ivory glaze", price: 48, imageUrl: "" },
      { id: 902, name: "Dessert Plate — Terracotta", detail: "Artisan ceramic, matte finish", price: 62, imageUrl: "" },
      { id: 903, name: "Serving Bowl — Marble", detail: "Carrara marble, hand-polished", price: 185, imageUrl: "" },
    ],
  },
  {
    category: "Textiles",
    items: [
      { id: 904, name: "Linen Napkin Set", detail: "Belgian linen, natural dye", price: 38, imageUrl: "" },
      { id: 905, name: "Apron — Atelier Edition", detail: "Washed cotton, brass hardware", price: 95, imageUrl: "" },
    ],
  },
  {
    category: "Confections",
    items: [
      { id: 906, name: "Chocolate Collection", detail: "Single-origin, hand-tempered", price: 42, imageUrl: "" },
      { id: 907, name: "Biscotti Gift Box", detail: "Almond & pistachio, wrapped in tissue", price: 36, imageUrl: "" },
      { id: 908, name: "House Blend Coffee", detail: "Medium roast, caramel & hazelnut notes", price: 28, imageUrl: "" },
    ],
  },
];

const fade = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

export default function Objects() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: liveProducts } = trpc.publicProducts.list.useQuery({
    productType: "merchandise",
    limit: 100,
  });
  const { data: liveCategories } = trpc.publicProducts.categories.useQuery();
  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation();

  // Group live products by category, or fall back to static data
  const displayData = useMemo(() => {
    if (!liveProducts || liveProducts.length === 0) return fallbackObjects;

    const categoryMap = new Map<number, string>();
    if (liveCategories) {
      for (const c of liveCategories) {
        categoryMap.set(c.id, c.name);
      }
    }

    const grouped: Record<string, { id: number; name: string; detail: string; price: number; imageUrl: string }[]> = {};
    for (const p of liveProducts) {
      const catName = p.categoryId ? categoryMap.get(p.categoryId) || "Other" : "Other";
      if (!grouped[catName]) grouped[catName] = [];
      grouped[catName].push({
        id: p.id,
        name: p.name,
        detail: p.shortDescription || "",
        price: Number(p.price),
        imageUrl: p.imageUrl || "",
      });
    }

    return Object.entries(grouped).map(([category, items]) => ({ category, items }));
  }, [liveProducts, liveCategories]);

  const addToCart = useCallback((item: { id: number; name: string; price: number; imageUrl?: string }) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.productId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          productId: item.id,
          productName: item.name,
          price: item.price,
          quantity: 1,
          imageUrl: item.imageUrl || undefined,
        },
      ];
    });
    toast.success(`${item.name} added to bag`);
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.productId === productId ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  }, []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity, 0),
    [cart]
  );

  const handleCheckout = async () => {
    if (!checkoutForm.name || !checkoutForm.email) {
      toast.error("Please enter your name and email");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await checkoutMutation.mutateAsync({
        items: cart,
        customerName: checkoutForm.name,
        customerEmail: checkoutForm.email,
        customerPhone: checkoutForm.phone || undefined,
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
          onClick={() => { setCartOpen(true); setCheckoutOpen(false); }}
          className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg cursor-pointer"
          style={{ backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.91 0.02 75)" }}
        >
          <ShoppingBag size={20} />
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center"
            style={{ backgroundColor: "oklch(0.55 0.12 35)", color: "#fff" }}>
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
              style={{ backgroundColor: "oklch(0.95 0.01 75)" }}
            >
              {/* Cart Header */}
              <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "oklch(0.84 0.025 72 / 0.4)" }}>
                <h2 className="text-lg font-light" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
                  Your Bag ({cartCount})
                </h2>
                <button onClick={() => setCartOpen(false)} className="p-1 cursor-pointer" style={{ color: "oklch(0.34 0.05 45 / 0.6)" }}>
                  <X size={20} />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <p className="text-center text-sm font-light py-12" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.5)" }}>
                    Your bag is empty
                  </p>
                ) : (
                  cart.map((item) => (
                    <div key={item.productId} className="flex gap-4">
                      <div className="w-16 h-20 flex-shrink-0 overflow-hidden" style={{ backgroundColor: "oklch(0.91 0.02 75)" }}>
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingBag size={14} style={{ color: "oklch(0.72 0.03 65)" }} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-light mb-1" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
                          {item.productName}
                        </h3>
                        <p className="text-xs mb-2" style={{ fontFamily: "var(--font-body)", color: "oklch(0.45 0.06 45)" }}>
                          ${item.price.toFixed(0)}
                        </p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center border cursor-pointer" style={{ borderColor: "oklch(0.84 0.025 72 / 0.6)", color: "oklch(0.34 0.05 45 / 0.6)" }}>
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-light" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                            {item.quantity}
                          </span>
                          <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center border cursor-pointer" style={{ borderColor: "oklch(0.84 0.025 72 / 0.6)", color: "oklch(0.34 0.05 45 / 0.6)" }}>
                            <Plus size={12} />
                          </button>
                          <button onClick={() => removeFromCart(item.productId)} className="ml-auto text-[10px] uppercase cursor-pointer" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.4)" }}>
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-6 border-t" style={{ borderColor: "oklch(0.84 0.025 72 / 0.4)" }}>
                  {!checkoutOpen ? (
                    <>
                      <div className="flex justify-between mb-4">
                        <span className="text-sm font-light" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.6)" }}>Total</span>
                        <span className="text-sm font-light" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
                          ${cartTotal.toFixed(2)} AUD
                        </span>
                      </div>
                      <button
                        onClick={() => setCheckoutOpen(true)}
                        className="w-full py-3 text-[11px] font-medium uppercase tracking-[0.2em] cursor-pointer transition-opacity hover:opacity-80"
                        style={{ fontFamily: "var(--font-body)", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.91 0.02 75)" }}
                      >
                        Proceed to Checkout
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full px-4 py-3 text-sm font-light border outline-none"
                        style={{
                          fontFamily: "var(--font-body)",
                          borderColor: "oklch(0.84 0.025 72 / 0.6)",
                          backgroundColor: "transparent",
                          color: "oklch(0.34 0.05 45)",
                        }}
                      />
                      <input
                        type="email"
                        placeholder="Email Address *"
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full px-4 py-3 text-sm font-light border outline-none"
                        style={{
                          fontFamily: "var(--font-body)",
                          borderColor: "oklch(0.84 0.025 72 / 0.6)",
                          backgroundColor: "transparent",
                          color: "oklch(0.34 0.05 45)",
                        }}
                      />
                      <input
                        type="tel"
                        placeholder="Phone (optional)"
                        value={checkoutForm.phone}
                        onChange={(e) => setCheckoutForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full px-4 py-3 text-sm font-light border outline-none"
                        style={{
                          fontFamily: "var(--font-body)",
                          borderColor: "oklch(0.84 0.025 72 / 0.6)",
                          backgroundColor: "transparent",
                          color: "oklch(0.34 0.05 45)",
                        }}
                      />
                      <div className="flex justify-between mb-2 pt-2">
                        <span className="text-sm font-light" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.6)" }}>Total</span>
                        <span className="text-sm font-light" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
                          ${cartTotal.toFixed(2)} AUD
                        </span>
                      </div>
                      <button
                        onClick={handleCheckout}
                        disabled={isProcessing}
                        className="w-full py-3 text-[11px] font-medium uppercase tracking-[0.2em] cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{ fontFamily: "var(--font-body)", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.91 0.02 75)" }}
                      >
                        {isProcessing ? "Processing..." : "Pay with Stripe"}
                      </button>
                      <button
                        onClick={() => setCheckoutOpen(false)}
                        className="w-full py-2 text-[10px] uppercase tracking-[0.15em] cursor-pointer"
                        style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.5)" }}
                      >
                        Back to Bag
                      </button>
                    </div>
                  )}
                </div>
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
              className="text-lg md:text-xl font-light leading-[1.8]"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45 / 0.8)" }}
            >
              A carefully curated selection of objects that extend the Queen St BB
              experience into your home. Each piece chosen for its craft,
              materiality, and quiet beauty.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Product Grid — minimal shop layout */}
      <section className="pb-20 md:pb-28 px-6 md:px-10">
        <div className="max-w-5xl mx-auto">
          {displayData.map((category, ci) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: ci * 0.1 }}
              className="mb-16 md:mb-20 last:mb-0"
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 mb-10">
                <span
                  className="text-[10px] font-medium uppercase"
                  style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em", color: "oklch(0.45 0.06 45 / 0.5)" }}
                >
                  {category.category}
                </span>
                <div className="flex-1 h-[1px]" style={{ backgroundColor: "oklch(0.84 0.025 72 / 0.4)" }} />
              </div>

              {/* Items — clean grid with generous spacing */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
                {category.items.map((item, ii) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: ii * 0.08 }}
                    className="group"
                  >
                    {/* Product image or placeholder */}
                    <div
                      className="aspect-[4/5] mb-5 overflow-hidden relative"
                      style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span
                            className="text-[10px] font-light uppercase"
                            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.72 0.03 65)" }}
                          >
                            {category.category}
                          </span>
                        </div>
                      )}
                      {/* Add to bag overlay */}
                      <button
                        onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, imageUrl: item.imageUrl })}
                        className="absolute bottom-0 left-0 right-0 py-3 text-[10px] font-medium uppercase tracking-[0.2em] text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                        style={{
                          fontFamily: "var(--font-body)",
                          backgroundColor: "oklch(0.34 0.05 45 / 0.9)",
                          color: "oklch(0.91 0.02 75)",
                        }}
                      >
                        Add to Bag
                      </button>
                    </div>
                    <h3
                      className="text-base md:text-lg font-light mb-1 group-hover:opacity-60 transition-opacity duration-400"
                      style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}
                    >
                      {item.name}
                    </h3>
                    <p
                      className="text-[11px] font-light mb-2"
                      style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45 / 0.45)" }}
                    >
                      {item.detail}
                    </p>
                    <span
                      className="text-sm font-light"
                      style={{ fontFamily: "var(--font-body)", color: "oklch(0.45 0.06 45)" }}
                    >
                      ${item.price.toFixed(0)}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Quote */}
      <section
        className="py-20 md:py-28 px-6 md:px-10"
        style={{ backgroundColor: "oklch(0.91 0.02 75)" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div {...fade}>
            <p
              className="text-xl md:text-2xl font-light italic leading-[1.7]"
              style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}
            >
              "The objects we choose shape the rituals we keep."
            </p>
            <div className="editorial-rule mx-auto mt-8" />
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
}
