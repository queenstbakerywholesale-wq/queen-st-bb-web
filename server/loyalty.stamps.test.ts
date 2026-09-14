import { describe, expect, it } from "vitest";
import {
  STAMP_MILESTONE,
  calculateOrderPoints,
  calculateTier,
  getStampProgress,
  isEligibleForStamp,
} from "./loyaltyLogic";

describe("Customer loyalty stamp policy", () => {
  it("uses ten visits as the next stamp milestone", () => {
    expect(STAMP_MILESTONE).toBe(10);
    expect(getStampProgress(0)).toEqual({
      stampGoal: 10,
      stampProgress: 0,
      stampsUntilMilestone: 10,
    });
    expect(getStampProgress(7)).toEqual({
      stampGoal: 10,
      stampProgress: 7,
      stampsUntilMilestone: 3,
    });
    expect(getStampProgress(10)).toEqual({
      stampGoal: 10,
      stampProgress: 0,
      stampsUntilMilestone: 10,
    });
  });

  it("calculates tier-adjusted points while keeping one visit as one stamp", () => {
    expect(calculateOrderPoints(24.9, "new")).toBe(24);
    expect(calculateOrderPoints(24.9, "regular")).toBe(36);
    expect(calculateOrderPoints(24.9, "vip")).toBe(48);
  });

  it("promotes tiers from monthly visits or monthly spend", () => {
    expect(calculateTier(4, 199)).toBe("new");
    expect(calculateTier(5, 0)).toBe("regular");
    expect(calculateTier(0, 200)).toBe("regular");
    expect(calculateTier(10, 0)).toBe("vip");
    expect(calculateTier(0, 500)).toBe("vip");
  });

  it("does not award loyalty for fully comped influencer orders", () => {
    expect(isEligibleForStamp("none")).toBe(true);
    expect(isEligibleForStamp("staff")).toBe(true);
    expect(isEligibleForStamp("influencer")).toBe(false);
  });
});
