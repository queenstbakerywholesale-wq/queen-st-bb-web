import { z } from "zod";
import { eq, sql, like, and, or, count } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { orders, orderItems, shippingTracking, branches } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";

export const adminOrdersRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        status: z.string().optional(),
        paymentStatus: z.string().optional(),
        fulfillmentType: z.enum(["shipping", "pickup"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };

      const offset = (input.page - 1) * input.limit;
      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(orders.orderNumber, `%${input.search}%`),
            like(orders.customerName, `%${input.search}%`),
            like(orders.customerEmail, `%${input.search}%`),
            like(orders.customerPhone, `%${input.search}%`)
          )
        );
      }
      if (input.status) {
        conditions.push(eq(orders.status, input.status as any));
      }
      if (input.paymentStatus) {
        conditions.push(eq(orders.paymentStatus, input.paymentStatus as any));
      }
      if (input.fulfillmentType) {
        conditions.push(eq(orders.fulfillmentType, input.fulfillmentType));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(orders)
        .where(where);

      const items = await db
        .select()
        .from(orders)
        .where(where)
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(input.limit)
        .offset(offset);

      return { items, total: totalResult?.count ?? 0 };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.id));

      if (!order) return null;

      const items = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, input.id));

      const tracking = await db
        .select()
        .from(shippingTracking)
        .where(eq(shippingTracking.orderId, input.id));

      // Resolve branch name for pickup orders
      let pickupBranchName: string | null = null;
      if (order.pickupBranchId) {
        const [branch] = await db
          .select({ name: branches.name, address: branches.address })
          .from(branches)
          .where(eq(branches.id, order.pickupBranchId));
        if (branch) pickupBranchName = branch.name;
      }

      return { ...order, items, tracking: tracking[0] ?? null, pickupBranchName };
    }),

  create: publicProcedure
    .input(
      z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().optional(),
        customerPhone: z.string().optional(),
        customerId: z.number().optional(),
        status: z.enum(["pending", "paid", "preparing", "ready", "shipped", "completed", "cancelled"]).default("pending"),
        paymentStatus: z.enum(["unpaid", "paid", "refunded", "partial"]).default("unpaid"),
        subtotal: z.string(),
        tax: z.string().default("0"),
        total: z.string(),
        fulfillmentType: z.enum(["shipping", "pickup"]).default("pickup"),
        shippingFee: z.string().default("0"),
        shippingAddress: z.string().optional(),
        pickupBranchId: z.number().optional(),
        pickupDate: z.string().optional(),
        pickupTime: z.string().optional(),
        hasCakeItems: z.boolean().default(false),
        adminNotes: z.string().optional(),
        items: z.array(
          z.object({
            productId: z.number().optional(),
            productName: z.string(),
            quantity: z.number().default(1),
            unitPrice: z.string(),
            totalPrice: z.string(),
            size: z.string().optional(),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const orderNumber = `QSB-${Date.now().toString(36).toUpperCase()}`;
      const { items, ...orderData } = input;

      const result = await db.insert(orders).values({
        ...orderData,
        orderNumber,
      });

      const orderId = Number(result[0].insertId);

      if (items.length > 0) {
        await db.insert(orderItems).values(
          items.map((item) => ({
            ...item,
            orderId,
          }))
        );
      }

      return { id: orderId, orderNumber };
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "pending",
          "paid",
          "preparing",
          "ready",
          "shipped",
          "completed",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(orders)
        .set({ status: input.status })
        .where(eq(orders.id, input.id));

      // Notify owner on significant status changes
      if (["ready", "shipped", "cancelled"].includes(input.status)) {
        const [order] = await db.select().from(orders).where(eq(orders.id, input.id)).limit(1);
        if (order) {
          notifyOwner({
            title: `Order #${order.orderNumber} — ${input.status.toUpperCase()}`,
            content: `Order ${order.orderNumber} status changed to ${input.status}.\nCustomer: ${order.customerName}\nFulfillment: ${order.fulfillmentType}`,
          }).catch(() => {});
        }
      }

      return { success: true };
    }),

  updatePaymentStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        paymentStatus: z.enum(["unpaid", "paid", "refunded", "partial"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(orders)
        .set({ paymentStatus: input.paymentStatus })
        .where(eq(orders.id, input.id));
      return { success: true };
    }),

  updateNotes: publicProcedure
    .input(z.object({ id: z.number(), adminNotes: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(orders)
        .set({ adminNotes: input.adminNotes })
        .where(eq(orders.id, input.id));
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(orderItems).where(eq(orderItems.orderId, input.id));
      await db.delete(shippingTracking).where(eq(shippingTracking.orderId, input.id));
      await db.delete(orders).where(eq(orders.id, input.id));
      return { success: true };
    }),
});
