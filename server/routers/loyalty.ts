import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { customerLoyalty, pointsTransactions, loyaltyRewards, customers } from "../../drizzle/schema";

// Tier multipliers for point earning
const TIER_MULTIPLIERS = {
  new: 1,
  regular: 1.5,
  vip: 2,
} as const;

// Tier thresholds
const TIER_THRESHOLDS = {
  regular: { monthlyVisits: 5, monthlySpent: 200 },
  vip: { monthlyVisits: 10, monthlySpent: 500 },
};

/**
 * Calculate tier based on monthly visits and spending
 */
function calculateTier(monthlyVisits: number, monthlySpent: number): "new" | "regular" | "vip" {
  if (monthlyVisits >= TIER_THRESHOLDS.vip.monthlyVisits || monthlySpent >= TIER_THRESHOLDS.vip.monthlySpent) {
    return "vip";
  }
  if (monthlyVisits >= TIER_THRESHOLDS.regular.monthlyVisits || monthlySpent >= TIER_THRESHOLDS.regular.monthlySpent) {
    return "regular";
  }
  return "new";
}

/**
 * Check if today is within birthday week (7 days before to day-of)
 */
function isBirthdayWeek(birthday: string | null): boolean {
  if (!birthday) return false;
  const today = new Date();
  const [mm, dd] = birthday.split("-").map(Number);
  const birthdayThisYear = new Date(today.getFullYear(), mm - 1, dd);
  const diffDays = Math.floor((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= -1 && diffDays <= 7; // birthday day + 7 days before
}

export const loyaltyRouter = router({
  // ─── Get customer loyalty info ──────────────────────────────────
  getByCustomerId: publicProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [loyalty] = await db
        .select()
        .from(customerLoyalty)
        .where(eq(customerLoyalty.customerId, input.customerId))
        .limit(1);

      if (!loyalty) return null;

      // Check birthday eligibility
      const birthdayEligible = isBirthdayWeek(loyalty.birthday) && !loyalty.birthdayRewardClaimed;

      return { ...loyalty, birthdayEligible };
    }),

  // ─── Earn points from a POS order ──────────────────────────────
  earnPoints: publicProcedure
    .input(z.object({
      customerId: z.number(),
      orderTotal: z.number(), // total in dollars
      orderId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get or create loyalty record
      let [loyalty] = await db
        .select()
        .from(customerLoyalty)
        .where(eq(customerLoyalty.customerId, input.customerId))
        .limit(1);

      if (!loyalty) {
        await db.insert(customerLoyalty).values({
          customerId: input.customerId,
        });
        [loyalty] = await db
          .select()
          .from(customerLoyalty)
          .where(eq(customerLoyalty.customerId, input.customerId))
          .limit(1);
      }

      // Calculate points: $1 = 1pt * tier multiplier
      const multiplier = TIER_MULTIPLIERS[loyalty.tier as keyof typeof TIER_MULTIPLIERS] || 1;
      const basePoints = Math.floor(input.orderTotal);
      const earnedPoints = Math.floor(basePoints * multiplier);

      const newTotal = loyalty.totalPoints + earnedPoints;
      const newLifetime = loyalty.lifetimePoints + earnedPoints;
      const newMonthlyVisits = loyalty.monthlyVisits + 1;
      const newMonthlySpent = parseFloat(String(loyalty.monthlySpent)) + input.orderTotal;

      // Recalculate tier
      const newTier = calculateTier(newMonthlyVisits, newMonthlySpent);

      // Update loyalty record
      await db
        .update(customerLoyalty)
        .set({
          totalPoints: newTotal,
          lifetimePoints: newLifetime,
          monthlyVisits: newMonthlyVisits,
          monthlySpent: newMonthlySpent.toFixed(2),
          tier: newTier,
          lastVisitAt: new Date(),
          ...(newTier !== loyalty.tier ? { tierUpdatedAt: new Date() } : {}),
        })
        .where(eq(customerLoyalty.id, loyalty.id));

      // Record transaction
      await db.insert(pointsTransactions).values({
        customerId: input.customerId,
        type: "earn",
        points: earnedPoints,
        description: `Earned from order $${input.orderTotal.toFixed(2)} (${multiplier}x ${loyalty.tier})`,
        orderId: input.orderId,
        balanceAfter: newTotal,
      });

      return {
        earnedPoints,
        totalPoints: newTotal,
        tier: newTier,
        tierUpgraded: newTier !== loyalty.tier,
        multiplier,
      };
    }),

  // ─── Redeem a reward ────────────────────────────────────────────
  redeemReward: publicProcedure
    .input(z.object({
      customerId: z.number(),
      rewardId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get reward
      const [reward] = await db
        .select()
        .from(loyaltyRewards)
        .where(eq(loyaltyRewards.id, input.rewardId))
        .limit(1);

      if (!reward || !reward.isActive) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reward not found" });
      }

      // Get loyalty
      const [loyalty] = await db
        .select()
        .from(customerLoyalty)
        .where(eq(customerLoyalty.customerId, input.customerId))
        .limit(1);

      if (!loyalty) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Customer loyalty not found" });
      }

      // Check tier requirement
      const tierOrder = ["new", "regular", "vip"];
      if (tierOrder.indexOf(loyalty.tier) < tierOrder.indexOf(reward.requiredTier)) {
        throw new TRPCError({ code: "FORBIDDEN", message: `Requires ${reward.requiredTier} tier` });
      }

      // Check points (birthday rewards are free)
      if (reward.pointsCost > 0 && loyalty.totalPoints < reward.pointsCost) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Not enough points" });
      }

      // Handle birthday rewards
      if (reward.pointsCost === 0) {
        if (!isBirthdayWeek(loyalty.birthday)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Birthday reward only available during birthday week" });
        }
        if (loyalty.birthdayRewardClaimed) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Birthday reward already claimed this year" });
        }
        await db
          .update(customerLoyalty)
          .set({ birthdayRewardClaimed: true })
          .where(eq(customerLoyalty.id, loyalty.id));
      }

      const newBalance = loyalty.totalPoints - reward.pointsCost;

      // Deduct points
      await db
        .update(customerLoyalty)
        .set({ totalPoints: newBalance })
        .where(eq(customerLoyalty.id, loyalty.id));

      // Record transaction
      await db.insert(pointsTransactions).values({
        customerId: input.customerId,
        type: reward.pointsCost === 0 ? "birthday" : "redeem",
        points: -reward.pointsCost,
        description: `Redeemed: ${reward.name}`,
        balanceAfter: newBalance,
      });

      return { success: true, rewardName: reward.name, newBalance };
    }),

  // ─── Get points history ─────────────────────────────────────────
  history: publicProcedure
    .input(z.object({ customerId: z.number(), limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(pointsTransactions)
        .where(eq(pointsTransactions.customerId, input.customerId))
        .orderBy(desc(pointsTransactions.createdAt))
        .limit(input.limit);
    }),

  // ─── Get available rewards ──────────────────────────────────────
  rewards: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(loyaltyRewards)
      .where(eq(loyaltyRewards.isActive, true));
  }),

  // ─── Set customer birthday ──────────────────────────────────────
  setBirthday: publicProcedure
    .input(z.object({
      customerId: z.number(),
      birthday: z.string().regex(/^\d{2}-\d{2}$/, "Format: MM-DD"),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [loyalty] = await db
        .select()
        .from(customerLoyalty)
        .where(eq(customerLoyalty.customerId, input.customerId))
        .limit(1);

      if (!loyalty) {
        await db.insert(customerLoyalty).values({
          customerId: input.customerId,
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
