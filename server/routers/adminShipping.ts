import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { shippingTracking, orders } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../emailService";

function trackingEmailHtml(order: { orderNumber: string; total: string; customerName: string }, tracking: { courierName?: string | null; trackingNumber?: string | null } | null, type: "shipped" | "delivered") {
  const isShipped = type === "shipped";
  const trackingLink = tracking?.trackingNumber
    ? `https://auspost.com.au/mypost/track/#/details/${encodeURIComponent(tracking.trackingNumber)}`
    : "";
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#FAFAF8;padding:40px 24px;"><div style="text-align:center;margin-bottom:32px;"><h1 style="font-family:Georgia,serif;font-size:24px;color:#5A3A2E;margin:0;letter-spacing:.04em;">QUEEN ST BB</h1><p style="font-size:10px;letter-spacing:.2em;color:#8B7355;margin:8px 0 0;">DESSERT ATELIER</p></div><div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #E8DDD0;"><h2 style="font-family:Georgia,serif;font-size:20px;color:#5A3A2E;margin:0 0 16px;">${isShipped ? "Your order is on its way" : "Your order has been delivered"}</h2><p style="margin:0 0 20px;font-size:14px;color:#5A3A2E;line-height:1.6;">${isShipped ? `Your order <strong>${order.orderNumber}</strong> has been shipped.` : `Your order <strong>${order.orderNumber}</strong> has been delivered.`}</p><div style="background:#F5F0EB;border-radius:8px;padding:16px;margin-bottom:20px;"><p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#8B7355;font-weight:600;">Shipping details</p><p style="margin:0 0 8px;font-size:14px;"><strong>Courier:</strong> ${tracking?.courierName || "Australia Post"}</p>${tracking?.trackingNumber ? `<p style="margin:0 0 14px;font-size:14px;"><strong>Tracking:</strong> ${tracking.trackingNumber}</p>${trackingLink ? `<a href="${trackingLink}" style="display:inline-block;background:#5A3A2E;color:#fff;text-decoration:none;padding:11px 16px;border-radius:6px;font-size:12px;">Track your parcel</a>` : ""}` : `<p style="margin:0;font-size:14px;color:#888;">Tracking information will be updated shortly.</p>`}</div><div style="background:#F5F0EB;border-radius:8px;padding:16px;"><p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#8B7355;font-weight:600;">Order summary</p><p style="margin:0 0 4px;font-size:14px;"><strong>Order:</strong> ${order.orderNumber}</p><p style="margin:0;font-size:14px;"><strong>Total:</strong> $${Number(order.total).toFixed(2)} AUD</p></div></div><p style="text-align:center;margin-top:24px;font-size:12px;color:#8B7355;">Thank you for shopping with Queen St BB</p></div>`;
}

export const adminShippingRouter = router({
  getByOrderId: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [tracking] = await db
        .select()
        .from(shippingTracking)
        .where(eq(shippingTracking.orderId, input.orderId));

      return tracking ?? null;
    }),

  createOrUpdate: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        courierName: z.string().optional(),
        trackingNumber: z.string().optional(),
        status: z.enum([
          "processing",
          "shipped",
          "in_transit",
          "out_for_delivery",
          "delivered",
          "failed",
        ]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [existing] = await db
        .select()
        .from(shippingTracking)
        .where(eq(shippingTracking.orderId, input.orderId));

      if (existing) {
        await db
          .update(shippingTracking)
          .set({
            courierName: input.courierName,
            trackingNumber: input.trackingNumber,
            status: input.status,
            notes: input.notes,
            shippedAt:
              input.status === "shipped" && !existing.shippedAt
                ? new Date()
                : existing.shippedAt,
            deliveredAt:
              input.status === "delivered" ? new Date() : existing.deliveredAt,
          })
          .where(eq(shippingTracking.id, existing.id));
      } else {
        await db.insert(shippingTracking).values({
          orderId: input.orderId,
          courierName: input.courierName,
          trackingNumber: input.trackingNumber,
          status: input.status,
          notes: input.notes,
          shippedAt: input.status === "shipped" ? new Date() : null,
        });
      }

      // Update order status if shipping status changed
      if (input.status === "shipped") {
        await db
          .update(orders)
          .set({ status: "shipped" })
          .where(eq(orders.id, input.orderId));
      } else if (input.status === "delivered") {
        await db
          .update(orders)
          .set({ status: "completed" })
          .where(eq(orders.id, input.orderId));
      }

      // Notify owner on shipping updates
      if (["shipped", "delivered", "failed"].includes(input.status)) {
        const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
        if (order) {
          notifyOwner({
            title: `Shipping Update: Order #${order.orderNumber}`,
            content: `Status: ${input.status.toUpperCase()}${input.courierName ? `\nCourier: ${input.courierName}` : ""}${input.trackingNumber ? `\nTracking: ${input.trackingNumber}` : ""}\nCustomer: ${order.customerName}`,
          }).catch(() => {});
        }
      }

      // Automatically email the customer when shipment or delivery is recorded.
      if (input.status === "shipped" || input.status === "delivered") {
        const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
        if (order?.customerEmail) {
          const [tracking] = await db.select().from(shippingTracking).where(eq(shippingTracking.orderId, input.orderId));
          await sendEmail({
            to: order.customerEmail,
            subject: input.status === "shipped" ? `Your order ${order.orderNumber} has been shipped!` : `Your order ${order.orderNumber} has been delivered!`,
            html: trackingEmailHtml(order, tracking ?? null, input.status),
          });
        }
      }

      return { success: true };
    }),

  sendShippingNotification: publicProcedure
    .input(
      z.object({
        orderId: z.number(),
        type: z.enum(["shipped", "delivered"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw new Error("Order not found");
      if (!order.customerEmail) throw new Error("No customer email on file");

      const [tracking] = await db
        .select()
        .from(shippingTracking)
        .where(eq(shippingTracking.orderId, input.orderId));

      const isShipped = input.type === "shipped";
      const subject = isShipped
        ? `Your order ${order.orderNumber} has been shipped!`
        : `Your order ${order.orderNumber} has been delivered!`;

      const sent = await sendEmail({ to: order.customerEmail, subject, html: trackingEmailHtml(order, tracking ?? null, input.type) });
      return { success: sent };
    }),
});
