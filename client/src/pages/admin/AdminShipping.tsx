import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Search, X, Truck, Package } from "lucide-react";
import { toast } from "sonner";

const SHIPPING_STATUSES = ["processing", "shipped", "in_transit", "out_for_delivery", "delivered", "failed"] as const;

export default function AdminShipping() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.adminOrders.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: "shipped",
  });

  const trackingData = trpc.adminShipping.getByOrderId.useQuery(
    { orderId: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  const updateShipping = trpc.adminShipping.createOrUpdate.useMutation({
    onSuccess: () => {
      utils.adminShipping.getByOrderId.invalidate();
      utils.adminOrders.list.invalidate();
      toast.success("Shipping updated");
    },
  });

  const [shippingForm, setShippingForm] = useState({
    courierName: "",
    trackingNumber: "",
    status: "processing" as typeof SHIPPING_STATUSES[number],
    notes: "",
  });

  const handleSelectOrder = (orderId: number) => {
    setSelectedOrderId(orderId);
    setShippingForm({ courierName: "", trackingNumber: "", status: "processing", notes: "" });
  };

  const handleSaveShipping = () => {
    if (!selectedOrderId) return;
    updateShipping.mutate({ orderId: selectedOrderId, ...shippingForm });
  };

  const inputStyle = { fontFamily: "var(--font-body)", backgroundColor: "#fff", borderColor: "#5A3A2E15", color: "#5A3A2E" };
  const labelStyle = { fontFamily: "var(--font-body)", color: "#5A3A2E80", fontSize: "11px", textTransform: "uppercase" as const, letterSpacing: "0.1em" };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-light tracking-[0.1em]" style={{ fontFamily: "var(--font-display)", color: "#5A3A2E" }}>
        Shipping & Tracking
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders list */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#5A3A2E50" }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search shipped orders..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-md focus:outline-none"
              style={inputStyle}
            />
          </div>

          <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}>
            {isLoading ? (
              <div className="p-8 text-center text-sm animate-pulse" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E50" }}>Loading...</div>
            ) : data?.items && data.items.length > 0 ? (
              <div className="divide-y" style={{ borderColor: "#5A3A2E08" }}>
                {data.items.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order.id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${selectedOrderId === order.id ? "bg-[#5A3A2E08]" : "hover:bg-[#5A3A2E04]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{order.orderNumber}</p>
                        <p className="text-xs" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E60" }}>{order.customerName}</p>
                      </div>
                      <Truck className="w-4 h-4" style={{ color: "#5A3A2E40" }} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E50" }}>
                No shipped orders found
              </div>
            )}
          </div>
        </div>

        {/* Shipping form */}
        <div className="rounded-lg border p-5" style={{ backgroundColor: "#fff", borderColor: "#5A3A2E10" }}>
          {selectedOrderId ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium tracking-[0.05em]" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>
                Shipping Details
              </h3>
              <div>
                <label style={labelStyle} className="block mb-1">Courier Name</label>
                <input
                  value={trackingData.data?.courierName || shippingForm.courierName}
                  onChange={(e) => setShippingForm({ ...shippingForm, courierName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
                  style={inputStyle}
                  placeholder="e.g., Australia Post, DHL"
                />
              </div>
              <div>
                <label style={labelStyle} className="block mb-1">Tracking Number</label>
                <input
                  value={trackingData.data?.trackingNumber || shippingForm.trackingNumber}
                  onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle} className="block mb-1">Status</label>
                <select
                  value={trackingData.data?.status || shippingForm.status}
                  onChange={(e) => setShippingForm({ ...shippingForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
                  style={inputStyle}
                >
                  {SHIPPING_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle} className="block mb-1">Notes</label>
                <textarea
                  value={trackingData.data?.notes || shippingForm.notes}
                  onChange={(e) => setShippingForm({ ...shippingForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none"
                  style={inputStyle}
                  rows={3}
                />
              </div>
              <button
                onClick={handleSaveShipping}
                className="px-5 py-2 text-[11px] uppercase tracking-[0.15em] rounded-md transition-all"
                style={{ backgroundColor: "#5A3A2E", color: "#F5F0EB", fontFamily: "var(--font-body)" }}
              >
                Save Shipping Info
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-10 h-10 mb-3" style={{ color: "#5A3A2E20" }} />
              <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E50" }}>
                Select an order to manage shipping
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
