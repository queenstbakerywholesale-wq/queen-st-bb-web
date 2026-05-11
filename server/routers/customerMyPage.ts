import { z } from "zod";
import { eq, sql, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  orders,
  orderItems,
  shippingTracking,
  giftCards,
  giftCardTransactions,
  branches,
} from "../../drizzle/schema";

export const customerMyPageRouter = router({
  /** Get customer's order history (by authenticated user email) */
  myOrders: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };

      const userEmail = ctx.user?.email;
      if (!userEmail) return { items: [], total: 0 };

      const offset = (input.page - 1) * input.limit;

      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.customerEmail, userEmail));

      const items = await db
        .select()
        .from(orders)
        .where(eq(orders.customerEmail, userEmail))
        .orderBy(desc(orders.createdAt))
        .limit(input.limit)
        .offset(offset);

      return { items, total: Number(totalResult?.count ?? 0) };
    }),

  /** Get a specific order detail with items and tracking */
  myOrderDetail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const userEmail = ctx.user?.email;
      if (!userEmail) return null;

      // Ensure the order belongs to this user
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, input.id), eq(orders.customerEmail, userEmail)));

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

      return {
        ...order,
        items,
        tracking: tracking[0] ?? null,
        pickupBranchName,
      };
    }),

  /** Get customer's gift cards (purchased by them or received) */
  myGiftCards: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const userEmail = ctx.user?.email;
    if (!userEmail) return [];

    const cards = await db
      .select()
      .from(giftCards)
      .where(
        sql`(${giftCards.purchaserEmail} = ${userEmail} OR ${giftCards.recipientEmail} = ${userEmail}) AND ${giftCards.status} != 'pending'`
      )
      .orderBy(desc(giftCards.createdAt));

    return cards;
  }),

  /** Get gift card transaction history */
  myGiftCardTransactions: protectedProcedure
    .input(z.object({ giftCardId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const userEmail = ctx.user?.email;
      if (!userEmail) return [];

      // Verify ownership
      const [card] = await db
        .select()
        .from(giftCards)
        .where(
          and(
            eq(giftCards.id, input.giftCardId),
            sql`(${giftCards.purchaserEmail} = ${userEmail} OR ${giftCards.recipientEmail} = ${userEmail})`
          )
        );

      if (!card) return [];

      const transactions = await db
        .select()
        .from(giftCardTransactions)
        .where(eq(giftCardTransactions.giftCardId, input.giftCardId))
        .orderBy(desc(giftCardTransactions.createdAt));

      return transactions;
    }),
});
