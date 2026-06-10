/**
 * Staff POS — Square-style tablet/PC optimized point-of-sale interface
 * Layout: Left sidebar (Keypad/Library/Favourites) | Center tile grid | Right order panel
 * Bottom tabs: Checkout, Transactions, Orders
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
  modifiers?: { name: string; option: string; priceAdjustment: number }[];
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
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"checkout" | "transactions" | "orders">("checkout");
  const [sidebarMode, setSidebarMode] = useState<"keypad" | "library" | "favourites">("library");
  const [keypadValue, setKeypadValue] = useState("");
  const [modifierPopup, setModifierPopup] = useState<{ item: any; modifiers: any[] } | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<number, { label: string; priceAdjustment: number }>>({});

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

  const branchId = staffData?.branchId;

  const { data: categories = [] } = trpc.pos.listCategories.useQuery(
    { branchId: branchId! },
    { enabled: !!branchId }
  );
  const { data: menuItems = [] } = trpc.pos.listMenuItems.useQuery(
    { branchId: branchId! },
    { enabled: !!branchId }
  );
  const { data: allModifiers = [] } = trpc.pos.listModifiersByBranch.useQuery(
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
    // Check if item has modifiers
    const itemModifiers = allModifiers.filter((m: any) => m.menuItemId === item.id);
    if (itemModifiers.length > 0) {
      setModifierPopup({ item, modifiers: itemModifiers });
      setSelectedModifiers({});
      return;
    }
    // No modifiers — add directly
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id && c.priceType === "fixed" && !c.modifiers?.length);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id && c.priceType === "fixed" && !c.modifiers?.length
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
  }, [allModifiers]);

  const confirmModifiers = () => {
    if (!modifierPopup) return;
    const { item, modifiers } = modifierPopup;
    // Check required modifiers
    const missingRequired = modifiers.filter((m: any) => m.required && !selectedModifiers[m.id]);
    if (missingRequired.length > 0) {
      toast.error(`Please select: ${missingRequired.map((m: any) => m.name).join(", ")}`);
      return;
    }
    const modifierList = Object.entries(selectedModifiers).map(([modId, opt]) => {
      const mod = modifiers.find((m: any) => m.id === Number(modId));
      return { name: mod?.name || "", option: opt.label, priceAdjustment: opt.priceAdjustment };
    });
    const priceAdj = modifierList.reduce((sum, m) => sum + m.priceAdjustment, 0);
    const basePrice = parseFloat(item.unitPrice);
    const finalPrice = basePrice + priceAdj;
    const modLabel = modifierList.map(m => m.option).join(", ");
    setCart((prev) => [...prev, {
      menuItemId: item.id,
      itemName: modLabel ? `${item.name} (${modLabel})` : item.name,
      quantity: 1,
      unitPrice: finalPrice,
      totalPrice: finalPrice,
      priceType: "fixed" as const,
      modifiers: modifierList,
    }]);
    setModifierPopup(null);
    setSelectedModifiers({});
  };

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

  // Keypad functions
  const handleKeypad = (key: string) => {
    if (key === "C") { setKeypadValue(""); return; }
    if (key === "⌫") { setKeypadValue((v) => v.slice(0, -1)); return; }
    if (key === "." && keypadValue.includes(".")) return;
    setKeypadValue((v) => v + key);
  };

  const addKeypadAmount = () => {
    const amount = parseFloat(keypadValue);
    if (!amount || amount <= 0) return;
    setCart((prev) => [...prev, {
      itemName: `Custom $${amount.toFixed(2)}`,
      quantity: 1,
      unitPrice: amount,
      totalPrice: amount,
      priceType: "custom" as const,
    }]);
    setKeypadValue("");
    toast.success(`Added $${amount.toFixed(2)}`);
  };

  // ─── Login Screen ─────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-900">
        <p className="text-sm animate-pulse text-neutral-400">Loading...</p>
      </div>
    );
  }

  if (!staffData) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-900">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-neutral-900">Queen St BB</h1>
            <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider">Staff POS Login</p>
          </div>
          <div className="space-y-3">
            <input
              className="w-full p-3 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
              placeholder="Username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate(loginForm)}
            />
            <input
              className="w-full p-3 text-sm border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && loginMutation.mutate(loginForm)}
            />
            <button
              onClick={() => loginMutation.mutate(loginForm)}
              disabled={loginMutation.isPending}
              className="w-full py-3 text-sm font-medium bg-neutral-900 text-white rounded hover:bg-neutral-800 disabled:opacity-40 transition-colors"
            >
              {loginMutation.isPending ? "..." : "LOGIN"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredItems = selectedCategory
    ? menuItems.filter((item: any) => item.categoryId === selectedCategory)
    : menuItems;

  // Get abbreviation for category tile
  const getAbbrev = (name: string) => {
    const words = name.split(" ");
    if (words.length === 1) return name.slice(0, 2);
    return words.map(w => w[0]).join("").slice(0, 2);
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-100 select-none">
      {/* Main Content Area */}
      {activeTab === "checkout" ? (
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-44 flex flex-col bg-white border-r border-neutral-200">
            <div className="flex flex-col">
              {(["keypad", "library", "favourites"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSidebarMode(mode)}
                  className={`px-4 py-3 text-left text-sm capitalize border-b border-neutral-100 transition-colors ${
                    sidebarMode === mode ? "bg-neutral-100 font-medium text-neutral-900" : "text-neutral-500 hover:bg-neutral-50"
                  }`}
                >
                  {mode === "keypad" ? "Keypad" : mode === "library" ? "Library" : "Favourites"}
                </button>
              ))}
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-2">
              {sidebarMode === "keypad" && (
                <div className="space-y-2">
                  <div className="text-right p-2 bg-neutral-50 rounded text-lg font-mono min-h-[40px]">
                    {keypadValue || "0.00"}
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {["7","8","9","4","5","6","1","2","3",".","0","⌫"].map((k) => (
                      <button
                        key={k}
                        onClick={() => handleKeypad(k)}
                        className="py-3 text-center text-sm font-medium bg-neutral-50 hover:bg-neutral-200 rounded transition-colors"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={addKeypadAmount}
                    disabled={!keypadValue || parseFloat(keypadValue) <= 0}
                    className="w-full py-2 text-xs font-medium bg-neutral-900 text-white rounded disabled:opacity-30"
                  >
                    ADD ${keypadValue || "0.00"}
                  </button>
                  <button
                    onClick={() => handleKeypad("C")}
                    className="w-full py-2 text-xs text-neutral-500 border border-neutral-200 rounded"
                  >
                    CLEAR
                  </button>
                </div>
              )}

              {sidebarMode === "library" && (
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
                      !selectedCategory ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    All Items
                  </button>
                  {categories.map((cat: any) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 text-xs rounded transition-colors ${
                        selectedCategory === cat.id ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {sidebarMode === "favourites" && (
                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider px-2 py-1">Quick Access</p>
                  {menuItems.slice(0, 10).map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center: Category Tile Grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {!selectedCategory ? (
              /* Show category tiles (Square-style large buttons) */
              <div className="grid grid-cols-4 lg:grid-cols-5 gap-2">
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="aspect-square flex flex-col items-center justify-center rounded-lg transition-all hover:scale-[1.02] active:scale-95"
                    style={{ backgroundColor: cat.color || "#8B8B8B" }}
                  >
                    <span className="text-xl font-bold text-white uppercase">
                      {getAbbrev(cat.name)}
                    </span>
                    <span className="text-[10px] text-white/80 mt-1 text-center px-1 leading-tight max-w-full truncate">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              /* Show items in selected category */
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
                  >
                    ← Back
                  </button>
                  <h2 className="text-sm font-medium text-neutral-700">
                    {categories.find((c: any) => c.id === selectedCategory)?.name}
                  </h2>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {filteredItems.map((item: any) => {
                    const hasModifiers = allModifiers.some((m: any) => m.menuItemId === item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => addToCart(item)}
                        className="rounded-lg text-left bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-sm transition-all active:scale-95 overflow-hidden flex flex-col"
                      >
                        {item.imageUrl ? (
                          <div className="w-full aspect-square bg-neutral-50">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full aspect-square bg-neutral-50 flex items-center justify-center">
                            <span className="text-2xl font-bold text-neutral-200 uppercase">{item.name.slice(0, 2)}</span>
                          </div>
                        )}
                        <div className="p-2 flex-1">
                          <p className="text-xs font-medium text-neutral-800 truncate">{item.name}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[10px] text-neutral-400">
                              {item.priceType === "weight" ? `$${item.unitPrice}/100g` : item.priceType === "custom" ? "Custom $" : `$${item.unitPrice}`}
                            </p>
                            {hasModifiers && <span className="text-[8px] px-1 py-0.5 rounded bg-blue-50 text-blue-400">OPT</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {filteredItems.length === 0 && (
                  <div className="text-center py-12 text-neutral-300">
                    <p className="text-sm">No items in this category</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Order Panel */}
          <div className="w-72 lg:w-80 flex flex-col bg-white border-l border-neutral-200">
            {/* Order Header */}
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">No sale</span>
              <span className="text-xs text-neutral-400">For Here</span>
            </div>

            {/* Add Customer */}
            <div className="px-4 py-2 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs">Add customer</span>
              </div>
              <span className="text-neutral-300">›</span>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-neutral-300">
                  <p className="text-xs">Tap items to add to order</p>
                </div>
              ) : (
                cart.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-neutral-800 truncate">{item.itemName}</p>
                      <p className="text-[10px] text-neutral-400">
                        {item.priceType === "weight" ? `${item.weightGrams}g @ $${item.unitPrice}/100g` : item.priceType === "custom" ? "Custom" : `$${item.unitPrice} × ${item.quantity}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.priceType === "fixed" && (
                        <>
                          <button onClick={() => adjustQuantity(i, -1)} className="w-5 h-5 flex items-center justify-center text-xs border border-neutral-200 rounded text-neutral-500 hover:bg-neutral-100">−</button>
                          <span className="w-5 text-center text-xs text-neutral-700">{item.quantity}</span>
                          <button onClick={() => adjustQuantity(i, 1)} className="w-5 h-5 flex items-center justify-center text-xs border border-neutral-200 rounded text-neutral-500 hover:bg-neutral-100">+</button>
                        </>
                      )}
                      <span className="text-sm font-medium text-neutral-800 ml-2 w-14 text-right">${item.totalPrice.toFixed(2)}</span>
                      <button onClick={() => removeFromCart(i)} className="text-neutral-300 hover:text-red-400 ml-1 text-xs">×</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Charge Button */}
            <div className="p-3 border-t border-neutral-200 space-y-2">
              {showPayment ? (
                <div className="space-y-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Cash received"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-full p-2 text-lg text-center border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
                    autoFocus
                  />
                  {change > 0 && (
                    <p className="text-center text-sm text-green-600">Change: ${change.toFixed(2)}</p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => processPayment("cash")}
                      disabled={createOrderMutation.isPending}
                      className="py-3 text-xs font-medium bg-green-600 text-white rounded disabled:opacity-40"
                    >
                      CONFIRM CASH
                    </button>
                    <button
                      onClick={() => setShowPayment(false)}
                      className="py-3 text-xs text-neutral-500 border border-neutral-200 rounded"
                    >
                      BACK
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => cart.length > 0 && setShowPayment(true)}
                    disabled={cart.length === 0}
                    className="w-full py-4 text-sm font-medium bg-green-600 text-white rounded-lg disabled:bg-neutral-200 disabled:text-neutral-400 transition-colors"
                  >
                    Charge ${cartTotal.toFixed(2)}
                  </button>
                  <p className="text-[10px] text-center text-neutral-400">May incur 2.2% surcharge</p>
                  {cart.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => processPayment("card")}
                        className="py-2 text-[10px] font-medium text-neutral-500 border border-neutral-200 rounded hover:bg-neutral-50"
                      >
                        CARD
                      </button>
                      <button
                        onClick={() => { setCart([]); setShowPayment(false); setCashReceived(""); }}
                        className="py-2 text-[10px] text-red-400 border border-neutral-200 rounded hover:bg-red-50"
                      >
                        CLEAR ALL
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "orders" ? (
        <StaffOnlineOrders branchId={branchId} />
      ) : (
        <StaffTransactions branchId={branchId} />
      )}

      {/* Bottom Tab Bar (Square-style) */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-t border-neutral-200">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab("checkout")}
            className={`flex items-center gap-1.5 py-1 text-xs ${activeTab === "checkout" ? "text-neutral-900 font-medium" : "text-neutral-400"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Checkout
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-1.5 py-1 text-xs ${activeTab === "transactions" ? "text-neutral-900 font-medium" : "text-neutral-400"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Transactions
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-1.5 py-1 text-xs ${activeTab === "orders" ? "text-neutral-900 font-medium" : "text-neutral-400"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Orders
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
            {staffData?.displayName} • {staffData?.branchId === 1 ? "Hawthorn" : staffData?.branchId === 2 ? "Windsor" : "CBD"}
          </span>
          <button
            onClick={toggleFullscreen}
            className="text-[10px] text-neutral-400 hover:text-neutral-700 px-2 py-1 border border-neutral-200 rounded"
          >
            {isFullscreen ? "Exit" : "⛶"}
          </button>
          <button
            onClick={() => logoutMutation.mutate()}
            className="text-[10px] text-neutral-400 hover:text-neutral-700"
          >
            Log in
          </button>
        </div>
      </div>

      {/* Weight Input Modal */}
      {weightInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="p-6 w-full max-w-xs bg-white rounded-lg space-y-4">
            <h3 className="text-sm font-medium text-neutral-800">{weightInput.name}</h3>
            <p className="text-xs text-neutral-400">${weightInput.unitPrice}/100g — Enter weight in grams</p>
            <input
              type="number"
              value={weightValue}
              onChange={(e) => setWeightValue(e.target.value)}
              placeholder="Weight (g)"
              className="w-full p-3 text-lg text-center border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmWeight()}
            />
            {weightValue && (
              <p className="text-center text-sm text-neutral-700">
                = ${((parseFloat(weightValue) / 100) * weightInput.unitPrice).toFixed(2)}
              </p>
            )}
            <div className="flex gap-2">
              <button onClick={confirmWeight} disabled={!weightValue}
                className="flex-1 py-2 text-xs font-medium bg-neutral-900 text-white rounded disabled:opacity-40">
                ADD
              </button>
              <button onClick={() => setWeightInput(null)}
                className="flex-1 py-2 text-xs text-neutral-500 border border-neutral-200 rounded">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="p-6 w-full max-w-sm bg-white rounded-lg space-y-4">
            <div className="text-center">
              <div className="w-10 h-10 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-800 mt-2">{receipt.orderNumber}</h3>
              <p className="text-xs text-neutral-400">Order Complete</p>
            </div>
            <div className="space-y-1 border-t border-neutral-100 pt-3">
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-neutral-700">
                  <span>{item.itemName} {item.quantity > 1 ? `×${item.quantity}` : ""}{item.weightGrams ? ` (${item.weightGrams}g)` : ""}</span>
                  <span>${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2 border-t-2 border-neutral-800">
              <span className="text-sm font-medium text-neutral-800">Total</span>
              <span className="text-lg font-bold text-neutral-800">${receipt.total}</span>
            </div>
            {receipt.paymentMethod === "cash" && (
              <div className="text-xs text-neutral-500 space-y-0.5">
                {receipt.cashReceived && <p>Cash received: ${receipt.cashReceived}</p>}
                {receipt.changeGiven && <p>Change: ${receipt.changeGiven}</p>}
              </div>
            )}
            <p className="text-center text-[10px] text-neutral-400">
              {receipt.staffName} • {receipt.timestamp.toLocaleTimeString()}
            </p>
            <button
              onClick={() => setReceipt(null)}
              className="w-full py-3 text-sm font-medium bg-neutral-900 text-white rounded-lg"
            >
              NEW ORDER
            </button>
          </div>
        </div>
      )}

      {/* Custom Price Modal */}
      {customPriceInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="p-6 w-full max-w-xs bg-white rounded-lg space-y-4">
            <h3 className="text-sm font-medium text-neutral-800">{customPriceInput.name}</h3>
            <p className="text-xs text-neutral-400">Enter price</p>
            <input
              type="number"
              step="0.01"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="$0.00"
              className="w-full p-3 text-lg text-center border border-neutral-200 rounded focus:outline-none focus:border-neutral-400"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && confirmCustomPrice()}
            />
            <div className="flex gap-2">
              <button onClick={confirmCustomPrice} disabled={!customPrice}
                className="flex-1 py-2 text-xs font-medium bg-neutral-900 text-white rounded disabled:opacity-40">
                ADD
              </button>
              <button onClick={() => setCustomPriceInput(null)}
                className="flex-1 py-2 text-xs text-neutral-500 border border-neutral-200 rounded">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modifier Selection Popup */}
      {modifierPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="p-6 w-full max-w-sm bg-white rounded-lg space-y-4">
            <div className="flex items-center gap-3">
              {modifierPopup.item.imageUrl && (
                <img src={modifierPopup.item.imageUrl} alt="" className="w-12 h-12 rounded object-cover" />
              )}
              <div>
                <h3 className="text-sm font-medium text-neutral-800">{modifierPopup.item.name}</h3>
                <p className="text-xs text-neutral-400">${parseFloat(modifierPopup.item.unitPrice).toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {modifierPopup.modifiers.map((mod: any) => (
                <div key={mod.id}>
                  <p className="text-xs font-medium text-neutral-700 mb-1.5">
                    {mod.name} {mod.required && <span className="text-red-400">*</span>}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(mod.options as any[]).map((opt: any, i: number) => {
                      const isSelected = selectedModifiers[mod.id]?.label === opt.label;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedModifiers((prev) => ({
                            ...prev,
                            [mod.id]: isSelected ? undefined! : opt,
                          }))}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                            isSelected
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400"
                          }`}
                        >
                          {opt.label}
                          {opt.priceAdjustment !== 0 && (
                            <span className={isSelected ? "text-white/70 ml-1" : "text-neutral-400 ml-1"}>
                              {opt.priceAdjustment > 0 ? `+$${opt.priceAdjustment}` : `-$${Math.abs(opt.priceAdjustment)}`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Total preview */}
            <div className="pt-2 border-t border-neutral-100">
              <p className="text-xs text-neutral-500 text-right">
                Total: ${
                  (parseFloat(modifierPopup.item.unitPrice) +
                    Object.values(selectedModifiers).reduce((sum, opt) => sum + (opt?.priceAdjustment || 0), 0)
                  ).toFixed(2)
                }
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={confirmModifiers}
                className="flex-1 py-2.5 text-xs font-medium bg-neutral-900 text-white rounded"
              >
                ADD TO ORDER
              </button>
              <button
                onClick={() => { setModifierPopup(null); setSelectedModifiers({}); }}
                className="flex-1 py-2.5 text-xs text-neutral-500 border border-neutral-200 rounded"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Staff Transactions Component ─────────────────────────────────────
function StaffTransactions({ branchId }: { branchId: number }) {
  const { data: summary } = trpc.pos.salesSummary.useQuery(
    { branchId, startDate: new Date(new Date().setHours(0,0,0,0)).toISOString(), endDate: new Date().toISOString() },
    { enabled: !!branchId }
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-sm font-medium text-neutral-700 mb-4">Today's Transactions</h2>
      {summary ? (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <p className="text-xs text-neutral-400 uppercase tracking-wider">Total Sales</p>
            <p className="text-2xl font-bold text-neutral-800 mt-1">${(summary as any).totalSales?.toFixed(2) || "0.00"}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <p className="text-xs text-neutral-400 uppercase tracking-wider">Orders</p>
            <p className="text-2xl font-bold text-neutral-800 mt-1">{(summary as any).orderCount || 0}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <p className="text-xs text-neutral-400 uppercase tracking-wider">Avg Order</p>
            <p className="text-2xl font-bold text-neutral-800 mt-1">${(summary as any).avgOrder?.toFixed(2) || "0.00"}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-neutral-400">Loading transactions...</p>
      )}
      {(summary as any)?.items && (summary as any).items.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Top Items Today</h3>
          <div className="space-y-2">
            {(summary as any).items.slice(0, 10).map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-xs text-neutral-700">
                <span>{item.itemName}</span>
                <span className="font-medium">{item.totalQuantity}× — ${item.totalRevenue}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Staff Online Orders Component ─────────────────────────────────────
function StaffOnlineOrders({ branchId }: { branchId: number }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const { data: onlineOrders = [], refetch, isFetching } = trpc.pos.staffOnlineOrders.useQuery(
    { branchId, statusFilter: statusFilter as any },
    { refetchInterval: 10000, refetchIntervalInBackground: true }
  );

  const { data: orderItemsData = [] } = trpc.pos.staffOrderItems.useQuery(
    { orderId: expandedOrder! },
    { enabled: !!expandedOrder }
  );

  const updateStatusMutation = trpc.pos.staffUpdateOrderStatus.useMutation({
    onSuccess: () => { toast.success("Order status updated"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  // Update last refresh time
  useEffect(() => {
    if (!isFetching) setLastRefresh(new Date());
  }, [isFetching]);

  const statusColors: Record<string, string> = {
    pending: "text-amber-700 border-amber-300 bg-amber-50",
    paid: "text-blue-700 border-blue-300 bg-blue-50",
    preparing: "text-orange-700 border-orange-300 bg-orange-50",
    ready: "text-green-700 border-green-300 bg-green-50",
    shipped: "text-purple-700 border-purple-300 bg-purple-50",
    completed: "text-neutral-600 border-neutral-300 bg-neutral-100",
  };

  const statusLabels: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    preparing: "Preparing",
    ready: "Ready",
    shipped: "Shipped",
    completed: "Done",
  };

  const nextStatus: Record<string, string> = {
    paid: "preparing",
    preparing: "ready",
    ready: "shipped",
    shipped: "completed",
  };

  const nextStatusLabel: Record<string, string> = {
    paid: "Start Preparing",
    preparing: "Mark Ready",
    ready: "Mark Shipped",
    shipped: "Complete",
  };

  // Filter by type
  const filteredOrders = onlineOrders.filter((order: any) => {
    if (typeFilter === "shipping") return order.fulfillmentType === "shipping";
    if (typeFilter === "pickup") return order.fulfillmentType === "pickup";
    return true;
  });

  const shippingCount = onlineOrders.filter((o: any) => o.fulfillmentType === "shipping").length;
  const pickupCount = onlineOrders.filter((o: any) => o.fulfillmentType === "pickup").length;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-neutral-800">Online Orders</h2>
        <div className="flex items-center gap-2">
          {isFetching && (
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" title="Refreshing..." />
          )}
          <span className="text-[10px] text-neutral-400">
            Updated {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button
            onClick={() => refetch()}
            className="text-xs text-neutral-400 hover:text-neutral-700 px-2 py-1 border border-neutral-200 rounded"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
            typeFilter === "all" ? "bg-neutral-900 text-white" : "text-neutral-500 border border-neutral-200 hover:bg-neutral-100"
          }`}
        >
          All ({onlineOrders.length})
        </button>
        <button
          onClick={() => setTypeFilter("shipping")}
          className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
            typeFilter === "shipping" ? "bg-neutral-900 text-white" : "text-neutral-500 border border-neutral-200 hover:bg-neutral-100"
          }`}
        >
          📦 Shipping ({shippingCount})
        </button>
        <button
          onClick={() => setTypeFilter("pickup")}
          className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
            typeFilter === "pickup" ? "bg-neutral-900 text-white" : "text-neutral-500 border border-neutral-200 hover:bg-neutral-100"
          }`}
        >
          🎂 Pickup ({pickupCount})
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-1 flex-wrap">
        {["all", "paid", "preparing", "ready", "shipped"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-xs rounded transition-colors capitalize ${
              statusFilter === s ? "bg-neutral-700 text-white" : "text-neutral-500 border border-neutral-200 hover:bg-neutral-100"
            }`}
          >
            {s === "all" ? "All Status" : statusLabels[s] || s}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm text-neutral-400">No orders found</p>
          <p className="text-xs text-neutral-300 mt-1">Orders from the website will appear here automatically</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order: any) => (
            <div key={order.id} className={`bg-white rounded-lg border p-4 space-y-3 transition-shadow hover:shadow-sm ${
              order.status === "paid" ? "border-blue-200 border-l-4 border-l-blue-500" :
              order.status === "preparing" ? "border-orange-200 border-l-4 border-l-orange-500" :
              order.status === "ready" ? "border-green-200 border-l-4 border-l-green-500" :
              "border-neutral-200"
            }`}>
              {/* Order Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-800">{order.orderNumber}</p>
                    <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full border font-medium ${
                      statusColors[order.status] || "text-neutral-500 border-neutral-200"
                    }`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {order.customerName}
                    {order.customerPhone && ` • ${order.customerPhone}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      order.fulfillmentType === "shipping"
                        ? "bg-indigo-50 text-indigo-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}>
                      {order.fulfillmentType === "shipping" ? "📦 Shipping" : "🎂 Pickup"}
                    </span>
                    {order.pickupDate && (
                      <span className="text-xs text-neutral-500">
                        📅 {order.pickupDate} {order.pickupTime && `@ ${order.pickupTime}`}
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-400">
                      {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-neutral-800">${order.total}</p>
                  {order.shippingFee && Number(order.shippingFee) > 0 && (
                    <p className="text-[10px] text-neutral-400">incl. ${order.shippingFee} shipping</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1 border border-neutral-200 rounded hover:bg-neutral-50"
                >
                  {expandedOrder === order.id ? "▲ Hide Items" : "▼ View Items"}
                </button>
                {nextStatus[order.status] && (
                  <button
                    onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: nextStatus[order.status] as any })}
                    disabled={updateStatusMutation.isPending}
                    className={`text-xs px-3 py-1.5 rounded font-medium transition-colors disabled:opacity-40 ${
                      order.status === "paid" ? "bg-orange-500 hover:bg-orange-600 text-white" :
                      order.status === "preparing" ? "bg-green-500 hover:bg-green-600 text-white" :
                      order.status === "ready" ? "bg-purple-500 hover:bg-purple-600 text-white" :
                      "bg-neutral-800 hover:bg-neutral-900 text-white"
                    }`}
                  >
                    → {nextStatusLabel[order.status]}
                  </button>
                )}
                {order.status === "completed" && (
                  <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                )}
              </div>

              {/* Expanded Order Items */}
              {expandedOrder === order.id && (
                <div className="pt-2 border-t border-neutral-100">
                  {orderItemsData.length > 0 ? (
                    <div className="space-y-1.5">
                      {orderItemsData.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-neutral-700">
                            <span className="font-medium">{item.quantity}×</span> {item.productName}
                          </span>
                          <span className="text-neutral-600 font-medium">${item.totalPrice}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400">Loading items...</p>
                  )}
                  {/* Shipping Address */}
                  {order.fulfillmentType === "shipping" && order.shippingAddress && (
                    <div className="mt-2 pt-2 border-t border-neutral-100">
                      <p className="text-[10px] uppercase text-neutral-400 font-medium mb-0.5">Shipping Address</p>
                      <p className="text-xs text-neutral-600">{order.shippingAddress}</p>
                    </div>
                  )}
                  {/* Customer Contact */}
                  {order.customerEmail && (
                    <div className="mt-2 pt-2 border-t border-neutral-100">
                      <p className="text-[10px] uppercase text-neutral-400 font-medium mb-0.5">Contact</p>
                      <p className="text-xs text-neutral-600">
                        {order.customerEmail}
                        {order.customerPhone && ` • ${order.customerPhone}`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
