import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Search, X, Eye, Plus } from "lucide-react";
import { toast } from "sonner";

const BOOKING_STATUSES = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"] as const;

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF3E0", text: "#E65100" },
  confirmed: { bg: "#E8F5E9", text: "#2E7D32" },
  preparing: { bg: "#E3F2FD", text: "#1565C0" },
  ready: { bg: "#F3E5F5", text: "#7B1FA2" },
  completed: { bg: "#E8F5E9", text: "#1B5E20" },
  cancelled: { bg: "#FFEBEE", text: "#C62828" },
};

export default function AdminBookings() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.adminBookings.list.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const bookingDetail = trpc.adminBookings.getById.useQuery(
    { id: selectedBooking! },
    { enabled: !!selectedBooking }
  );

  const updateStatus = trpc.adminBookings.updateStatus.useMutation({
    onSuccess: () => {
      utils.adminBookings.list.invalidate();
      if (selectedBooking) utils.adminBookings.getById.invalidate({ id: selectedBooking });
      toast.success("Booking status updated");
    },
  });

  const updateNotes = trpc.adminBookings.updateNotes.useMutation({
    onSuccess: () => toast.success("Notes saved"),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / 20);
  const inputStyle = { fontFamily: "var(--font-body)", backgroundColor: "#fff", borderColor: "#5A3A2E15", color: "#5A3A2E" };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-medium tracking-[0.04em]" style={{ fontFamily: "var(--font-display)", color: "#5A3A2E" }}>
        Cake Bookings
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#5A3A2E50" }} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search bookings..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-md focus:outline-none"
            style={inputStyle}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 text-sm border rounded-md focus:outline-none"
          style={inputStyle}
        >
          <option value="">All Statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Detail Modal */}
      {selectedBooking && bookingDetail.data && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBooking(null)}>
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium tracking-[0.04em]" style={{ fontFamily: "var(--font-display)", color: "#5A3A2E" }}>
                {bookingDetail.data.bookingNumber}
              </h2>
              <button onClick={() => setSelectedBooking(null)}><X className="w-5 h-5" style={{ color: "#5A3A2E" }} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.04em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Customer</p>
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{bookingDetail.data.customerName}</p>
                <p className="text-xs" style={{ color: "#5A3A2E60" }}>{bookingDetail.data.customerPhone}</p>
                {bookingDetail.data.customerEmail && <p className="text-xs" style={{ color: "#5A3A2E60" }}>{bookingDetail.data.customerEmail}</p>}
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.04em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Status</p>
                <select
                  value={bookingDetail.data.status}
                  onChange={(e) => updateStatus.mutate({ id: selectedBooking, status: e.target.value as any })}
                  className="text-sm border rounded px-2 py-1 focus:outline-none"
                  style={inputStyle}
                >
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.04em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Pickup</p>
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>
                  {bookingDetail.data.pickupDate} at {bookingDetail.data.pickupTime}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.04em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Cake</p>
                <p className="text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{bookingDetail.data.productName}</p>
                {bookingDetail.data.size && <p className="text-xs" style={{ color: "#5A3A2E60" }}>Size: {bookingDetail.data.size}</p>}
              </div>
            </div>

            {bookingDetail.data.customMessage && (
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.04em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Custom Message</p>
                <p className="text-sm p-2 rounded" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E", backgroundColor: "#5A3A2E05" }}>
                  {bookingDetail.data.customMessage}
                </p>
              </div>
            )}

            {bookingDetail.data.customRequest && (
              <div className="mb-4">
                <p className="text-[11px] uppercase tracking-[0.04em] mb-1" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Custom Request</p>
                <p className="text-sm p-2 rounded" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E", backgroundColor: "#5A3A2E05" }}>
                  {bookingDetail.data.customRequest}
                </p>
              </div>
            )}

            <div>
              <p className="text-[11px] uppercase tracking-[0.04em] mb-2" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>Admin Notes</p>
              <textarea
                defaultValue={bookingDetail.data.adminNotes ?? ""}
                onBlur={(e) => updateNotes.mutate({ id: selectedBooking, adminNotes: e.target.value })}
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
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Booking #</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Customer</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Cake</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Pickup</th>
                <th className="text-left text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Status</th>
                <th className="text-right text-[11px] uppercase tracking-[0.04em] px-5 py-3 font-medium" style={{ color: "#5A3A2E80" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: "#5A3A2E08" }}>
                    <td colSpan={6} className="px-5 py-3"><div className="h-4 rounded animate-pulse" style={{ backgroundColor: "#5A3A2E08" }} /></td>
                  </tr>
                ))
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((booking) => {
                  const sc = statusColors[booking.status] || statusColors.pending;
                  return (
                    <tr key={booking.id} className="border-t" style={{ borderColor: "#5A3A2E08" }}>
                      <td className="px-5 py-3 text-sm font-medium" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{booking.bookingNumber}</td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{booking.customerName}</td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E" }}>{booking.productName}</td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E80" }}>
                        {booking.pickupDate} {booking.pickupTime}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-full" style={{ fontFamily: "var(--font-body)", backgroundColor: sc.bg, color: sc.text }}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => setSelectedBooking(booking.id)} className="p-1.5 rounded hover:bg-black/5 transition-colors">
                          <Eye className="w-3.5 h-3.5" style={{ color: "#5A3A2E" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm" style={{ fontFamily: "var(--font-body)", color: "#5A3A2E50" }}>
                    No bookings found
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
            <button key={i} onClick={() => setPage(i + 1)} className="w-8 h-8 text-xs rounded-md transition-all" style={{ fontFamily: "var(--font-body)", backgroundColor: page === i + 1 ? "#5A3A2E" : "transparent", color: page === i + 1 ? "#F5F0EB" : "#5A3A2E" }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
