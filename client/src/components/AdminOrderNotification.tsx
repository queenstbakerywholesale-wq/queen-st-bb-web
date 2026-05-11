import { useEffect, useRef, useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, BellOff, Volume2, VolumeX, X, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

/**
 * Notification sound — short pleasant chime using Web Audio API
 */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.3);

    // Second tone (higher, delayed)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15); // D6
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.5);

    // Third tone (highest, delayed more)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.3); // E6
    gain3.gain.setValueAtTime(0, ctx.currentTime);
    gain3.gain.setValueAtTime(0.25, ctx.currentTime + 0.3);
    gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(ctx.currentTime + 0.3);
    osc3.stop(ctx.currentTime + 0.7);

    // Cleanup
    setTimeout(() => ctx.close(), 1000);
  } catch (e) {
    console.warn("Could not play notification sound:", e);
  }
}

interface NewOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  total: string;
  fulfillmentType: string;
  status: string;
  createdAt: Date | string;
}

export default function AdminOrderNotification() {
  const [, navigate] = useLocation();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("admin_notification_sound");
    return saved !== "false"; // default enabled
  });
  const [notifications, setNotifications] = useState<NewOrder[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const lastCheckRef = useRef<number>(Date.now());
  const seenOrderIdsRef = useRef<Set<number>>(new Set());
  const isFirstCheckRef = useRef(true);

  // Poll for new orders every 20 seconds
  const { data } = trpc.adminOrders.newOrdersCheck.useQuery(
    { since: lastCheckRef.current },
    {
      refetchInterval: 20_000,
      refetchIntervalInBackground: true,
    }
  );

  useEffect(() => {
    if (!data || data.count === 0) return;

    // Filter out already-seen orders
    const trulyNew = data.newOrders.filter(
      (o) => !seenOrderIdsRef.current.has(o.id)
    );

    if (trulyNew.length === 0) return;

    // Mark as seen
    trulyNew.forEach((o) => seenOrderIdsRef.current.add(o.id));

    // Skip sound/popup on first load (existing orders)
    if (isFirstCheckRef.current) {
      isFirstCheckRef.current = false;
      lastCheckRef.current = Date.now();
      return;
    }

    // Add to notifications
    setNotifications((prev) => [...trulyNew, ...prev].slice(0, 50));
    setUnreadCount((prev) => prev + trulyNew.length);

    // Play sound
    if (soundEnabled) {
      playNotificationSound();
    }

    // Browser notification (if permission granted)
    if (Notification.permission === "granted") {
      trulyNew.forEach((order) => {
        new Notification("New Order!", {
          body: `${order.orderNumber} — ${order.customerName}\n$${order.total} AUD (${order.fulfillmentType})`,
          icon: "/favicon.ico",
          tag: `order-${order.id}`,
        });
      });
    }

    // Update last check timestamp
    lastCheckRef.current = Date.now();
  }, [data, soundEnabled]);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("admin_notification_sound", String(next));
      return next;
    });
  }, []);

  // Dismiss single notification
  const dismissNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // View order
  const viewOrder = (orderId: number) => {
    setShowPanel(false);
    setUnreadCount(0);
    navigate(`/admin-angela91/orders?view=${orderId}`);
  };

  // Clear all
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setShowPanel(false);
  };

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowPanel(!showPanel);
            if (!showPanel) setUnreadCount(0);
          }}
          className="relative text-stone-300 hover:text-white hover:bg-stone-700"
        >
          {soundEnabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5 opacity-50" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>

        {/* Notification Panel */}
        {showPanel && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl z-50 max-h-[70vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-700">
              <h3 className="text-sm font-semibold text-stone-100">
                Order Notifications
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-stone-400 hover:text-white hover:bg-stone-700"
                  onClick={toggleSound}
                  title={soundEnabled ? "Mute sound" : "Enable sound"}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-3.5 w-3.5" />
                  ) : (
                    <VolumeX className="h-3.5 w-3.5" />
                  )}
                </Button>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-stone-400 hover:text-white hover:bg-stone-700"
                    onClick={clearAll}
                  >
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-stone-500">
                  <Bell className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No new orders</p>
                  <p className="text-xs mt-1 opacity-60">
                    New orders will appear here
                  </p>
                </div>
              ) : (
                notifications.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-start gap-3 px-4 py-3 border-b border-stone-800 hover:bg-stone-800/50 cursor-pointer transition-colors group"
                    onClick={() => viewOrder(order.id)}
                  >
                    <div className="mt-0.5 p-1.5 rounded-full bg-amber-900/30 text-amber-400 shrink-0">
                      {order.fulfillmentType === "shipping" ? (
                        <Package className="h-4 w-4" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-stone-200 truncate">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-amber-400 font-semibold whitespace-nowrap ml-2">
                          ${order.total}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 truncate mt-0.5">
                        {order.customerName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            order.fulfillmentType === "shipping"
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-green-900/30 text-green-400"
                          }`}
                        >
                          {order.fulfillmentType === "shipping"
                            ? "Shipping"
                            : "Pickup"}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-stone-500 hover:text-stone-300 transition-opacity shrink-0 mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismissNotification(order.id);
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-stone-700">
                <button
                  className="text-xs text-amber-400 hover:text-amber-300 w-full text-center"
                  onClick={() => {
                    setShowPanel(false);
                    navigate("/admin-angela91/orders");
                  }}
                >
                  View all orders →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Toast for New Orders */}
      {notifications.length > 0 && !showPanel && unreadCount > 0 && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-2 fade-in duration-300">
          <div
            className="bg-stone-900 border border-amber-700/50 rounded-lg shadow-2xl p-4 max-w-sm cursor-pointer hover:bg-stone-800 transition-colors"
            onClick={() => {
              setShowPanel(true);
              setUnreadCount(0);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-amber-900/30 text-amber-400 animate-pulse">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-100">
                  {unreadCount === 1
                    ? "New Order!"
                    : `${unreadCount} New Orders!`}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  {notifications[0]?.orderNumber} —{" "}
                  {notifications[0]?.customerName}
                </p>
              </div>
              <button
                className="text-stone-500 hover:text-stone-300 ml-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  setUnreadCount(0);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
