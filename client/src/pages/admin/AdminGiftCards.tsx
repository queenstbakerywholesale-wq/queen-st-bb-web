/**
 * Admin Gift Cards — List, detail, balance deduction, void
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search,
  Gift,
  Eye,
  Minus,
  Ban,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF3E0", text: "#E65100" },
  active: { bg: "#E8F5E9", text: "#2E7D32" },
  depleted: { bg: "#FFEBEE", text: "#C62828" },
  expired: { bg: "#F3E5F5", text: "#6A1B9A" },
  voided: { bg: "#ECEFF1", text: "#546E7A" },
};

export default function AdminGiftCards() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deductAmount, setDeductAmount] = useState("");
  const [deductNote, setDeductNote] = useState("");
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState("");

  const utils = trpc.useUtils();

  const listQuery = trpc.giftCards.adminList.useQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const detailQuery = trpc.giftCards.adminGetById.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const deductMutation = trpc.giftCards.adminDeductBalance.useMutation({
    onSuccess: (data) => {
      toast.success(`Deducted successfully. New balance: $${data.newBalance}`);
      setShowDeductModal(false);
      setDeductAmount("");
      setDeductNote("");
      utils.giftCards.adminGetById.invalidate({ id: selectedId! });
      utils.giftCards.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const voidMutation = trpc.giftCards.adminVoidCard.useMutation({
    onSuccess: () => {
      toast.success("Gift card voided");
      setShowVoidModal(false);
      setVoidReason("");
      utils.giftCards.adminGetById.invalidate({ id: selectedId! });
      utils.giftCards.adminList.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const totalPages = Math.ceil((listQuery.data?.total ?? 0) / 20);

  // Detail View
  if (selectedId && detailQuery.data) {
    const card = detailQuery.data;
    const statusStyle = STATUS_COLORS[card.status] || STATUS_COLORS.pending;

    return (
      <div className="p-6 max-w-4xl">
        <button
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-1 text-sm mb-6 hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-body)", color: "#8B7355" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to list
        </button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Info */}
          <div className="rounded-xl p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8DDD0" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#3A2A1E" }}>
                Gift Card Details
              </h2>
              <span
                className="text-xs uppercase px-2 py-1 rounded-full"
                style={{ fontWeight: 500, backgroundColor: statusStyle.bg, color: statusStyle.text }}
              >
                {card.status}
              </span>
            </div>

            <div className="space-y-3 text-sm" style={{ fontFamily: "var(--font-body)" }}>
              <div className="flex justify-between">
                <span style={{ color: "#8B7355" }}>Code</span>
                <span className="font-mono font-medium" style={{ color: "#3A2A1E" }}>{card.code}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#8B7355" }}>Initial Amount</span>
                <span style={{ color: "#3A2A1E" }}>${card.initialAmount} AUD</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#8B7355" }}>Current Balance</span>
                <span className="text-lg font-medium" style={{ color: "#3A2A1E" }}>${card.currentBalance} AUD</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "#8B7355" }}>Design</span>
                <span className="capitalize" style={{ color: "#3A2A1E" }}>{card.selectedImage}</span>
              </div>
              <div className="border-t pt-3" style={{ borderColor: "#E8DDD0" }}>
                <span style={{ color: "#8B7355" }}>Purchaser</span>
                <p style={{ color: "#3A2A1E" }}>{card.purchaserName}</p>
                <p className="text-xs" style={{ color: "#8B7355" }}>{card.purchaserEmail}</p>
              </div>
              {card.recipientName && (
                <div>
                  <span style={{ color: "#8B7355" }}>Recipient</span>
                  <p style={{ color: "#3A2A1E" }}>{card.recipientName}</p>
                  {card.recipientEmail && <p className="text-xs" style={{ color: "#8B7355" }}>{card.recipientEmail}</p>}
                </div>
              )}
              {card.personalMessage && (
                <div>
                  <span style={{ color: "#8B7355" }}>Message</span>
                  <p className="italic text-xs mt-1" style={{ color: "#5A4A3E" }}>"{card.personalMessage}"</p>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: "#8B7355" }}>Created</span>
                <span style={{ color: "#3A2A1E" }}>{new Date(card.createdAt).toLocaleDateString()}</span>
              </div>
              {card.expiresAt && (
                <div className="flex justify-between">
                  <span style={{ color: "#8B7355" }}>Expires</span>
                  <span style={{ color: "#3A2A1E" }}>{new Date(card.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            {card.status === "active" && (
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowDeductModal(true)}
                  className="flex-1 py-2.5 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    backgroundColor: "#3A2A1E",
                    color: "#FFFFFF",
                  }}
                >
                  <Minus className="w-3.5 h-3.5" /> Deduct Balance
                </button>
                <button
                  onClick={() => setShowVoidModal(true)}
                  className="py-2.5 px-4 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  style={{
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    backgroundColor: "#FFEBEE",
                    color: "#C62828",
                  }}
                >
                  <Ban className="w-3.5 h-3.5" /> Void
                </button>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="rounded-xl p-6" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E8DDD0" }}>
            <h2 className="text-lg mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#3A2A1E" }}>
              Transaction History
            </h2>

            {card.transactions.length === 0 ? (
              <p className="text-sm" style={{ color: "#8B7355" }}>No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {card.transactions.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="flex items-start justify-between py-2 border-b last:border-0"
                    style={{ borderColor: "#F0EDE8" }}
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wider" style={{ fontWeight: 500, color: "#5A4A3E" }}>
                        {tx.type}
                      </p>
                      {tx.note && <p className="text-xs mt-0.5" style={{ color: "#8B7355" }}>{tx.note}</p>}
                      <p className="text-[10px] mt-0.5" style={{ color: "#B0A090" }}>
                        {new Date(tx.createdAt).toLocaleString()} · {tx.performedBy}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-medium"
                        style={{
                          color: tx.type === "redemption" || tx.type === "void" ? "#C62828" : "#2E7D32",
                        }}
                      >
                        {tx.type === "redemption" || tx.type === "void" ? "-" : "+"}${tx.amount}
                      </p>
                      <p className="text-[10px]" style={{ color: "#8B7355" }}>
                        Bal: ${tx.balanceAfter}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deduct Modal */}
        {showDeductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowDeductModal(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#3A2A1E" }}>
                Deduct Balance
              </h3>
              <p className="text-xs mb-3" style={{ color: "#8B7355" }}>
                Current balance: <strong>${card.currentBalance} AUD</strong>
              </p>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={parseFloat(card.currentBalance)}
                placeholder="Amount to deduct ($)"
                value={deductAmount}
                onChange={(e) => setDeductAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm mb-3"
                style={{ borderColor: "#E8DDD0" }}
              />
              <input
                type="text"
                placeholder="Note (optional)"
                value={deductNote}
                onChange={(e) => setDeductNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm mb-4"
                style={{ borderColor: "#E8DDD0" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeductModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-xs uppercase border"
                  style={{ borderColor: "#E8DDD0", color: "#5A4A3E" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const amt = parseFloat(deductAmount);
                    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
                    deductMutation.mutate({
                      id: selectedId!,
                      amount: amt,
                      note: deductNote || undefined,
                    });
                  }}
                  disabled={deductMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg text-xs uppercase"
                  style={{ backgroundColor: "#3A2A1E", color: "#FFFFFF" }}
                >
                  {deductMutation.isPending ? "Processing..." : "Deduct"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Void Modal */}
        {showVoidModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowVoidModal(false)}>
            <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg mb-2" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#C62828" }}>
                Void Gift Card
              </h3>
              <p className="text-xs mb-4" style={{ color: "#8B7355" }}>
                This will permanently deactivate the gift card and set the balance to $0. This action cannot be undone.
              </p>
              <input
                type="text"
                placeholder="Reason (optional)"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border text-sm mb-4"
                style={{ borderColor: "#E8DDD0" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowVoidModal(false)}
                  className="flex-1 py-2.5 rounded-lg text-xs uppercase border"
                  style={{ borderColor: "#E8DDD0", color: "#5A4A3E" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => voidMutation.mutate({ id: selectedId!, reason: voidReason || undefined })}
                  disabled={voidMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg text-xs uppercase"
                  style={{ backgroundColor: "#C62828", color: "#FFFFFF" }}
                >
                  {voidMutation.isPending ? "Voiding..." : "Void Card"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl" style={{ fontFamily: "var(--font-display)", fontWeight: 500, color: "#3A2A1E" }}>
          Gift Cards
        </h1>
        <span className="text-sm" style={{ color: "#8B7355" }}>
          {listQuery.data?.total ?? 0} total
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8B7355" }} />
          <input
            type="text"
            placeholder="Search by code, name, or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm"
            style={{ borderColor: "#E8DDD0", backgroundColor: "#FFFFFF" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-lg border text-sm"
          style={{ borderColor: "#E8DDD0", backgroundColor: "#FFFFFF", color: "#3A2A1E" }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="depleted">Depleted</option>
          <option value="expired">Expired</option>
          <option value="voided">Voided</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E8DDD0" }}>
        <table className="w-full text-sm" style={{ fontFamily: "var(--font-body)" }}>
          <thead>
            <tr style={{ backgroundColor: "#FAF7F2" }}>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: "#8B7355", fontWeight: 500 }}>Code</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: "#8B7355", fontWeight: 500 }}>Amount</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: "#8B7355", fontWeight: 500 }}>Balance</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: "#8B7355", fontWeight: 500 }}>Status</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: "#8B7355", fontWeight: 500 }}>Purchaser</th>
              <th className="text-left px-4 py-3 text-xs uppercase tracking-wider" style={{ color: "#8B7355", fontWeight: 500 }}>Date</th>
              <th className="text-right px-4 py-3 text-xs uppercase tracking-wider" style={{ color: "#8B7355", fontWeight: 500 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="animate-spin w-6 h-6 border-2 border-[#3A2A1E] border-t-transparent rounded-full mx-auto" />
                </td>
              </tr>
            ) : listQuery.data?.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12" style={{ color: "#8B7355" }}>
                  <Gift className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No gift cards found
                </td>
              </tr>
            ) : (
              listQuery.data?.items.map((card: any) => {
                const statusStyle = STATUS_COLORS[card.status] || STATUS_COLORS.pending;
                return (
                  <tr key={card.id} className="border-t hover:bg-[#FAF7F2]/50 transition-colors" style={{ borderColor: "#F0EDE8" }}>
                    <td className="px-4 py-3 font-mono text-xs tracking-wider" style={{ color: "#3A2A1E" }}>{card.code}</td>
                    <td className="px-4 py-3" style={{ color: "#3A2A1E" }}>${card.initialAmount}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: "#3A2A1E" }}>${card.currentBalance}</td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] uppercase px-2 py-0.5 rounded-full"
                        style={{ fontWeight: 500, backgroundColor: statusStyle.bg, color: statusStyle.text }}
                      >
                        {card.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs" style={{ color: "#3A2A1E" }}>{card.purchaserName}</p>
                      <p className="text-[10px]" style={{ color: "#8B7355" }}>{card.purchaserEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#8B7355" }}>
                      {new Date(card.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedId(card.id)}
                        className="p-1.5 rounded-md hover:bg-[#F0EDE8] transition-colors"
                      >
                        <Eye className="w-4 h-4" style={{ color: "#8B7355" }} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border disabled:opacity-30"
            style={{ borderColor: "#E8DDD0" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm" style={{ color: "#5A4A3E" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border disabled:opacity-30"
            style={{ borderColor: "#E8DDD0" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
