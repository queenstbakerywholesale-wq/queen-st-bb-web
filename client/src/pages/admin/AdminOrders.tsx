import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import {
  Search, X, Eye, Truck, Store, AlertTriangle,
  Package, CheckCircle, Send, ChevronRight, Mail,
} from "lucide-react";
import { toast } from "sonner";

const ORDER_STATUSES = ["pending", "paid", "preparing", "ready", "shipped", "completed", "cancelled"] as const;
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded", "partial"] as const;

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF3E0", text: "#E65100" },
  paid: { bg: "#E8F5E9", text: "#2E7D32" },
  preparing: { bg: "#E3F2FD", text: "#1565C0" },
  ready: { bg: "#F3E5F5", text: "#7B1FA2" },
  shipped: { bg: "#E0F2F1", text: "#00695C" },
  completed: { bg: "#E8F5E9", text: "#1B5E20" },
  cancelled: { bg: "#FFEBEE", text: "#C62828" },
  unpaid: { bg: "#FFF3E0", text: "#E65100" },
  refunded: { bg: "#FFEBEE", text: "#C62828" },
  partial: { bg: "#FFF8E1", text: "#F57F17" },
};

function FulfillmentBadge({ type, hasCake }: { type: string; hasCake?: boolean }) {
  const isShipping = type === "shipping";
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        backgroundColor: isShipping ? "#E0F2F1" : "#FFF3E0",
        color: isShipping ? "#00695C" : "#E65100",
      }}
    >
      {isShipping ? <Truck className="w-3 h-3" /> : <Store className="w-3 h-3" />}
      {isShipping ? "Shipping" : "Pickup"}
      {hasCake && !isShipping && <AlertTriangle className="w-2.5 h-2.5 ml-0.5" />}
    </span>
  );
}

function StatusBadge({ status, type }: { status: string; type: "order" | "payment" }) {
  const sc = statusColors[status] || statusColors.pending;
  return (
    <span
      className="text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-full"
      style={{ fontFamily: "var(--font-body)", fontWeight: 500, backgroundColor: sc.bg, color: sc.text }}
    >
      {status}
    </span>
  );
}

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    courierName: "Australia Post",
    trackingNumber: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.adminOrders.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const orderDetail = trpc.adminOrders.getById.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder }
  );

  const trackingData = trpc.adminShipping.getByOrderId.useQuery(
    { orderId: selectedOrder! },
    { enabled: !!selectedOrder }
  );

  const updateStatus = trpc.adminOrders.updateStatus.useMutation({
    onSuccess: () => {
      utils.adminOrders.list.invalidate();
      if (selectedOrder) {
        utils.adminOrders.getById.invalidate({ id: selectedOrder });
        utils.adminShipping.getByOrderId.invalidate({ orderId: selectedOrder });
      }
      toast.success("Order status updated");
    },
  });

  const updatePayment = trpc.adminOrders.updatePaymentStatus.useMutation({
    onSuccess: () => {
      utils.adminOrders.list.invalidate();
      if (selectedOrder) utils.adminOrders.getById.invalidate({ id: selectedOrder });
      toast.success("Payment status updated");
    },
  });

  const updateNotes = trpc.adminOrders.updateNotes.useMutation({
    onSuccess: () => toast.success("Notes saved"),
  });

  const updateShipping = trpc.adminShipping.createOrUpdate.useMutation({
    onSuccess: () => {
      utils.adminShipping.getByOrderId.invalidate();
      utils.adminOrders.list.invalidate();
      if (selectedOrder) utils.adminOrders.getById.invalidate({ id: selectedOrder });
      toast.success("Shipping updated");
      setShowShippingForm(false);
    },
  });

  const sendShippingEmail = trpc.adminShipping.sendShippingNotification.useMutation({
    onSuccess: () => toast.success("Shipping notification email sent to customer"),
    onError: (err) => toast.error(err.message),
  });

  // Populate shipping form when tracking data loads
  useEffect(() => {
    if (trackingData.data) {
      setShippingForm({
        courierName: trackingData.data.courierName || "Australia Post",
        trackingNumber: trackingData.data.trackingNumber || "",
        notes: trackingData.data.notes || "",
      });
    } else {
      setShippingForm({ courierName: "Australia Post", trackingNumber: "", notes: "" });
    }
  }, [trackingData.data]);

  const totalPages = Math.ceil((data?.total ?? 0) / 20);
  const order = orderDetail.data;
  const isShippingOrder = order?.fulfillmentType === "shipping";

  const inputStyle = { fontFamily: "var(--font-body)", backgroundColor: "#fff", borderColor: "#5A3A2E15", color: "#5A3A2E" };
  const labelStyle: React.CSSProperties = { fontFamily: "var(--font-body)", color: "#5A3A2E80", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500 };
  const btnBase = "px-4 py-2 text-[11px] uppercase tracking-[0.04em] rounded-md transition-all cursor-pointer flex items-center gap-1.5";

  /* ─── Quick Actions ─── */
  const handleMarkPreparing = () => {
    if (!selectedOrder) return;
    updateStatus.mutate({ id: selectedOrder, status: "preparing" });
  };
  const handleMarkReady = () => {
    if (!selectedOrder) return;
    updateStatus.mutate({ id: selectedOrder, status: "ready" });
  };
  const handleStartShipping = () => {
    if (!selectedOrder) return;
    setShowShippingForm(true);
  };
  const handleSubmitShipping = () => {
    if (!selectedOrder) return;
    updateShipping.mutate({
      orderId: selectedOrder,
      courierName: shippingForm.courierName,
      trackingNumber: shippingForm.trackingNumber,
      status: "shipped",
      notes: shippingForm.notes,
    });
  };
  const handleMarkDelivered = () => {
    if (!selectedOrder) return;
    updateShipping.mutate({
      orderId: selectedOrder,
      courierName: shippingForm.courierName,
      trackingNumber: shippingForm.trackingNumber,
      status: "delivered",
      notes: shippingForm.notes,
    });
  };
  const handleSendShippingEmail = (type: "shipped" | "delivered") => {
    if (!selectedOrder) return;
    sendShippingEmail.mutate({ orderId: selectedOrder, type });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl" style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.01em", color: "#5A3A2E" }}>
        Orders
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#5A3A2E50" }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
              <X className="w-4 h-4" style={{ color: "#5A3A2E50" }} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm border rounded-md focus:outline-none"
          style={inputStyle}
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && order && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { setSelectedOrder(null); setShowShippingForm(false); }}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.01em", color: "#5A3A2E" }}>
                {order.orderNumber}
              </h2>
              <button onClick={() => { setSelectedOrder(null); setShowShippingForm(false); }} className="cursor-pointer">
                <X className="w-5 h-5" style={{ color: "#5A3A2E" }} />
              </button>
            </div>

            {/* Quick Action Buttons — Goods/Shipping orders only */}
            {isShippingOrder && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "#E0F2F108", border: "1px solid #00695C20" }}>
                <p style={labelStyle} className="mb-3">Quick Actions (Goods Fulfillment)</p>
                <div className="flex flex-wrap gap-2">
                  {order.status === "paid" && (
                    <button onClick={handleMarkPreparing} className={btnBase} style={{ backgroundColor: "#E3F2FD", color: "#1565C0", fontFamily: "var(--font-body)" }}>
                      <Package className="w-3.5 h-3.5" /> Mark Preparing
                    </button>
                  )}
                  {order.status === "preparing" && (
                    <button onClick={handleMarkReady} className={btnBase} style={{ backgroundColor: "#F3E5F5", color: "#7B1FA2", fontFamily: "var(--font-body)" }}>
                      <CheckCircle className="w-3.5 h-3.5" /> Mark Ready to Ship
                    </button>
                  )}
                  {(order.status === "ready" || order.status === "preparing") && !trackingData.data?.trackingNumber && (
                    <button onClick={handleStartShipping} className={btnBase} style={{ backgroundColor: "#E0F2F1", color: "#00695C", fontFamily: "var(--font-body)" }}>
                      <Truck className="w-3.5 h-3.5" /> Start Shipping
                    </button>
                  )}
                  {order.status === "shipped" && (
                    <>
                      <button onClick={handleMarkDelivered} className={btnBase} style={{ backgroundColor: "#E8F5E9", color: "#1B5E20", fontFamily: "var(--font-body)" }}>
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Delivered
                      </button>
                      <button
                        onClick={() => handleSendShippingEmail("shipped")}
                        disabled={sendShippingEmail.isPending}
                        className={btnBase}
                        style={{ backgroundColor: "#FFF3E0", color: "#E65100", fontFamily: "var(--font-body)" }}
                      >
                        <Mail className="w-3.5 h-3.5" /> {sendShippingEmail.isPending ? "Sending..." : "Email Tracking Info"}
                      </button>
                    </>
                  )}
                  {order.status === "completed" && (
                    <button
                      onClick={() => handleSendShippingEmail("delivered")}
                      disabled={sendShippingEmail.isPending}
                      className={btnBase}
                      style={{ backgroundColor: "#E8F5E9", color: "#1B5E20", fontFamily: "var(--font-body)" }}
                    >
                      <Mail className="w-3.5 h-3.5" /> {sendShippingEmail.isPending ? "Sending..." : "Email Delivery Confirmation"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Form (inline) */}
            {showShippingForm && isShippingOrder && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "#F5F0EB", border: "1px solid #E8DDD0" }}>
                <p style={labelStyle} className="mb-3">Shipping Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label style={{ ...labelStyle, fontSize: "10px" }} className="block mb-1">Courier</label>
                    <input
                      value={shippingForm.courierName}
                      onChange={(e) => setShippingForm({ ...shippingForm, courierName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
                      style={inputStyle}
                      placeholder="e.g., Australia Post"
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: "10px" }} className="block mb-1">Tracking Number</label>
                    <input
                      value={shippingForm.trackingNumber}
                      onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
                      style={inputStyle}
                      placeholder="Enter tracking number"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label style={{ ...labelStyle, fontSize: "10px" }} className="block mb-1">Notes</label>
                  <textarea
                    value={shippingForm.notes}
                    onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
                    style={inputStyle}
                    rows={2}
                    placeholder="Optional shipping notes..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitShipping}
                    disabled={updateShipping.isPending}
                    className={btnBase}
                    style={{ backgroundColor: "#5A3A2E", color: "#F5F0EB", fontFamily: "var(--font-body)" }}
                  >
                    <Send className="w-3.5 h-3.5" /> {updateShipping.isPending ? "Saving..." : "Ship & Notify"}
                  </button>
                  <button
                    onClick={() => setShowShippingForm(false)}
                    className={btnBase}
                    style={{ backgroundColor: "transparent", color: "#5A3A2E80", fontFamily: "var(--font-body)", border: "1px solid #5A3A2E15" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Existing tracking info */}
            {trackingData.data && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "#E0F2F108", border: "1px solid #00695C15" }}>
                <p style={labelStyle} className="mb-2">Current Tracking</p>
                <div className="grid grid-cols-2 gap-2 text-sm" style={{ fontFamily: "var(--font-body)" }}>
                  <div>
                    <span style={{ color: "#5A3A2E80" }}>Courier: </span>
                    <span style={{ color: "#5A3A2E", fontWeight: 500 }}>{trackingData.data.courierName || "—"}</span>
                  </div>
                  <div>
                    <span style={{ color: "#5A3A2E80" }}>Tracking #: </span>
                    <span style={{ color: "#5A3A2E", fontWeight: 500 }}>{trackingData.data.trackingNumber || "—"}</span>
                  </div>
                  <div>
                    <span style={{ color: "#5A3A2E80" }}>Status: </span>
                    <span style={{ color: "#00695C", fontWeight: 500 }}>{trackingData.data.status.replace(/_/g, " ")}</span>
                  </div>
                  {trackingData.data.shippedAt && (
                    <div>
                      <span style={{ color: "#5A3A2E80" }}>Shipped: </span>
                      <span style={{ color: "#5A3A2E", fontWeight: 500 }}>{new Date(trackingData.data.shippedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p style={labelStyle} className="mb-1">Customer</p>
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>{order.customerName}</p>
                {order.customerEmail && <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>{order.customerEmail}</p>}
                {order.customerPhone && <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>{order.customerPhone}</p>}
              </div>
              <div>
                <p style={labelStyle} className="mb-1">Order Status</p>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus.mutate({ id: selectedOrder, status: e.target.value as any })}
                  className="text-sm border rounded px-2 py-1 focus:outline-none"
                  style={inputStyle}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <p style={labelStyle} className="mb-1">Payment</p>
                <select
                  value={order.paymentStatus}
                  onChange={(e) => updatePayment.mutate({ id: selectedOrder, paymentStatus: e.target.value as any })}
                  className="text-sm border rounded px-2 py-1 focus:outline-none"
                  style={inputStyle}
                >
                  {PAYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <p style={labelStyle} className="mb-1">Total</p>
                <p className="text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#5A3A2E" }}>
                  ${Number(order.total).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Fulfillment Details */}
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "#5A3A2E06", border: "1px solid #5A3A2E0A" }}>
              <div className="flex items-center gap-3 mb-3">
                <p style={labelStyle} className="mb-0">Fulfillment</p>
                <FulfillmentBadge type={order.fulfillmentType || "pickup"} hasCake={order.hasCakeItems} />
              </div>

              {order.fulfillmentType === "shipping" ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#00695C" }} />
                    <div>
                      <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>Shipping Address</p>
                      <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E80", whiteSpace: "pre-line" }}>
                        {order.shippingAddress || "Not provided"}
                      </p>
                    </div>
                  </div>
                  {Number(order.shippingFee) > 0 && (
                    <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E80" }}>
                      Shipping fee: <strong style={{ fontWeight: 500, color: "#5A3A2E" }}>${Number(order.shippingFee).toFixed(2)}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Store className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#E65100" }} />
                    <div>
                      <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>Store Pickup</p>
                      {(order.pickupBranchName || order.pickupBranchId) && (
                        <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E80" }}>
                          Branch: {order.pickupBranchName || `#${order.pickupBranchId}`}
                        </p>
                      )}
                      {order.pickupDate && (
                        <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E80" }}>
                          Date: {order.pickupDate}
                          {order.pickupTime && ` at ${order.pickupTime}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {order.hasCakeItems && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <AlertTriangle className="w-3 h-3" style={{ color: "#E65100" }} />
                      <p className="text-[10px]" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#E65100" }}>
                        Contains cake items — pickup required
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Subtotal breakdown */}
              <div className="mt-3 pt-3 space-y-1" style={{ borderTop: "1px solid #5A3A2E10" }}>
                <div className="flex justify-between text-xs" style={{ fontFamily: "var(--font-body)" }}>
                  <span style={{ color: "#5A3A2E80" }}>Subtotal</span>
                  <span style={{ color: "#5A3A2E" }}>${Number(order.subtotal).toFixed(2)}</span>
                </div>
                {Number(order.shippingFee) > 0 && (
                  <div className="flex justify-between text-xs" style={{ fontFamily: "var(--font-body)" }}>
                    <span style={{ color: "#5A3A2E80" }}>Shipping</span>
                    <span style={{ color: "#5A3A2E" }}>${Number(order.shippingFee).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                  <span style={{ color: "#5A3A2E" }}>Total</span>
                  <span style={{ color: "#5A3A2E" }}>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            {order.items && order.items.length > 0 && (
              <div className="mb-6">
                <p style={labelStyle} className="mb-2">Items</p>
                <div className="space-y-2">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm p-2 rounded" style={{ backgroundColor: "#5A3A2E05", fontFamily: "var(--font-body)", color: "#5A3A2E" }}>
                      <span style={{ fontWeight: 400 }}>{item.productName} x{item.quantity}</span>
                      <span style={{ fontWeight: 500 }}>${Number(item.totalPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <p style={labelStyle} className="mb-2">Admin Notes</p>
              <textarea
                defaultValue={order.adminNotes ?? ""}
                onBlur={(e) => updateNotes.mutate({ id: selectedOrder, adminNotes: e.target.value })}
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
                style={inputStyle}
                rows={3}
                placeholder="Add notes..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: "#5A3A2E05", fontFamily: "var(--font-body)" }}>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Order #</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Customer</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Fulfillment</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Total</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Status</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Payment</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Date</th>
                <th className="text-right text-[11px] uppercase tracking-[0.04em] px-5 py-3" style={{ color: "#5A3A2E80", fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "#5A3A2E08" }}>
                    <td colSpan={8} className="px-5 py-3"><div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#5A3A2E08" }} /></td>
                  </tr>
                ))
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((order) => {
                  const sc = statusColors[order.status] || statusColors.pending;
                  const pc = statusColors[order.paymentStatus] || statusColors.unpaid;
                  return (
                    <tr key={order.id} className="border-t hover:bg-[#5A3A2E03] transition-colors" style={{ borderColor: "#5A3A2E08" }}>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>{order.orderNumber}</td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E" }}>{order.customerName}</td>
                      <td className="px-5 py-3">
                        <FulfillmentBadge type={(order as any).fulfillmentType || "pickup"} hasCake={(order as any).hasCakeItems} />
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E" }}>${Number(order.total).toFixed(2)}</td>
                      <td className="px-5 py-3"><StatusBadge status={order.status} type="order" /></td>
                      <td className="px-5 py-3"><StatusBadge status={order.paymentStatus} type="payment" /></td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E80" }}>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => setSelectedOrder(order.id)} className="p-1.5 rounded hover:bg-black/5 transition-colors cursor-pointer">
                          <Eye className="w-3.5 h-3.5" style={{ color: "#5A3A2E" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E50" }}>
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className="w-8 h-8 text-xs rounded-md transition-all cursor-pointer" style={{ fontFamily: "var(--font-body)", fontWeight: 500, backgroundColor: page === i + 1 ? "#5A3A2E" : "transparent", color: page === i + 1 ? "#F5F0EB" : "#5A3A2E" }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
