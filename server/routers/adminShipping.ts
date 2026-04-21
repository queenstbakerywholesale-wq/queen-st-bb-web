import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { shippingTracking, orders } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

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

      return { success: true };
    }),
});
