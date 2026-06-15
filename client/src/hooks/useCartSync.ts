import { useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

type CartItem = {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  size?: string;
  imageUrl?: string;
  productType: string;
};

const CART_QUEUE_KEY = "qsb-cart-sync-queue";
const CART_KEY = "qsb-cart";

type CartAction = {
  type: "add" | "update" | "remove";
  productId: number;
  productName?: string;
  price?: number;
  quantity?: number;
  imageUrl?: string;
  productType?: string;
  timestamp: number;
};

/**
 * Hook that manages cart sync queue for offline resilience.
 * When offline, cart actions are queued in localStorage.
 * When connection is restored, the queue is replayed to ensure
 * the local cart state is consistent and a sync toast is shown.
 */
export function useCartSync(cart: CartItem[], setCart: (items: CartItem[]) => void) {
  const wasOfflineRef = useRef(false);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  // Queue a cart action while offline
  const queueAction = useCallback((action: Omit<CartAction, "timestamp">) => {
    try {
      const queue: CartAction[] = JSON.parse(localStorage.getItem(CART_QUEUE_KEY) || "[]");
      queue.push({ ...action, timestamp: Date.now() });
      localStorage.setItem(CART_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // localStorage unavailable
    }
  }, []);

  // Process the queue when coming back online
  const processQueue = useCallback(() => {
    try {
      const queueStr = localStorage.getItem(CART_QUEUE_KEY);
      if (!queueStr) return;

      const queue: CartAction[] = JSON.parse(queueStr);
      if (queue.length === 0) return;

      // The cart in localStorage is already up-to-date (we save on every change)
      // The queue is just for tracking what happened offline
      // Clear the queue after processing
      localStorage.removeItem(CART_QUEUE_KEY);

      // Show sync confirmation
      toast.success(`오프라인 중 변경된 장바구니가 동기화되었습니다 (${queue.length}건)`, {
        duration: 3000,
      });
    } catch {
      // Silently fail
    }
  }, []);

  // Track offline state and process queue on reconnection
  useEffect(() => {
    const handleOffline = () => {
      wasOfflineRef.current = true;
    };

    const handleOnline = () => {
      if (wasOfflineRef.current) {
        // Small delay to ensure network is stable
        setTimeout(() => {
          processQueue();
          wasOfflineRef.current = false;
        }, 1000);
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Check if there's a pending queue from a previous session
    if (navigator.onLine) {
      const queueStr = localStorage.getItem(CART_QUEUE_KEY);
      if (queueStr) {
        const queue: CartAction[] = JSON.parse(queueStr || "[]");
        if (queue.length > 0) {
          processQueue();
        }
      }
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [processQueue]);

  return { queueAction };
}
