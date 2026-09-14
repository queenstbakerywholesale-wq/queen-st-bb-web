export type LoyaltyTier = "new" | "regular" | "vip";

export const STAMP_MILESTONE = 10;

export const TIER_MULTIPLIERS: Record<LoyaltyTier, number> = {
  new: 1,
  regular: 1.5,
  vip: 2,
};

export const TIER_THRESHOLDS = {
  regular: { monthlyVisits: 5, monthlySpent: 200 },
  vip: { monthlyVisits: 10, monthlySpent: 500 },
} as const;

export function calculateTier(monthlyVisits: number, monthlySpent: number): LoyaltyTier {
  if (monthlyVisits >= TIER_THRESHOLDS.vip.monthlyVisits || monthlySpent >= TIER_THRESHOLDS.vip.monthlySpent) {
    return "vip";
  }
  if (monthlyVisits >= TIER_THRESHOLDS.regular.monthlyVisits || monthlySpent >= TIER_THRESHOLDS.regular.monthlySpent) {
    return "regular";
  }
  return "new";
}

export function calculateOrderPoints(orderTotal: number, tier: LoyaltyTier): number {
  return Math.floor(Math.floor(Math.max(0, orderTotal)) * TIER_MULTIPLIERS[tier]);
}

export function getStampProgress(totalStamps: number) {
  const safeTotal = Math.max(0, Math.floor(totalStamps));
  const stampProgress = safeTotal % STAMP_MILESTONE;
  return {
    stampGoal: STAMP_MILESTONE,
    stampProgress,
    stampsUntilMilestone: stampProgress === 0 ? STAMP_MILESTONE : STAMP_MILESTONE - stampProgress,
  };
}

export function isEligibleForStamp(discountType: "none" | "staff" | "influencer") {
  return discountType !== "influencer";
}
