/**
 * Staff POS — Square-style tablet/PC optimized point-of-sale interface
 * Layout: Left sidebar (Keypad/Library/Favourites) | Center tile grid | Right order panel
 * Bottom tabs: Checkout, Transactions, Orders
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getAutoSurchargeType, SURCHARGE_EXEMPT_CATEGORIES } from "@shared/holidays";
import StaffShifts from "./StaffShifts";
import StaffAttendance from "./StaffAttendance";

interface CartItem {
  menuItemId?: number;
  itemName: string;
  categoryName?: string;
  quantity: number;
  weightGrams?: number;
  unitPrice: number;
  totalPrice: number;
  priceType: "fixed" | "weight" | "custom";
  modifiers?: { name: string; option: string; priceAdjustment: number }[];
}

interface ReceiptData {
  orderNumber: string;
  receiptToken: string;
  total: string;
  items: CartItem[];
  paymentMethod: string;
  cashReceived?: string;
  changeGiven?: string;
  staffName: string;
  timestamp: Date;
}

export default function StaffPOS() {
  const trpcUtils = trpc.useUtils();
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
  const [receiptEmail, setReceiptEmail] = useState("");
  const [receiptPhone, setReceiptPhone] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"checkout" | "transactions" | "orders" | "shifts" | "attendance">("checkout");
  const [sidebarMode, setSidebarMode] = useState<"keypad" | "library" | "favourites">("library");
  const [keypadValue, setKeypadValue] = useState("");
  const [modifierPopup, setModifierPopup] = useState<{ item: any; modifiers: any[] } | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<number, { label: string; priceAdjustment: number }>>({});
  const [fulfillmentType, setFulfillmentType] = useState<"for_here" | "to_go" | "delivery" | "pickup">("for_here");
  const [surchargeType, setSurchargeType] = useState<"none" | "weekend" | "holiday">(getAutoSurchargeType());
  const [discountType, setDiscountType] = useState<"none" | "staff" | "influencer">("none");
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: number; name: string } | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

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
        receiptToken: data.receiptToken,
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
      setFulfillmentType("for_here");
      setSurchargeType(getAutoSurchargeType());
      setDiscountType("none");
      setSelectedCustomer(null);
      setCustomerSearch("");
      if (data.pointsEarned && data.pointsEarned > 0) {
        toast.success(`+${data.pointsEarned} points earned!`);
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const sendReceiptMutation = trpc.pos.sendReceipt.useMutation({
    onSuccess: (data) => { toast.success(data.smsSent ? "E-receipt sent by email and SMS" : data.emailSent ? "E-receipt sent by email" : "Receipt link ready to share"); if (data.smsUrl) window.open(data.smsUrl, "_blank"); },
    onError: (e) => toast.error(e.message),
  });

  const manualStampMutation = trpc.pos.addLoyaltyStamp.useMutation({
    onSuccess: (data) => {
      toast.success(`Stamp added for ${selectedCustomer?.name || "customer"}`);
      if (selectedCustomer) {
        void trpcUtils.loyalty.getByCustomerId.invalidate({ customerId: selectedCustomer.id });
      }
    },
    onError: (error) => toast.error(error.message || "Unable to add stamp"),
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

  const cartSubtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountPercent = discountType === "staff" ? 30 : discountType === "influencer" ? 100 : 0;
  const discountAmount = cartSubtotal * (discountPercent / 100);
  const afterDiscount = cartSubtotal - discountAmount;

  // Surcharge: exclude goods/merchandise categories
  const surchargePercent = surchargeType === "weekend" ? 10 : surchargeType === "holiday" ? 15 : 0;
  const surchargeable = cart.filter(item => !SURCHARGE_EXEMPT_CATEGORIES.includes(item.categoryName || ""));
  const exemptItems = cart.filter(item => SURCHARGE_EXEMPT_CATEGORIES.includes(item.categoryName || ""));
  const surchargeableSubtotal = surchargeable.reduce((sum, item) => sum + item.totalPrice, 0);
  const exemptSubtotal = exemptItems.reduce((sum, item) => sum + item.totalPrice, 0);
  // Apply discount proportionally, then surcharge only on non-exempt portion
  const discountRatio = cartSubtotal > 0 ? afterDiscount / cartSubtotal : 1;
  const surchargeableAfterDiscount = surchargeableSubtotal * discountRatio;
  const surchargeAmount = surchargeableAfterDiscount * (surchargePercent / 100);
  const cartTotal = afterDiscount + surchargeAmount;
  const gstAmount = cartTotal / 11;
  const change = cashReceived ? parseFloat(cashReceived) - cartTotal : 0;

  // Helper to get category name for an item
  const getCategoryName = useCallback((item: any) => {
    const cat = categories.find((c: any) => c.id === item.categoryId);
    return cat?.name || "";
  }, [categories]);

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
    const catName = getCategoryName(item);
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
        categoryName: catName,
        quantity: 1,
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.unitPrice),
        priceType: "fixed" as const,
      }];
    });
  }, [allModifiers, getCategoryName]);

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
    const catName = getCategoryName(item);
    setCart((prev) => [...prev, {
      menuItemId: item.id,
      itemName: modLabel ? `${item.name} (${modLabel})` : item.name,
      categoryName: catName,
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

  const [showEftposConfirm, setShowEftposConfirm] = useState(false);

  const processPayment = (method: "cash" | "card") => {
    if (cart.length === 0) return;
    if (method === "card") {
      setShowEftposConfirm(true);
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
        modifiers: item.modifiers,
      })),
      paymentMethod: method,
      fulfillmentType,
      surchargeType,
      discountType,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
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
            {/* Order Header — Fulfillment Type Selector */}
            <div className="px-3 py-2 border-b border-neutral-100">
              <div className="flex gap-1">
                {(["for_here", "to_go", "delivery", "pickup"] as const).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => setFulfillmentType(ft)}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-colors ${
                      fulfillmentType === ft
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-500 hover:bg-neutral-100"
                    }`}
                  >
                    {ft === "for_here" ? "Dine In" : ft === "to_go" ? "To Go" : ft === "delivery" ? "Delivery" : "Pick Up"}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Selection with Loyalty Points */}
            <div className="px-4 py-2 border-b border-neutral-100">
              {selectedCustomer ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-amber-700">{selectedCustomer.name[0]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-800 truncate">{selectedCustomer.name}</p>
                      <CustomerPointsBadge customerId={selectedCustomer.id} />
                      <button
                        type="button"
                        onClick={() => manualStampMutation.mutate({ branchId: branchId!, staffId: staffData.id, customerId: selectedCustomer.id })}
                        disabled={!branchId || manualStampMutation.isPending}
                        className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-amber-700 hover:text-amber-900 disabled:opacity-40"
                      >
                        {manualStampMutation.isPending ? "Adding…" : "+ Add visit stamp"}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setShowCustomerSearch(false); }} className="text-neutral-400 hover:text-red-400 text-xs">×</button>
                </div>
              ) : showCustomerSearch ? (
                <div>
                  <input
                    type="text"
                    placeholder="Search customer name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 border border-neutral-200 rounded focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                  <CustomerSearchResults query={customerSearch} onSelect={(c) => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerSearch(""); }} />
                </div>
              ) : (
                <button onClick={() => setShowCustomerSearch(true)} className="flex items-center gap-2 text-neutral-400 hover:text-neutral-600 w-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs">Add customer (earn points + stamp)</span>
                </button>
              )}
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

            {/* Surcharge Selector */}
            <div className="px-3 py-2 border-t border-neutral-100">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] text-neutral-400 mr-1">Surcharge:</span>
                {(["none", "weekend", "holiday"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSurchargeType(st)}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      surchargeType === st
                        ? st === "weekend" ? "bg-amber-500 text-white" : st === "holiday" ? "bg-red-500 text-white" : "bg-neutral-200 text-neutral-700"
                        : "text-neutral-400 hover:bg-neutral-100"
                    }`}
                  >
                    {st === "none" ? "None" : st === "weekend" ? "주말 +10%" : "공휴일 +15%"}
                  </button>
                ))}
                {getAutoSurchargeType() !== "none" && (
                  <span className="text-[9px] text-amber-500 ml-1">• Auto</span>
                )}
              </div>
            </div>

            {/* Discount Selector */}
            <div className="px-3 py-2 border-t border-neutral-100">
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-neutral-400 mr-1">Discount:</span>
                {(["none", "staff", "influencer"] as const).map((dt) => (
                  <button
                    key={dt}
                    onClick={() => setDiscountType(dt)}
                    className={`px-2 py-1 text-[10px] rounded transition-colors ${
                      discountType === dt
                        ? dt === "staff" ? "bg-blue-600 text-white" : dt === "influencer" ? "bg-purple-600 text-white" : "bg-neutral-200 text-neutral-700"
                        : "text-neutral-400 hover:bg-neutral-100"
                    }`}
                  >
                    {dt === "none" ? "None" : dt === "staff" ? "Staff -30%" : "Influencer 100%"}
                  </button>
                ))}
              </div>
            </div>

            {/* Order Totals */}
            <div className="px-3 py-2 border-t border-neutral-100 space-y-0.5">
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>Subtotal</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[10px] text-blue-600">
                  <span>{discountType === "staff" ? "Staff" : "Influencer"} Discount ({discountPercent}%)</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {surchargeAmount > 0 && (
                <div className="flex justify-between text-[10px] text-amber-600">
                  <span>{surchargeType === "weekend" ? "주말 Weekend" : "공휴일 Holiday"} Surcharge ({surchargePercent}%){exemptItems.length > 0 ? " *" : ""}</span>
                  <span>+${surchargeAmount.toFixed(2)}</span>
                </div>
              )}
              {surchargeAmount > 0 && exemptItems.length > 0 && (
                <div className="text-[9px] text-neutral-400 italic">
                  * Goods excluded from surcharge
                </div>
              )}
              <div className="flex justify-between text-[10px] text-neutral-400">
                <span>GST (incl.)</span>
                <span>${gstAmount.toFixed(2)}</span>
              </div>
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
                        EFTPOS / CARD
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
      ) : activeTab === "transactions" ? (
        staffData?.role === "owner" ? <StaffTransactions branchId={undefined} settlementBranchId={staffData.branchId} /> : <StaffTransactionList />
      ) : activeTab === "shifts" ? (
        <StaffShifts branchId={branchId} staffId={staffData?.id || 0} role={staffData?.role || "staff"} />
      ) : activeTab === "attendance" ? (
        <StaffAttendance branchId={branchId} staffId={staffData?.id || 0} displayName={staffData?.displayName || ""} role={staffData?.role || "staff"} />
      ) : null}

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
          {staffData && (
          <button
            onClick={() => setActiveTab("transactions")}
            className={`flex items-center gap-1.5 py-1 text-xs ${activeTab === "transactions" ? "text-neutral-900 font-medium" : "text-neutral-400"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Transactions
          </button>
          )}
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-1.5 py-1 text-xs ${activeTab === "orders" ? "text-neutral-900 font-medium" : "text-neutral-400"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Orders
          </button>
          <button
            onClick={() => setActiveTab("shifts")}
            className={`flex items-center gap-1.5 py-1 text-xs ${activeTab === "shifts" ? "text-neutral-900 font-medium" : "text-neutral-400"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Shifts
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex items-center gap-1.5 py-1 text-xs ${activeTab === "attendance" ? "text-neutral-900 font-medium" : "text-neutral-400"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Attendance
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
            <div className="border-t border-neutral-100 pt-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">Send e-receipt</p>
              <input value={receiptEmail} onChange={(e) => setReceiptEmail(e.target.value)} type="email" placeholder="Customer email" className="w-full border border-neutral-200 rounded px-3 py-2 text-xs" />
              <input value={receiptPhone} onChange={(e) => setReceiptPhone(e.target.value)} type="tel" placeholder="Customer phone (opens SMS share)" className="w-full border border-neutral-200 rounded px-3 py-2 text-xs" />
              <button disabled={sendReceiptMutation.isPending || (!receiptEmail && !receiptPhone)} onClick={() => sendReceiptMutation.mutate({ token: receipt.receiptToken, email: receiptEmail || undefined, phone: receiptPhone || undefined, origin: window.location.origin })} className="w-full py-2 text-xs border border-neutral-900 rounded disabled:opacity-40">{sendReceiptMutation.isPending ? "SENDING…" : "SEND / SHARE RECEIPT LINK"}</button>
            </div>
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

      {/* EFTPOS Confirmation Modal */}
      {showEftposConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="p-8 w-full max-w-sm bg-white rounded-xl space-y-6 text-center">
            <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">EFTPOS Payment</h3>
              <p className="text-3xl font-bold text-neutral-900 mt-2">${cartTotal.toFixed(2)}</p>
              <p className="text-xs text-neutral-400 mt-1">Process on ANZ EFTPOS terminal</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowEftposConfirm(false);
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
                      modifiers: item.modifiers,
                    })),
                    paymentMethod: "card",
                    fulfillmentType,
                    surchargeType,
                    discountType,
                    customerId: selectedCustomer?.id,
                    customerName: selectedCustomer?.name,
                  });
                }}
                className="w-full py-4 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                EFTPOS Payment Complete
              </button>
              <button
                onClick={() => setShowEftposConfirm(false)}
                className="w-full py-3 text-sm text-neutral-500 border border-neutral-200 rounded-lg hover:bg-neutral-50"
              >
                Cancel
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

const SETTLEMENT_BRANCHES = [
  { id: 1, name: "Hawthorn" },
  { id: 2, name: "Windsor" },
  { id: 3, name: "CBD" },
];
const BRANCH_COLORS: Record<string, string> = { Hawthorn: "#8b5e3c", Windsor: "#2f6f72", CBD: "#9c4f73" };

// ─── Staff Transactions Component ─────────────────────────────────────
function StaffTransactions({ branchId, settlementBranchId }: { branchId?: number; settlementBranchId: number }) {
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return { startDate: today.toISOString().slice(0, 10), endDate: today.toISOString().slice(0, 10) };
  });
  const [selectedSettlementBranch, setSelectedSettlementBranch] = useState(settlementBranchId || 1);
  const [branchReportGroup, setBranchReportGroup] = useState<"day" | "weekday" | "month" | "year">("day");
  const { data: summary, isLoading, error } = trpc.pos.ownerSalesReport.useQuery(
    { branchId, startDate: dateRange.startDate, endDate: dateRange.endDate },
    { enabled: true }
  );
  const { data: settlement } = trpc.pos.settlementSummary.useQuery({ branchId: selectedSettlementBranch, date: dateRange.startDate }, { enabled: Boolean(selectedSettlementBranch) });
  const { data: branchReport = [], isLoading: branchReportLoading } = trpc.pos.branchPeriodReport.useQuery({ startDate: dateRange.startDate, endDate: dateRange.endDate, group: branchReportGroup });
  const trendRange = useMemo(() => { const now = new Date(); return { startDate: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10), group: "month" as const }; }, []);
  const { data: monthlyTrend = [], isLoading: monthlyTrendLoading } = trpc.pos.branchPeriodReport.useQuery(trendRange);
  const [countedCash, setCountedCash] = useState("");
  const [countedCard, setCountedCard] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");
  const saveSettlementMutation = trpc.pos.saveSettlement.useMutation({ onSuccess: (data) => toast.success(`Settlement saved · discrepancy AUD ${data.discrepancy.toFixed(2)}`), onError: (e) => toast.error(e.message) });
  const setReportPeriod = (period: "day" | "month" | "year") => { const now = new Date(); const end = now.toISOString().slice(0, 10); const start = period === "day" ? end : period === "month" ? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10) : new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10); setDateRange({ startDate: start, endDate: end }); };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-neutral-400">Owner report</p>
          <h2 className="text-sm font-medium text-neutral-700">Sales drill-down</h2>
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="Settlement branch" value={selectedSettlementBranch} onChange={(e) => setSelectedSettlementBranch(Number(e.target.value))} className="px-2 py-1 text-xs border border-neutral-200 rounded">
            {SETTLEMENT_BRANCHES.map((branch) => <option key={branch.id} value={branch.id}>{branch.name} settlement</option>)}
          </select>
          <input aria-label="Sales start date" type="date" value={dateRange.startDate} onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })} className="px-2 py-1 text-xs border border-neutral-200 rounded" />
          <span className="text-xs text-neutral-400">to</span>
          <input aria-label="Sales end date" type="date" value={dateRange.endDate} onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })} className="px-2 py-1 text-xs border border-neutral-200 rounded" />
          <button disabled={!summary} onClick={() => summary && downloadReport("queen-bb-sales", summary)} className="px-2 py-1 text-[10px] border border-neutral-200 rounded disabled:opacity-40">CSV / Excel</button>
          <button onClick={() => { setBranchReportGroup("day"); setReportPeriod("day"); }} className="px-2 py-1 text-[10px] border border-neutral-200 rounded">Day</button><button onClick={() => { setBranchReportGroup("weekday"); setReportPeriod("month"); }} className="px-2 py-1 text-[10px] border border-neutral-200 rounded">Weekday</button><button onClick={() => { setBranchReportGroup("month"); setReportPeriod("month"); }} className="px-2 py-1 text-[10px] border border-neutral-200 rounded">Month</button><button onClick={() => { setBranchReportGroup("year"); setReportPeriod("year"); }} className="px-2 py-1 text-[10px] border border-neutral-200 rounded">Year</button>
        </div>
      </div>
      {isLoading && <p className="text-sm text-neutral-400">Loading sales...</p>}
      {error && <p className="text-sm text-red-500">Owner report unavailable.</p>}
      {summary && !error && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ReportCard label="Total sales" value={`$${summary.totalSales.toFixed(2)}`} />
            <ReportCard label="Paid orders" value={String(summary.orderCount)} />
            <ReportCard label="Average order" value={`$${summary.avgOrder.toFixed(2)}`} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ReportCard label="Cash sales" value={`$${summary.paymentBreakdown.cash.toFixed(2)}`} />
            <ReportCard label="Card / Zeller sales" value={`$${summary.paymentBreakdown.card.toFixed(2)}`} />
            <ReportCard label="Zeller fee · 0.6%" value={`-$${summary.zellerFee.toFixed(2)}`} />
            <ReportCard label="After Zeller fee" value={`$${(summary.totalSales - summary.zellerFee).toFixed(2)}`} />
          </div>
          <div className="bg-white border border-neutral-200 rounded-lg p-4"><div className="flex items-center justify-between gap-3 mb-3"><div><p className="text-[10px] uppercase tracking-wider text-neutral-400">All branches</p><h3 className="text-xs font-medium text-neutral-700">{branchReportGroup === "weekday" ? "Weekday" : branchReportGroup[0].toUpperCase() + branchReportGroup.slice(1)} sales & Zeller fee</h3></div><p className="text-[10px] text-neutral-400">0.6% of card sales</p></div>{branchReportLoading ? <p className="text-xs text-neutral-400">Loading branch report...</p> : <ReportTable title="" columns={["Branch", "Period", "Orders", "Sales", "Card", "Zeller fee", "After fee"]} rows={branchReport.map((row: any) => [row.branchName, row.period, String(row.orderCount), `$${row.totalSales.toFixed(2)}`, `$${row.cardSales.toFixed(2)}`, `-$${row.zellerFee.toFixed(2)}`, `$${row.afterZellerFee.toFixed(2)}`])} emptyLabel="No paid POS sales for this period." />}</div>
          {(branchReportGroup === "month" || branchReportGroup === "year") && <BranchComparisonChart rows={branchReport} periodLabel={branchReportGroup === "month" ? "Monthly" : "Annual"} />}
          {(branchReportGroup === "month" || branchReportGroup === "year") && <BranchMonthlyTrendChart rows={monthlyTrend} isLoading={monthlyTrendLoading} />}
          {settlement && <div className="bg-[#fffaf2] border border-[#d9c8b6] rounded-lg p-4 space-y-3"><div><p className="text-[10px] uppercase tracking-wider text-neutral-400">Daily settlement · {settlement.date} · {SETTLEMENT_BRANCHES.find((branch) => branch.id === selectedSettlementBranch)?.name}</p><p className="text-xs text-neutral-600 mt-1">Enter the counted cash and the Zeller/card terminal total for the selected branch. Hawthorn, Windsor, and CBD are reconciled separately.</p></div><div className="grid grid-cols-2 gap-3"><label className="text-[10px] text-neutral-500">Counted cash (AUD)<input type="number" min="0" step="0.01" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} placeholder={settlement.expectedCash.toFixed(2)} className="mt-1 w-full border border-neutral-200 rounded px-2 py-2 text-xs" /></label><label className="text-[10px] text-neutral-500">Card/Zeller total (AUD)<input type="number" min="0" step="0.01" value={countedCard} onChange={(e) => setCountedCard(e.target.value)} placeholder={settlement.expectedCard.toFixed(2)} className="mt-1 w-full border border-neutral-200 rounded px-2 py-2 text-xs" /></label></div><input value={settlementNotes} onChange={(e) => setSettlementNotes(e.target.value)} placeholder="Settlement notes (optional)" className="w-full border border-neutral-200 rounded px-2 py-2 text-xs" /><div className="flex items-center justify-between gap-3"><p className="text-xs text-neutral-500">Expected cash AUD {settlement.expectedCash.toFixed(2)} · expected card AUD {settlement.expectedCard.toFixed(2)} · fee AUD {settlement.zellerFee.toFixed(2)}</p><button disabled={!selectedSettlementBranch || saveSettlementMutation.isPending || countedCash === "" || countedCard === ""} onClick={() => selectedSettlementBranch && saveSettlementMutation.mutate({ branchId: selectedSettlementBranch, date: settlement.date, countedCash: Number(countedCash), countedCard: Number(countedCard), notes: settlementNotes || undefined })} className="shrink-0 px-3 py-2 bg-neutral-900 text-white rounded text-[10px] disabled:opacity-40">{saveSettlementMutation.isPending ? "SAVING…" : "SAVE SETTLEMENT"}</button></div></div>}
          <ReportTable title="By category" columns={["Category", "Qty", "Revenue"]} rows={summary.categories.map((row: any) => [row.name, `${row.quantity}×`, `$${row.revenue.toFixed(2)}`])} />
          <ReportTable title="By item" columns={["Item", "Category", "Qty", "Revenue"]} rows={summary.items.map((row: any) => [row.name, row.category, `${row.quantity}×`, `$${row.revenue.toFixed(2)}`])} />
          <ReportTable title="By modifier / option" columns={["Item", "Modifier", "Option", "Qty", "Add-on revenue"]} rows={summary.modifiers.map((row: any) => [row.itemName, row.name, row.option, `${row.quantity}×`, `$${row.revenue.toFixed(2)}`])} emptyLabel="No structured modifiers have been recorded yet." />
        </div>
      )}
    </div>
  );
}

function BranchComparisonChart({ rows, periodLabel }: { rows: any[]; periodLabel: string }) {
  const defaultTarget = periodLabel === "Annual" ? 120000 : 10000;
  const [targets, setTargets] = useState<Record<number, { monthlyTarget: number; annualTarget: number }>>({});
  const { data: savedTargets = [] } = trpc.pos.branchSalesTargets.useQuery();
  const saveTargetMutation = trpc.pos.saveBranchSalesTarget.useMutation({
    onSuccess: () => toast.success("Branch target saved across devices"),
    onError: (error) => toast.error(error.message),
  });
  useEffect(() => {
    setTargets(Object.fromEntries(savedTargets.map((target: any) => [target.branchId, {
      monthlyTarget: target.monthlyTarget,
      annualTarget: target.annualTarget,
    }])));
  }, [savedTargets]);
  const byBranch = new Map<string, { branchId: number; sales: number; fee: number }>();
  for (const row of rows) {
    const current = byBranch.get(row.branchName) || { branchId: Number(row.branchId), sales: 0, fee: 0 };
    current.sales += Number(row.totalSales || 0);
    current.fee += Number(row.zellerFee || 0);
    byBranch.set(row.branchName, current);
  }
  const values = Array.from(byBranch.entries());
  const maxSales = Math.max(...values.map(([, value]) => value.sales), 1);
  const maxFee = Math.max(...values.map(([, value]) => value.fee), 0.01);
  return <div className="bg-[#fffaf2] border border-[#d9c8b6] rounded-lg p-4">
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div><p className="text-[10px] uppercase tracking-wider text-neutral-400">Visual comparison</p><h3 className="text-xs font-medium text-neutral-700">{periodLabel} branch performance</h3><p className="text-[10px] text-neutral-400 mt-1">Targets are saved on the server and shared across devices.</p></div>
      <div className="flex gap-3 text-[10px] text-neutral-500"><span><i className="inline-block w-2 h-2 rounded-full bg-[#5a3a2e] mr-1" />Sales</span><span><i className="inline-block w-2 h-2 rounded-full bg-[#c48d69] mr-1" />Zeller fee</span></div>
    </div>
    {values.length === 0 ? <p className="text-xs text-neutral-400">No paid POS sales for this period.</p> : <div className="space-y-5">{values.map(([branch, value]) => {
      const saved = targets[value.branchId];
      const target = Number(saved?.[periodLabel === "Annual" ? "annualTarget" : "monthlyTarget"] || defaultTarget);
      const attainment = target > 0 ? (value.sales / target) * 100 : 0;
      const color = BRANCH_COLORS[branch] || "#5a3a2e";
      return <div key={branch} className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="font-medium text-neutral-700"><i className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />{branch}</span><span className="text-neutral-500">Sales ${value.sales.toFixed(2)} · Fee ${value.fee.toFixed(2)}</span></div><div className="space-y-1"><div className="h-3 bg-white rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{ width: `${(value.sales / maxSales) * 100}%`, backgroundColor: color }} /></div><div className="h-2 bg-white rounded-full overflow-hidden"><div className="h-full bg-[#c48d69] rounded-full transition-all" style={{ width: `${(value.fee / maxFee) * 100}%` }} /></div></div><div className="flex items-center justify-between gap-2 text-[10px] text-neutral-500"><span>Target attainment <strong style={{ color }}>{attainment.toFixed(1)}%</strong></span><label className="flex items-center gap-1">Target AUD <input aria-label={`${branch} sales target`} type="number" min="0" step="100" value={target} onChange={(e) => setTargets((current) => ({ ...current, [value.branchId]: { ...(current[value.branchId] || { monthlyTarget: defaultTarget, annualTarget: defaultTarget }), ...(periodLabel === "Monthly" ? { monthlyTarget: Number(e.target.value) } : { annualTarget: Number(e.target.value) }) } }))} onBlur={() => { const current = targets[value.branchId] || { monthlyTarget: defaultTarget, annualTarget: defaultTarget }; saveTargetMutation.mutate({ branchId: value.branchId, monthlyTarget: current.monthlyTarget, annualTarget: current.annualTarget }); }} className="w-24 border border-neutral-200 rounded px-1.5 py-1 text-[10px] bg-white" /></label></div></div>;
    })}</div>}
  </div>;
}
function BranchMonthlyTrendChart({ rows, isLoading }: { rows: any[]; isLoading: boolean }) {
  const periods = Array.from(new Set(rows.map((row) => row.period))).sort();
  const branches = Array.from(new Set(rows.map((row) => row.branchName)));
  const width = 640; const height = 230; const left = 42; const right = 16; const top = 18; const bottom = 34;
  const chartWidth = width - left - right; const chartHeight = height - top - bottom;
  const maxValue = Math.max(...rows.map((row) => Number(row.totalSales || 0)), 1);
  const point = (index: number, value: number) => ({ x: left + (periods.length <= 1 ? chartWidth / 2 : (index / (periods.length - 1)) * chartWidth), y: top + chartHeight - (value / maxValue) * chartHeight });
  return <div className="bg-white border border-neutral-200 rounded-lg p-4"><div className="flex flex-wrap items-end justify-between gap-3 mb-3"><div><p className="text-[10px] uppercase tracking-wider text-neutral-400">Trend</p><h3 className="text-xs font-medium text-neutral-700">Monthly sales movement</h3></div><div className="flex flex-wrap gap-3 text-[10px] text-neutral-500">{branches.map((branch) => <span key={branch}><i className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: BRANCH_COLORS[branch] || "#5a3a2e" }} />{branch}</span>)}</div></div>{isLoading ? <p className="text-xs text-neutral-400">Loading monthly trend...</p> : periods.length === 0 ? <p className="text-xs text-neutral-400">No paid POS sales for this year.</p> : <div className="overflow-x-auto"><svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[560px]" role="img" aria-label="Monthly sales trend by branch"><line x1={left} x2={left} y1={top} y2={top + chartHeight} stroke="#d9c8b6" /><line x1={left} x2={width - right} y1={top + chartHeight} y2={top + chartHeight} stroke="#d9c8b6" /><text x="6" y={top + 4} fontSize="9" fill="#9b8a7b">${Math.round(maxValue).toLocaleString()}</text><text x="16" y={top + chartHeight} fontSize="9" fill="#9b8a7b">$0</text>{branches.map((branch) => { const points = periods.map((period, index) => { const row = rows.find((candidate) => candidate.branchName === branch && candidate.period === period); return point(index, Number(row?.totalSales || 0)); }); return <g key={branch}><polyline fill="none" stroke={BRANCH_COLORS[branch] || "#5a3a2e"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points.map((p) => `${p.x},${p.y}`).join(" ")} />{points.map((p, index) => <circle key={`${branch}-${index}`} cx={p.x} cy={p.y} r="3.5" fill="#fffaf2" stroke={BRANCH_COLORS[branch] || "#5a3a2e"} strokeWidth="2" />)}</g>; })}{periods.map((period, index) => { const p = point(index, 0); return <text key={period} x={p.x} y={height - 10} textAnchor="middle" fontSize="9" fill="#806c5d">{period.slice(5) || period}</text>; })}</svg></div>}</div>;
}

function StaffTransactionList() {
  const { data: transactions = [], isLoading, error } = trpc.pos.staffTransactions.useQuery({ limit: 50 });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wider text-neutral-400">Branch transactions</p>
        <h2 className="text-sm font-medium text-neutral-700">Receipts & order history</h2>
        <p className="text-xs text-neutral-400 mt-1">Transaction details are available to staff for receipt lookup. Sales totals are restricted to the owner.</p>
      </div>
      {isLoading && <p className="text-sm text-neutral-400">Loading transactions...</p>}
      {error && <p className="text-sm text-red-500">Unable to load transactions.</p>}
      {!isLoading && !error && transactions.length === 0 && <p className="text-sm text-neutral-400">No transactions yet.</p>}
      <div className="space-y-2">
        {transactions.map((order: any) => {
          const expanded = expandedId === order.id;
          return (
            <div key={order.id} className="bg-white border border-neutral-200 rounded-lg">
              <button onClick={() => setExpandedId(expanded ? null : order.id)} className="w-full flex items-center justify-between gap-3 p-3 text-left">
                <div><p className="text-xs font-medium text-neutral-800">{order.orderNumber}</p><p className="text-[10px] text-neutral-400">{new Date(order.createdAt).toLocaleString("en-AU")} · {order.paymentMethod.toUpperCase()}</p></div>
                <div className="text-right"><p className="text-sm font-semibold text-neutral-800">${parseFloat(order.total).toFixed(2)}</p><p className="text-[10px] text-neutral-400">{expanded ? "Hide receipt" : "View receipt"}</p></div>
              </button>
              {expanded && <div className="border-t border-neutral-100 px-3 py-3 space-y-2"><div className="text-xs text-neutral-600 space-y-1">{order.items.map((item: any) => <div key={item.id} className="flex justify-between gap-3"><span>{item.quantity}× {item.itemName}</span><span>${parseFloat(item.totalPrice).toFixed(2)}</span></div>)}</div>{order.receiptToken ? <ReceiptDeliveryActions token={order.receiptToken} /> : <p className="text-[10px] text-neutral-400">This historical order has no e-receipt link.</p>}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
function ReceiptDeliveryActions({ token }: { token: string }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const mutation = trpc.pos.sendReceipt.useMutation({ onSuccess: (data) => { toast.success(data.smsSent ? "Receipt sent by SMS" : data.emailSent ? "Receipt emailed" : "Receipt link ready"); if (data.smsUrl) window.open(data.smsUrl, "_blank"); }, onError: (e) => toast.error(e.message) });
  return <div className="border-t border-neutral-100 pt-3 space-y-2"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider text-neutral-400">Receipt</span><a href={`/receipt/${token}`} target="_blank" rel="noreferrer" className="text-[10px] underline">Open / download</a></div><div className="grid grid-cols-2 gap-2"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="border border-neutral-200 rounded px-2 py-1.5 text-[10px]" /><input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="Phone" className="border border-neutral-200 rounded px-2 py-1.5 text-[10px]" /></div><button disabled={mutation.isPending || (!email && !phone)} onClick={() => mutation.mutate({ token, email: email || undefined, phone: phone || undefined, origin: window.location.origin })} className="w-full px-3 py-1.5 text-[10px] border border-neutral-200 rounded disabled:opacity-40">{mutation.isPending ? "Sending…" : "Email / share receipt"}</button></div>;
}
function ReportCard({ label, value }: { label: string; value: string }) {
  return <div className="bg-white p-4 rounded-lg border border-neutral-200"><p className="text-[10px] text-neutral-400 uppercase tracking-wider">{label}</p><p className="text-2xl font-bold text-neutral-800 mt-1">{value}</p></div>;
}
function downloadReport(prefix: string, summary: any) {
  const rows: string[][] = [["Section", "Name", "Category", "Quantity", "Revenue", "Modifier", "Option"], ...summary.categories.map((row: any) => ["Category", row.name, "", String(row.quantity), row.revenue.toFixed(2), "", ""]), ...summary.items.map((row: any) => ["Item", row.name, row.category, String(row.quantity), row.revenue.toFixed(2), "", ""]), ...summary.modifiers.map((row: any) => ["Modifier", row.itemName, "", String(row.quantity), row.revenue.toFixed(2), row.name, row.option])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const csvLink = document.createElement("a"); csvLink.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); csvLink.download = `${prefix}.csv`; csvLink.click(); URL.revokeObjectURL(csvLink.href);
  const table = `<table><tr>${rows[0].map((cell) => `<th>${cell}</th>`).join("")}</tr>${rows.slice(1).map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</table>`;
  const xlsLink = document.createElement("a"); xlsLink.href = URL.createObjectURL(new Blob([`<html><head><meta charset="utf-8"></head><body>${table}</body></html>`], { type: "application/vnd.ms-excel" })); xlsLink.download = `${prefix}.xls`; xlsLink.click(); URL.revokeObjectURL(xlsLink.href);
}
function ReportTable({ title, columns, rows, emptyLabel = "No data for this period." }: { title: string; columns: string[]; rows: string[][]; emptyLabel?: string }) {
  return <div className="bg-white rounded-lg border border-neutral-200 p-4"><h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">{title}</h3>{rows.length === 0 ? <p className="text-xs text-neutral-400">{emptyLabel}</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr>{columns.map((column) => <th key={column} className="pb-2 pr-4 text-[10px] uppercase tracking-wider text-neutral-400">{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={`${title}-${rowIndex}`} className="border-t border-neutral-100">{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`} className={`py-2 pr-4 text-xs ${cellIndex === row.length - 1 ? "font-medium text-neutral-800" : "text-neutral-600"}`}>{cell}</td>)}</tr>)}</tbody></table></div>}</div>;
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

// ─── Helper: Customer Points Badge ──────────────────────────────
function CustomerPointsBadge({ customerId }: { customerId: number }) {
  const { data: loyalty } = trpc.loyalty.getByCustomerId.useQuery({ customerId });
  if (!loyalty) return <span className="text-[9px] text-neutral-400">No loyalty history yet</span>;
  const tierColors = { new: "bg-neutral-100 text-neutral-600", regular: "bg-blue-100 text-blue-700", vip: "bg-amber-100 text-amber-700" };
  return (
    <div className="flex items-center gap-1">
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${tierColors[loyalty.tier as keyof typeof tierColors] || tierColors.new}`}>
        {loyalty.tier.toUpperCase()}
      </span>
      <span className="text-[9px] text-neutral-500">{loyalty.totalPoints} pts · {loyalty.totalStamps} stamps</span>
    </div>
  );
}

// ─── Helper: Customer Search Results ────────────────────────────
function CustomerSearchResults({ query, onSelect }: { query: string; onSelect: (c: { id: number; name: string }) => void }) {
  const { data: customers = [] } = trpc.adminCustomers.list.useQuery(
    { search: query, page: 1, limit: 5 },
    { enabled: query.length >= 1 }
  );
  if (query.length < 1) return null;
  if (!customers || (Array.isArray(customers) && customers.length === 0)) {
    return <p className="text-[10px] text-neutral-400 mt-1">No customers found</p>;
  }
  const list = Array.isArray(customers) ? customers : (customers as any).customers || [];
  return (
    <div className="mt-1 max-h-32 overflow-y-auto border border-neutral-100 rounded">
      {list.map((c: any) => (
        <button
          key={c.id}
          onClick={() => onSelect({ id: c.id, name: c.name })}
          className="w-full text-left px-2 py-1.5 hover:bg-amber-50 border-b border-neutral-50 last:border-0"
        >
          <p className="text-xs font-medium text-neutral-800">{c.name}</p>
          <p className="text-[10px] text-neutral-400">{c.phone || c.email || ""}</p>
        </button>
      ))}
    </div>
  );
}
