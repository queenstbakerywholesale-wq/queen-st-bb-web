import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Package,
  Truck,
  ShoppingBag,
  Gift,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Clock,
  CreditCard,
  ExternalLink,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Status badge helper ─── */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    ready: "bg-emerald-100 text-emerald-800",
    shipped: "bg-indigo-100 text-indigo-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
        styles[status] ?? "bg-stone-100 text-stone-600"
      }`}
    >
      {status}
    </span>
  );
}

function GiftCardStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    redeemed: "bg-stone-100 text-stone-600",
    voided: "bg-red-100 text-red-800",
    expired: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
        styles[status] ?? "bg-stone-100 text-stone-600"
      }`}
    >
      {status}
    </span>
  );
}

/* ─── Shipping Progress ─── */
function ShippingProgress({ status }: { status: string }) {
  const steps = ["paid", "preparing", "ready", "shipped", "completed"];
  const currentIdx = steps.indexOf(status);

  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-1 flex-1">
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentIdx ? "bg-[#5A3A2E]" : "bg-stone-200"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Component ─── */
export default function MyPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"orders" | "giftcards">("orders");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedGiftCardId, setSelectedGiftCardId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // Queries
  const ordersQuery = trpc.myPage.myOrders.useQuery(
    { page, limit: 10 },
    { enabled: isAuthenticated && activeTab === "orders" }
  );

  const orderDetailQuery = trpc.myPage.myOrderDetail.useQuery(
    { id: selectedOrderId! },
    { enabled: !!selectedOrderId }
  );

  const giftCardsQuery = trpc.myPage.myGiftCards.useQuery(undefined, {
    enabled: isAuthenticated && activeTab === "giftcards",
  });

  const giftCardTxQuery = trpc.myPage.myGiftCardTransactions.useQuery(
    { giftCardId: selectedGiftCardId! },
    { enabled: !!selectedGiftCardId }
  );

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5A3A2E]" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
        <div className="text-center max-w-md px-6">
          <ShoppingBag className="h-12 w-12 text-[#5A3A2E] mx-auto mb-4 opacity-40" />
          <h1
            className="text-2xl font-light mb-2"
            style={{
              fontFamily: "var(--font-heading, 'Playfair Display', serif)",
              color: "#5A3A2E",
            }}
          >
            My Page
          </h1>
          <p className="text-sm text-stone-500 mb-6">
            Sign in to view your orders and gift cards
          </p>
          <a
            href={getLoginUrl()}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#5A3A2E] text-white text-sm rounded-md hover:bg-[#4A2A1E] transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  /* ─── Order Detail View ─── */
  if (selectedOrderId && orderDetailQuery.data) {
    const order = orderDetailQuery.data;
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedOrderId(null)}
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-[#5A3A2E] mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </button>

          {/* Order Header */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2
                  className="text-xl font-light"
                  style={{
                    fontFamily:
                      "var(--font-heading, 'Playfair Display', serif)",
                    color: "#5A3A2E",
                  }}
                >
                  {order.orderNumber}
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  {new Date(order.createdAt!).toLocaleDateString("en-AU", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            {/* Shipping Progress */}
            {order.fulfillmentType === "shipping" && (
              <div className="mb-4">
                <p className="text-xs text-stone-500 mb-1">Delivery Progress</p>
                <ShippingProgress status={order.status} />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-stone-400">Paid</span>
                  <span className="text-[10px] text-stone-400">Preparing</span>
                  <span className="text-[10px] text-stone-400">Ready</span>
                  <span className="text-[10px] text-stone-400">Shipped</span>
                  <span className="text-[10px] text-stone-400">Delivered</span>
                </div>
              </div>
            )}
          </div>

          {/* Tracking Info */}
          {order.tracking && (
            <div className="bg-white rounded-xl border border-stone-200 p-6 mb-4">
              <h3 className="text-sm font-semibold text-[#5A3A2E] mb-3 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Shipping Tracking
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Courier</span>
                  <span className="font-medium text-stone-800">
                    {order.tracking.courierName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Tracking Number</span>
                  <span className="font-mono text-stone-800">
                    {order.tracking.trackingNumber}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Status</span>
                  <StatusBadge status={order.tracking.status} />
                </div>
                {order.tracking.trackingNumber && (
                  <a
                    href={`https://auspost.com.au/mypost/track/#/details/${order.tracking.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-[#5A3A2E] hover:underline mt-2"
                  >
                    Track Package <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Fulfillment Details */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-4">
            <h3 className="text-sm font-semibold text-[#5A3A2E] mb-3 flex items-center gap-2">
              {order.fulfillmentType === "shipping" ? (
                <Truck className="h-4 w-4" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {order.fulfillmentType === "shipping"
                ? "Shipping Details"
                : "Pickup Details"}
            </h3>
            {order.fulfillmentType === "shipping" ? (
              <p className="text-sm text-stone-600">
                {order.shippingAddress || "—"}
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                {order.pickupBranchName && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Branch</span>
                    <span className="font-medium text-stone-800">
                      {order.pickupBranchName}
                    </span>
                  </div>
                )}
                {order.pickupDate && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Date</span>
                    <span className="font-medium text-stone-800">
                      {order.pickupDate}
                    </span>
                  </div>
                )}
                {order.pickupTime && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Time</span>
                    <span className="font-medium text-stone-800">
                      {order.pickupTime}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-4">
            <h3 className="text-sm font-semibold text-[#5A3A2E] mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Items
            </h3>
            <div className="divide-y divide-stone-100">
              {order.items.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-800">
                      {item.productName}
                    </p>
                    <p className="text-xs text-stone-400">
                      Qty: {item.quantity}
                      {item.size ? ` · ${item.size}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-stone-800">
                    ${item.totalPrice}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h3 className="text-sm font-semibold text-[#5A3A2E] mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">Subtotal</span>
                <span className="text-stone-800">${order.subtotal}</span>
              </div>
              {order.shippingFee && Number(order.shippingFee) > 0 && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Shipping</span>
                  <span className="text-stone-800">${order.shippingFee}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-stone-100">
                <span className="font-semibold text-[#5A3A2E]">Total</span>
                <span className="font-semibold text-[#5A3A2E]">
                  ${order.total} AUD
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Gift Card Transaction View ─── */
  if (selectedGiftCardId) {
    const card = giftCardsQuery.data?.find(
      (c: any) => c.id === selectedGiftCardId
    );
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button
            onClick={() => setSelectedGiftCardId(null)}
            className="flex items-center gap-1 text-sm text-stone-500 hover:text-[#5A3A2E] mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Gift Cards
          </button>

          {card && (
            <div className="bg-white rounded-xl border border-stone-200 p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-mono text-lg text-[#5A3A2E] font-semibold">
                    {card.code}
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    Purchased{" "}
                    {new Date(card.createdAt!).toLocaleDateString("en-AU")}
                  </p>
                </div>
                <GiftCardStatusBadge status={card.status} />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-stone-500">Initial Amount</p>
                  <p className="font-semibold text-stone-800">
                    ${card.initialAmount}
                  </p>
                </div>
                <div>
                  <p className="text-stone-500">Current Balance</p>
                  <p className="font-semibold text-emerald-600 text-lg">
                    ${card.currentBalance}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Transactions */}
          <div className="bg-white rounded-xl border border-stone-200 p-6">
            <h3 className="text-sm font-semibold text-[#5A3A2E] mb-4">
              Transaction History
            </h3>
            {giftCardTxQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
              </div>
            ) : giftCardTxQuery.data?.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">
                No transactions yet
              </p>
            ) : (
              <div className="divide-y divide-stone-100">
                {giftCardTxQuery.data?.map((tx: any) => (
                  <div key={tx.id} className="flex justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-stone-800 capitalize">
                        {tx.type.replace("_", " ")}
                      </p>
                      {tx.note && (
                        <p className="text-xs text-stone-400 mt-0.5">
                          {tx.note}
                        </p>
                      )}
                      <p className="text-xs text-stone-400 mt-0.5">
                        {new Date(tx.createdAt!).toLocaleDateString("en-AU", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        tx.type === "activation" || tx.type === "refund"
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {tx.type === "activation" || tx.type === "refund"
                        ? "+"
                        : "-"}
                      ${tx.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Main View: Tabs ─── */
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-2xl font-light"
            style={{
              fontFamily: "var(--font-heading, 'Playfair Display', serif)",
              color: "#5A3A2E",
            }}
          >
            My Page
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Welcome, {user?.name || user?.email}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-100 rounded-lg p-1">
          <button
            onClick={() => {
              setActiveTab("orders");
              setPage(1);
            }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "orders"
                ? "bg-white text-[#5A3A2E] shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab("giftcards")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === "giftcards"
                ? "bg-white text-[#5A3A2E] shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Gift className="h-4 w-4" />
            Gift Cards
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div>
            {ordersQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
              </div>
            ) : ordersQuery.data?.items.length === 0 ? (
              <div className="text-center py-16">
                <ShoppingBag className="h-10 w-10 text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-500">No orders yet</p>
                <a
                  href="/objects"
                  className="text-sm text-[#5A3A2E] hover:underline mt-2 inline-block"
                >
                  Browse our collection →
                </a>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {ordersQuery.data?.items.map((order: any) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className="bg-white rounded-xl border border-stone-200 p-4 hover:border-[#5A3A2E]/30 hover:shadow-sm cursor-pointer transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-semibold text-[#5A3A2E]">
                              {order.orderNumber}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-xs text-stone-400">
                            {new Date(order.createdAt).toLocaleDateString(
                              "en-AU",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                            {" · "}
                            {order.fulfillmentType === "shipping" ? (
                              <span className="inline-flex items-center gap-0.5">
                                <Truck className="h-3 w-3" /> Shipping
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" /> Pickup
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-stone-800">
                            ${order.total}
                          </span>
                          <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-[#5A3A2E] transition-colors" />
                        </div>
                      </div>
                      {order.fulfillmentType === "shipping" &&
                        ["preparing", "ready", "shipped"].includes(
                          order.status
                        ) && <ShippingProgress status={order.status} />}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {ordersQuery.data && ordersQuery.data.total > 10 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-stone-500">
                      Page {page} of{" "}
                      {Math.ceil(ordersQuery.data.total / 10)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        page >= Math.ceil(ordersQuery.data.total / 10)
                      }
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Gift Cards Tab */}
        {activeTab === "giftcards" && (
          <div>
            {giftCardsQuery.isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
              </div>
            ) : giftCardsQuery.data?.length === 0 ? (
              <div className="text-center py-16">
                <Gift className="h-10 w-10 text-stone-300 mx-auto mb-3" />
                <p className="text-sm text-stone-500">No gift cards yet</p>
                <a
                  href="/gift-cards"
                  className="text-sm text-[#5A3A2E] hover:underline mt-2 inline-block"
                >
                  Purchase a gift card →
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {giftCardsQuery.data?.map((card: any) => (
                  <div
                    key={card.id}
                    onClick={() => setSelectedGiftCardId(card.id)}
                    className="bg-white rounded-xl border border-stone-200 p-4 hover:border-[#5A3A2E]/30 hover:shadow-sm cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-[#5A3A2E]">
                            {card.code}
                          </span>
                          <GiftCardStatusBadge status={card.status} />
                        </div>
                        <p className="text-xs text-stone-400">
                          {new Date(card.createdAt).toLocaleDateString(
                            "en-AU",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                          {" · "}
                          Initial: ${card.initialAmount}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-stone-400">Balance</p>
                          <p
                            className={`text-lg font-semibold ${
                              Number(card.currentBalance) > 0
                                ? "text-emerald-600"
                                : "text-stone-400"
                            }`}
                          >
                            ${card.currentBalance}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-[#5A3A2E] transition-colors" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
