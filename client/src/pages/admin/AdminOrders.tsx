import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Search, X, Eye, Truck, Store, AlertTriangle } from "lucide-react";
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
      {hasCake && !isShipping && (
        <AlertTriangle className="w-2.5 h-2.5 ml-0.5" />
      )}
    </span>
  );
}

export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

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

  const updateStatus = trpc.adminOrders.updateStatus.useMutation({
    onSuccess: () => {
      utils.adminOrders.list.invalidate();
      if (selectedOrder) utils.adminOrders.getById.invalidate({ id: selectedOrder });
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

  const totalPages = Math.ceil((data?.total ?? 0) / 20);

  const inputStyle = { fontFamily: "var(--font-body)", backgroundColor: "#fff", borderColor: "#5A3A2E15", color: "#5A3A2E" };
  const labelStyle = { fontFamily: "var(--font-body)", color: "#5A3A2E80", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.04em", fontWeight: 500 };

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
      {selectedOrder && orderDetail.data && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 500, letterSpacing: "0.01em", color: "#5A3A2E" }}>
                {orderDetail.data.orderNumber}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="cursor-pointer"><X className="w-5 h-5" style={{ color: "#5A3A2E" }} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p style={labelStyle} className="mb-1">Customer</p>
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>{orderDetail.data.customerName}</p>
                {orderDetail.data.customerEmail && <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>{orderDetail.data.customerEmail}</p>}
                {orderDetail.data.customerPhone && <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>{orderDetail.data.customerPhone}</p>}
              </div>
              <div>
                <p style={labelStyle} className="mb-1">Order Status</p>
                <select
                  value={orderDetail.data.status}
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
                  value={orderDetail.data.paymentStatus}
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
                  ${Number(orderDetail.data.total).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Fulfillment Details */}
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: "#5A3A2E06", border: "1px solid #5A3A2E0A" }}>
              <div className="flex items-center gap-3 mb-3">
                <p style={labelStyle} className="mb-0">Fulfillment</p>
                <FulfillmentBadge
                  type={orderDetail.data.fulfillmentType || "pickup"}
                  hasCake={orderDetail.data.hasCakeItems}
                />
              </div>

              {orderDetail.data.fulfillmentType === "shipping" ? (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#00695C" }} />
                    <div>
                      <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>Shipping Address</p>
                      <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E80", whiteSpace: "pre-line" }}>
                        {orderDetail.data.shippingAddress || "Not provided"}
                      </p>
                    </div>
                  </div>
                  {Number(orderDetail.data.shippingFee) > 0 && (
                    <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E80" }}>
                      Shipping fee: <strong style={{ fontWeight: 500, color: "#5A3A2E" }}>${Number(orderDetail.data.shippingFee).toFixed(2)}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Store className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#E65100" }} />
                    <div>
                      <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>Store Pickup</p>
                      {orderDetail.data.pickupBranchId && (
                        <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E80" }}>
                          Branch ID: {orderDetail.data.pickupBranchId}
                        </p>
                      )}
                      {orderDetail.data.pickupDate && (
                        <p className="text-xs" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E80" }}>
                          Date: {orderDetail.data.pickupDate}
                          {orderDetail.data.pickupTime && ` at ${orderDetail.data.pickupTime}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {orderDetail.data.hasCakeItems && (
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
                  <span style={{ color: "#5A3A2E" }}>${Number(orderDetail.data.subtotal).toFixed(2)}</span>
                </div>
                {Number(orderDetail.data.shippingFee) > 0 && (
                  <div className="flex justify-between text-xs" style={{ fontFamily: "var(--font-body)" }}>
                    <span style={{ color: "#5A3A2E80" }}>Shipping</span>
                    <span style={{ color: "#5A3A2E" }}>${Number(orderDetail.data.shippingFee).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1" style={{ fontFamily: "var(--font-body)", fontWeight: 500 }}>
                  <span style={{ color: "#5A3A2E" }}>Total</span>
                  <span style={{ color: "#5A3A2E" }}>${Number(orderDetail.data.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            {orderDetail.data.items && orderDetail.data.items.length > 0 && (
              <div className="mb-6">
                <p style={labelStyle} className="mb-2">Items</p>
                <div className="space-y-2">
                  {orderDetail.data.items.map((item: any) => (
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
                defaultValue={orderDetail.data.adminNotes ?? ""}
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
                    <tr key={order.id} className="border-t" style={{ borderColor: "#5A3A2E08" }}>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 500, color: "#5A3A2E" }}>{order.orderNumber}</td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E" }}>{order.customerName}</td>
                      <td className="px-5 py-3">
                        <FulfillmentBadge
                          type={(order as any).fulfillmentType || "pickup"}
                          hasCake={(order as any).hasCakeItems}
                        />
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", fontWeight: 400, color: "#5A3A2E" }}>${Number(order.total).toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-full" style={{ fontFamily: "var(--font-body)", fontWeight: 500, backgroundColor: sc.bg, color: sc.text }}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-full" style={{ fontFamily: "var(--font-body)", fontWeight: 500, backgroundColor: pc.bg, color: pc.text }}>
                          {order.paymentStatus}
                        </span>
                      </td>
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
