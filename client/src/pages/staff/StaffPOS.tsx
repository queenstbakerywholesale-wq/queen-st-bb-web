/**
 * Staff POS — Tablet/PC optimized point-of-sale interface
 * Features: item selection, weight input, custom price, cash payment, receipt
 */
import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CartItem {
  menuItemId?: number;
  itemName: string;
  quantity: number;
  weightGrams?: number;
  unitPrice: number;
  totalPrice: number;
  priceType: "fixed" | "weight" | "custom";
}

interface ReceiptData {
  orderNumber: string;
  total: string;
  items: CartItem[];
  paymentMethod: string;
  cashReceived?: string;
  changeGiven?: string;
  staffName: string;
  timestamp: Date;
}

export default function StaffPOS() {
  const [staffData, setStaffData] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [weightInput, setWeightInput] = useState<{ itemId: number; name: string; unitPrice: number } | null>(null);
  const [customPriceInput, setCustomPriceInput] = useState<{ itemId: number; name: string } | null>(null);
  const [weightValue, setWeightValue] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auth check
  const { data: authData, isLoading: authLoading } = trpc.staffAuth.verify.useQuery();
  const loginMutation = trpc.staffAuth.login.useMutation({
    onSuccess: (data) => { setStaffData(data.staff); toast.success(`Welcome, ${data.staff.displayName}`); },
    onError: (e) => toast.error(e.message),
  });
  const logoutMutation = trpc.staffAuth.logout.useMutation({
    onSuccess: () => { setStaffData(null); window.location.reload(); },
  });

  useEffect(() => {
    if (authData?.authenticated && authData.staff) {
      setStaffData(authData.staff);
    }
  }, [authData]);

  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"pos" | "orders">("pos");

  const branchId = staffData?.branchId;

  const { data: categories = [] } = trpc.pos.listCategories.useQuery(
    { branchId: branchId! },
    { enabled: !!branchId }
  );
  const { data: menuItems = [] } = trpc.pos.listMenuItems.useQuery(
    { branchId: branchId! },
    { enabled: !!branchId }
  );

  const createOrderMutation = trpc.pos.createOrder.useMutation({
    onSuccess: (data) => {
      setReceipt({
        orderNumber: data.orderNumber,
        total: data.total,
        items: [...cart],
        paymentMethod: showPayment ? "cash" : "card",
        cashReceived: cashReceived || undefined,
        changeGiven: change > 0 ? change.toFixed(2) : undefined,
        staffName: staffData?.displayName || "",
        timestamp: new Date(),
      });
      setCart([]);
      setShowPayment(false);
      setCashReceived("");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const adjustQuantity = (index: number, delta: number) => {
    setCart((prev) => {
      const item = prev[index];
      if (!item || item.priceType !== "fixed") return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== index);
      return prev.map((c, i) => i === index ? { ...c, quantity: newQty, totalPrice: newQty * c.unitPrice } : c);
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const change = cashReceived ? parseFloat(cashReceived) - cartTotal : 0;

  const addToCart = useCallback((item: any) => {
    if (item.priceType === "weight") {
      setWeightInput({ itemId: item.id, name: item.name, unitPrice: parseFloat(item.unitPrice) });
      setWeightValue("");
      return;
    }
    if (item.priceType === "custom") {
      setCustomPriceInput({ itemId: item.id, name: item.name });
      setCustomPrice("");
      return;
    }
    // Fixed price — add or increment
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id && c.priceType === "fixed");
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id && c.priceType === "fixed"
            ? { ...c, quantity: c.quantity + 1, totalPrice: (c.quantity + 1) * c.unitPrice }
            : c
        );
      }
      return [...prev, {
        menuItemId: item.id,
        itemName: item.name,
        quantity: 1,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.unitPrice),
        priceType: "fixed" as const,
      }];
    });
  }, []);

  const confirmWeight = () => {
    if (!weightInput || !weightValue) return;
    const grams = parseFloat(weightValue);
    const total = (grams / 100) * weightInput.unitPrice;
    setCart((prev) => [...prev, {
      menuItemId: weightInput.itemId,
      itemName: weightInput.name,
      quantity: 1,
      weightGrams: grams,
      unitPrice: weightInput.unitPrice,
      totalPrice: total,
      priceType: "weight" as const,
    }]);
    setWeightInput(null);
  };

  const confirmCustomPrice = () => {
    if (!customPriceInput || !customPrice) return;
    const price = parseFloat(customPrice);
    setCart((prev) => [...prev, {
      menuItemId: customPriceInput.itemId,
      itemName: customPriceInput.name,
      quantity: 1,
      unitPrice: price,
      totalPrice: price,
      priceType: "custom" as const,
    }]);
    setCustomPriceInput(null);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const processPayment = (method: "cash" | "card") => {
    if (cart.length === 0) return;
    if (method === "card") {
      toast.info("Card payment coming soon — use external terminal and record as cash for now");
      return;
    }
    createOrderMutation.mutate({
      branchId: branchId!,
      staffId: staffData.id,
      items: cart.map((item) => ({
        menuItemId: item.menuItemId,
        itemName: item.itemName,
        quantity: item.quantity,
        weightGrams: item.weightGrams,
        unitPrice: item.unitPrice.toFixed(2),
        totalPrice: item.totalPrice.toFixed(2),
      })),
      paymentMethod: method,
      cashReceived: method === "cash" ? cashReceived || cartTotal.toFixed(2) : undefined,
      changeGiven: method === "cash" && change > 0 ? change.toFixed(2) : undefined,
    });
  };

  // ─── Login Screen ─────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "oklch(0.34 0.05 45)" }}>
        <p className="text-sm animate-pulse" style={{ color: "oklch(0.94 0.015 80)" }}>Loading...</p>
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: "oklch(0.34 0.05 45)" }}>
        <div className="w-full max-w-sm p-8 space-y-6" style={{ backgroundColor: "oklch(0.94 0.015 80)" }}>
          <div className="text-center">
            <h1 className="text-xl font-medium" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
              Queen St BB
            </h1>
            <p className="text-[10px] uppercase mt-1" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
              Staff POS Login
            </p>
          </div>
          <div className="space-y-3">
            <input
              className="w-full p-3 text-sm"
              style={{ fontFamily: "var(--font-body)", border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate(loginForm)}
            />
            <input
              className="w-full p-3 text-sm"
              style={{ fontFamily: "var(--font-body)", border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate(loginForm)}
            />
            <button
              onClick={() => loginMutation.mutate(loginForm)}
              disabled={loginMutation.isPending}
              className="w-full py-3 text-xs uppercase transition-all hover:opacity-80 disabled:opacity-40"
              style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
            >
              {loginMutation.isPending ? "..." : "Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }


  const filteredItems = selectedCategory
    ? menuItems.filter((item: any) => item.categoryId === selectedCategory)
    : menuItems;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "oklch(0.96 0.008 80)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: "oklch(0.34 0.05 45)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab("pos")}
            className="text-sm font-medium px-2 py-0.5"
            style={{ fontFamily: "var(--font-display)", color: activeTab === "pos" ? "oklch(0.94 0.015 80)" : "oklch(0.94 0.015 80 / 0.4)", borderBottom: activeTab === "pos" ? "2px solid oklch(0.94 0.015 80)" : "2px solid transparent" }}
          >
            POS
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className="text-sm font-medium px-2 py-0.5"
            style={{ fontFamily: "var(--font-display)", color: activeTab === "orders" ? "oklch(0.94 0.015 80)" : "oklch(0.94 0.015 80 / 0.4)", borderBottom: activeTab === "orders" ? "2px solid oklch(0.94 0.015 80)" : "2px solid transparent" }}
          >
            Online Orders
          </button>
          <span className="text-[10px] uppercase ml-2" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.94 0.015 80 / 0.6)" }}>
            {staffData.displayName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="text-[10px] uppercase px-3 py-1"
            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.94 0.015 80 / 0.6)", border: "1px solid oklch(0.94 0.015 80 / 0.3)" }}
          >
            {isFullscreen ? "Exit FS" : "Fullscreen"}
          </button>
          <button
            onClick={() => logoutMutation.mutate()}
            className="text-[10px] uppercase px-3 py-1"
            style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.94 0.015 80 / 0.6)", border: "1px solid oklch(0.94 0.015 80 / 0.3)" }}
          >
            Logout
          </button>
        </div>
      </div>

      {activeTab === "orders" ? (
        <StaffOnlineOrders branchId={branchId} />
      ) : (
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Menu Items */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Category Tabs */}
          <div className="flex gap-1 p-2 overflow-x-auto flex-shrink-0" style={{ borderBottom: "1px solid oklch(0.84 0.025 72 / 0.3)" }}>
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3 py-1.5 text-[10px] uppercase whitespace-nowrap transition-all"
              style={{
                fontFamily: "var(--font-body)",
                letterSpacing: "0.1em",
                backgroundColor: !selectedCategory ? "oklch(0.34 0.05 45)" : "transparent",
                color: !selectedCategory ? "oklch(0.94 0.015 80)" : "oklch(0.34 0.05 45 / 0.6)",
                border: "1px solid oklch(0.34 0.05 45 / 0.3)",
              }}
            >
              All
            </button>
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="px-3 py-1.5 text-[10px] uppercase whitespace-nowrap transition-all"
                style={{
                  fontFamily: "var(--font-body)",
                  letterSpacing: "0.1em",
                  backgroundColor: selectedCategory === cat.id ? (cat.color || "oklch(0.34 0.05 45)") : "transparent",
                  color: selectedCategory === cat.id ? "white" : "oklch(0.34 0.05 45 / 0.6)",
                  border: `1px solid ${cat.color || "oklch(0.34 0.05 45 / 0.3)"}`,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {filteredItems.map((item: any) => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="p-3 text-left transition-all hover:scale-[1.02] active:scale-95"
                  style={{
                    backgroundColor: "oklch(0.94 0.015 80)",
                    border: "1px solid oklch(0.84 0.025 72 / 0.5)",
                  }}
                >
                  <p className="text-sm font-medium truncate" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                    {item.name}
                  </p>
                  <p className="text-[10px] uppercase mt-1" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
                    {item.priceType === "weight" ? `$${item.unitPrice}/100g` : item.priceType === "custom" ? "Custom" : `$${item.unitPrice}`}
                  </p>
                </button>
              ))}
            </div>
            {filteredItems.length === 0 && (
              <div className="text-center py-12" style={{ color: "oklch(0.34 0.05 45 / 0.3)" }}>
                <p className="text-sm" style={{ fontFamily: "var(--font-body)" }}>No items in this category</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-80 flex flex-col border-l" style={{ borderColor: "oklch(0.84 0.025 72 / 0.5)", backgroundColor: "oklch(0.94 0.015 80)" }}>
          <div className="p-3 flex-shrink-0" style={{ borderBottom: "1px solid oklch(0.84 0.025 72 / 0.3)" }}>
            <p className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
              Current Order ({cart.length} items)
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {cart.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2" style={{ borderBottom: "1px solid oklch(0.84 0.025 72 / 0.2)" }}>
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                    {item.itemName}
                  </p>
                  <p className="text-[9px]" style={{ color: "oklch(0.34 0.05 45 / 0.4)" }}>
                    {item.priceType === "weight" ? `${item.weightGrams}g @ $${item.unitPrice}/100g` : item.priceType === "custom" ? "Custom" : `$${item.unitPrice} ea`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {item.priceType === "fixed" && (
                    <>
                      <button
                        onClick={() => adjustQuantity(i, -1)}
                        className="w-6 h-6 flex items-center justify-center text-xs"
                        style={{ border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
                      >−</button>
                      <span className="w-6 text-center text-xs" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => adjustQuantity(i, 1)}
                        className="w-6 h-6 flex items-center justify-center text-xs"
                        style={{ border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
                      >+</button>
                    </>
                  )}
                  <span className="text-sm font-medium ml-2" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                    ${item.totalPrice.toFixed(2)}
                  </span>
                  <button onClick={() => removeFromCart(i)} className="text-xs ml-1" style={{ color: "oklch(0.5 0.15 25)" }}>×</button>
                </div>
              </div>
            ))}
          </div>

          {/* Total & Payment */}
          <div className="p-3 space-y-3 flex-shrink-0" style={{ borderTop: "2px solid oklch(0.34 0.05 45)" }}>
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>Total</span>
              <span className="text-2xl font-medium" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
                ${cartTotal.toFixed(2)}
              </span>
            </div>

            {showPayment ? (
              <div className="space-y-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Cash received"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-full p-2 text-lg text-center"
                  style={{ fontFamily: "var(--font-body)", border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
                  autoFocus
                />
                {change > 0 && (
                  <p className="text-center text-sm" style={{ color: "oklch(0.45 0.15 145)" }}>
                    Change: ${change.toFixed(2)}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => processPayment("cash")}
                    disabled={createOrderMutation.isPending}
                    className="py-3 text-xs uppercase font-medium disabled:opacity-40"
                    style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.45 0.15 145)", color: "white" }}
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => setShowPayment(false)}
                    className="py-3 text-xs uppercase"
                    style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45 / 0.5)" }}
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowPayment(true)}
                  disabled={cart.length === 0}
                  className="py-3 text-xs uppercase font-medium disabled:opacity-30"
                  style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.45 0.15 145)", color: "white" }}
                >
                  Cash
                </button>
                <button
                  onClick={() => processPayment("card")}
                  disabled={cart.length === 0 || createOrderMutation.isPending}
                  className="py-3 text-xs uppercase font-medium disabled:opacity-30"
                  style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.5 0.15 250)", color: "white" }}
                >
                  Card
                </button>
              </div>
            )}

            {cart.length > 0 && (
              <button
                onClick={() => { setCart([]); setShowPayment(false); setCashReceived(""); }}
                className="w-full py-2 text-[10px] uppercase"
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.5 0.15 25)" }}
              >
                Clear Order
              </button>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Weight Input Modal */}
      {weightInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "oklch(0.34 0.05 45 / 0.6)" }}>
          <div className="p-6 w-full max-w-xs space-y-4" style={{ backgroundColor: "oklch(0.94 0.015 80)" }}>
            <h3 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
              {weightInput.name}
            </h3>
            <p className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
              ${weightInput.unitPrice}/100g — Enter weight in grams
            </p>
            <input
              type="number"
              value={weightValue}
              onChange={(e) => setWeightValue(e.target.value)}
              placeholder="Weight (g)"
              className="w-full p-3 text-lg text-center"
              style={{ fontFamily: "var(--font-body)", border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmWeight()}
            />
            {weightValue && (
              <p className="text-center text-sm" style={{ color: "oklch(0.34 0.05 45)" }}>
                = ${((parseFloat(weightValue) / 100) * weightInput.unitPrice).toFixed(2)}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={confirmWeight} disabled={!weightValue}
                className="flex-1 py-2 text-xs uppercase disabled:opacity-40"
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}>
                Add
              </button>
              <button onClick={() => setWeightInput(null)}
                className="flex-1 py-2 text-xs uppercase"
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "oklch(0.34 0.05 45 / 0.6)" }}>
          <div className="p-6 w-full max-w-sm space-y-4" style={{ backgroundColor: "oklch(0.94 0.015 80)" }}>
            <div className="text-center">
              <p className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em", color: "oklch(0.45 0.15 145)" }}>
                ✔ Order Complete
              </p>
              <h3 className="text-lg font-medium mt-2" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>
                {receipt.orderNumber}
              </h3>
            </div>
            <div className="space-y-1" style={{ borderTop: "1px solid oklch(0.84 0.025 72 / 0.3)", paddingTop: "12px" }}>
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                  <span>{item.itemName} {item.quantity > 1 ? `×${item.quantity}` : ""}{item.weightGrams ? ` (${item.weightGrams}g)` : ""}</span>
                  <span>${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: "2px solid oklch(0.34 0.05 45)" }}>
              <span className="text-sm uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45)" }}>Total</span>
              <span className="text-lg font-medium" style={{ fontFamily: "var(--font-display)", color: "oklch(0.34 0.05 45)" }}>${receipt.total}</span>
            </div>
            {receipt.paymentMethod === "cash" && (
              <div className="text-xs space-y-1" style={{ color: "oklch(0.34 0.05 45 / 0.6)" }}>
                {receipt.cashReceived && <p>Cash received: ${receipt.cashReceived}</p>}
                {receipt.changeGiven && <p>Change: ${receipt.changeGiven}</p>}
              </div>
            )}
            <div className="text-center text-[9px]" style={{ color: "oklch(0.34 0.05 45 / 0.4)" }}>
              <p>{receipt.staffName} • {receipt.timestamp.toLocaleTimeString()}</p>
            </div>
            <button
              onClick={() => setReceipt(null)}
              className="w-full py-3 text-xs uppercase font-medium"
              style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
            >
              New Order
            </button>
          </div>
        </div>
      )}

      {/* Custom Price Modal */}
      {customPriceInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "oklch(0.34 0.05 45 / 0.6)" }}>
          <div className="p-6 w-full max-w-xs space-y-4" style={{ backgroundColor: "oklch(0.94 0.015 80)" }}>
            <h3 className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
              {customPriceInput.name}
            </h3>
            <p className="text-[10px] uppercase" style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}>
              Enter price
            </p>
            <input
              type="number"
              step="0.01"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="$0.00"
              className="w-full p-3 text-lg text-center"
              style={{ fontFamily: "var(--font-body)", border: "1px solid oklch(0.84 0.025 72 / 0.5)", color: "oklch(0.34 0.05 45)" }}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmCustomPrice()}
            />
            <div className="flex gap-2">
              <button onClick={confirmCustomPrice} disabled={!customPrice}
                className="flex-1 py-2 text-xs uppercase disabled:opacity-40"
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}>
                Add
              </button>
              <button onClick={() => setCustomPriceInput(null)}
                className="flex-1 py-2 text-xs uppercase"
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.15em", color: "oklch(0.34 0.05 45 / 0.5)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Staff Online Orders Component ─────────────────────────────────────
function StaffOnlineOrders({ branchId }: { branchId: number }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const { data: onlineOrders = [], refetch } = trpc.pos.staffOnlineOrders.useQuery(
    { branchId, statusFilter: statusFilter as any },
    { refetchInterval: 15000 }
  );

  const { data: orderItemsData = [] } = trpc.pos.staffOrderItems.useQuery(
    { orderId: expandedOrder! },
    { enabled: !!expandedOrder }
  );

  const updateStatusMutation = trpc.pos.staffUpdateOrderStatus.useMutation({
    onSuccess: () => { toast.success("Status updated"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const statusColors: Record<string, string> = {
    pending: "oklch(0.6 0.1 60)",
    paid: "oklch(0.5 0.15 250)",
    preparing: "oklch(0.55 0.15 80)",
    ready: "oklch(0.45 0.15 145)",
    shipped: "oklch(0.5 0.1 200)",
    completed: "oklch(0.5 0.05 45)",
  };

  const nextStatus: Record<string, string> = {
    paid: "preparing",
    preparing: "ready",
    ready: "shipped",
    shipped: "completed",
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* Status Filter */}
      <div className="flex gap-1 flex-wrap">
        {["all", "pending", "paid", "preparing", "ready", "shipped"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className="px-3 py-1 text-[10px] uppercase"
            style={{
              fontFamily: "var(--font-body)",
              letterSpacing: "0.1em",
              backgroundColor: statusFilter === s ? "oklch(0.34 0.05 45)" : "transparent",
              color: statusFilter === s ? "oklch(0.94 0.015 80)" : "oklch(0.34 0.05 45 / 0.6)",
              border: statusFilter === s ? "none" : "1px solid oklch(0.84 0.025 72 / 0.5)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {onlineOrders.length === 0 ? (
        <div className="text-center py-12" style={{ color: "oklch(0.34 0.05 45 / 0.3)" }}>
          <p className="text-sm" style={{ fontFamily: "var(--font-body)" }}>No orders found</p>
        </div>
      ) : (
        onlineOrders.map((order: any) => (
          <div
            key={order.id}
            className="p-4 space-y-2"
            style={{ backgroundColor: "oklch(0.94 0.015 80)", border: "1px solid oklch(0.84 0.025 72 / 0.5)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                  {order.orderNumber}
                </p>
                <p className="text-[10px]" style={{ color: "oklch(0.34 0.05 45 / 0.5)" }}>
                  {order.customerName} • {order.fulfillmentType === "shipping" ? "📦 Shipping" : "🎂 Pickup"}
                  {order.pickupDate && ` • ${order.pickupDate} ${order.pickupTime || ""}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] uppercase px-2 py-0.5"
                  style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: statusColors[order.status] || "oklch(0.34 0.05 45)", border: `1px solid ${statusColors[order.status] || "oklch(0.34 0.05 45)"}` }}
                >
                  {order.status}
                </span>
                <span className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                  ${order.total}
                </span>
              </div>
            </div>

            {/* Expand/Collapse */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                className="text-[10px] uppercase"
                style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", color: "oklch(0.34 0.05 45 / 0.5)" }}
              >
                {expandedOrder === order.id ? "▲ Hide Items" : "▼ Show Items"}
              </button>
              {nextStatus[order.status] && (
                <button
                  onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: nextStatus[order.status] as any })}
                  disabled={updateStatusMutation.isPending}
                  className="text-[10px] uppercase px-3 py-1 disabled:opacity-40"
                  style={{ fontFamily: "var(--font-body)", letterSpacing: "0.1em", backgroundColor: "oklch(0.34 0.05 45)", color: "oklch(0.94 0.015 80)" }}
                >
                  → {nextStatus[order.status]}
                </button>
              )}
            </div>

            {/* Order Items */}
            {expandedOrder === order.id && orderItemsData.length > 0 && (
              <div className="pl-3 space-y-1" style={{ borderLeft: "2px solid oklch(0.84 0.025 72 / 0.5)" }}>
                {orderItemsData.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-xs" style={{ fontFamily: "var(--font-body)", color: "oklch(0.34 0.05 45)" }}>
                    <span>{item.productName} ×{item.quantity}</span>
                    <span>${item.totalPrice}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Shipping Address */}
            {order.fulfillmentType === "shipping" && order.shippingAddress && (
              <p className="text-[10px] pl-3" style={{ color: "oklch(0.34 0.05 45 / 0.5)" }}>
                📨 {order.shippingAddress}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
