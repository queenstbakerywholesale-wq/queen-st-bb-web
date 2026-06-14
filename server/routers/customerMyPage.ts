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
  customers,
  customerLoyalty,
  pointsTransactions,
  loyaltyRewards,
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

  // ─── Loyalty Points ─────────────────────────────────────────────
  myLoyalty: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const userEmail = ctx.user?.email;
    if (!userEmail) return null;

    // Find customer by email
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.email, userEmail))
      .limit(1);

    if (!customer) return null;

    const [loyalty] = await db
      .select()
      .from(customerLoyalty)
      .where(eq(customerLoyalty.customerId, customer.id))
      .limit(1);

    if (!loyalty) return { customerId: customer.id, totalPoints: 0, lifetimePoints: 0, tier: "new", birthday: null, birthdayEligible: false };

    // Check birthday eligibility
    let birthdayEligible = false;
    if (loyalty.birthday && !loyalty.birthdayRewardClaimed) {
      const today = new Date();
      const [mm, dd] = loyalty.birthday.split("-").map(Number);
      const birthdayThisYear = new Date(today.getFullYear(), mm - 1, dd);
      const diffDays = Math.floor((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      birthdayEligible = diffDays >= -1 && diffDays <= 7;
    }

    return { ...loyalty, customerId: customer.id, birthdayEligible };
  }),

  myPointsHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const userEmail = ctx.user?.email;
      if (!userEmail) return [];

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, userEmail))
        .limit(1);

      if (!customer) return [];

      return db
        .select()
        .from(pointsTransactions)
        .where(eq(pointsTransactions.customerId, customer.id))
        .orderBy(desc(pointsTransactions.createdAt))
        .limit(input.limit);
    }),

  myRewards: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(loyaltyRewards)
      .where(eq(loyaltyRewards.isActive, true));
  }),

  setBirthday: protectedProcedure
    .input(z.object({ birthday: z.string().regex(/^\d{2}-\d{2}$/, "Format: MM-DD") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userEmail = ctx.user?.email;
      if (!userEmail) throw new Error("Not authenticated");

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, userEmail))
        .limit(1);

      if (!customer) throw new Error("Customer not found");

      const [loyalty] = await db
        .select()
        .from(customerLoyalty)
        .where(eq(customerLoyalty.customerId, customer.id))
        .limit(1);

      if (!loyalty) {
        await db.insert(customerLoyalty).values({
          customerId: customer.id,
          birthday: input.birthday,
        });
      } else {
        await db
          .update(customerLoyalty)
          .set({ birthday: input.birthday })
          .where(eq(customerLoyalty.id, loyalty.id));
      }

      return { success: true };
    }),
});
