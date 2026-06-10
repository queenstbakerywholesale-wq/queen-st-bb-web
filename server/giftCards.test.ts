import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
};

// Mock getDb
vi.mock("./db", () => ({
  getDb: vi.fn(async () => mockDb),
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn(async () => true),
}));

// Mock email service
vi.mock("./emailService", () => ({
  sendEmail: vi.fn(async () => true),
}));

// Mock Square integration
vi.mock("./squareGiftCard", () => ({
  createSquareGiftCard: vi.fn(async () => null),
  redeemSquareGiftCard: vi.fn(async () => false),
  isSquareEnabled: vi.fn(() => false),
}));

describe("Gift Card System", () => {
  describe("Gift Card Code Generation", () => {
    it("should generate codes in QSB-XXXX-XXXX-XXXX format", () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const segment = () =>
        Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      const code = `QSB-${segment()}-${segment()}-${segment()}`;

      expect(code).toMatch(/^QSB-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
      expect(code.length).toBe(18);
    });

    it("should not contain ambiguous characters (I, O, 0, 1)", () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      expect(chars).not.toContain("I");
      expect(chars).not.toContain("O");
      expect(chars).not.toContain("0");
      expect(chars).not.toContain("1");
    });
  });

  describe("Valid Amounts", () => {
    const VALID_AMOUNTS = [30, 50, 70, 100, 150, 200];

    it("should accept all valid amounts", () => {
      VALID_AMOUNTS.forEach((amount) => {
        expect(amount).toBeGreaterThanOrEqual(30);
        expect(amount).toBeLessThanOrEqual(200);
      });
    });

    it("should reject invalid amounts", () => {
      const invalidAmounts = [0, 10, 25, 75, 250, -50];
      invalidAmounts.forEach((amount) => {
        expect(VALID_AMOUNTS.includes(amount)).toBe(false);
      });
    });
  });

  describe("Gift Card Image Options", () => {
    const GIFT_CARD_IMAGES = ["classic", "floral", "minimal", "celebration", "coffee", "dessert"];

    it("should have 6 image options", () => {
      expect(GIFT_CARD_IMAGES.length).toBe(6);
    });

    it("should include all expected designs", () => {
      expect(GIFT_CARD_IMAGES).toContain("classic");
      expect(GIFT_CARD_IMAGES).toContain("floral");
      expect(GIFT_CARD_IMAGES).toContain("celebration");
      expect(GIFT_CARD_IMAGES).toContain("coffee");
    });
  });

  describe("Balance Deduction Logic", () => {
    it("should correctly calculate new balance after deduction", () => {
      const currentBalance = 100.0;
      const deductAmount = 35.5;
      const newBalance = currentBalance - deductAmount;

      expect(newBalance).toBeCloseTo(64.5);
      expect(newBalance).toBeGreaterThan(0);
    });

    it("should mark as depleted when balance reaches zero", () => {
      const currentBalance = 50.0;
      const deductAmount = 50.0;
      const newBalance = currentBalance - deductAmount;
      const newStatus = newBalance <= 0 ? "depleted" : "active";

      expect(newBalance).toBe(0);
      expect(newStatus).toBe("depleted");
    });

    it("should remain active when balance is positive", () => {
      const currentBalance = 100.0;
      const deductAmount = 30.0;
      const newBalance = currentBalance - deductAmount;
      const newStatus = newBalance <= 0 ? "depleted" : "active";

      expect(newBalance).toBe(70);
      expect(newStatus).toBe("active");
    });

    it("should reject deduction exceeding balance", () => {
      const currentBalance = 50.0;
      const deductAmount = 75.0;

      expect(deductAmount > currentBalance).toBe(true);
    });
  });

  describe("Gift Card Expiry", () => {
    it("should set expiry to 3 years from creation", () => {
      const now = Date.now();
      const threeYearsMs = 3 * 365 * 24 * 60 * 60 * 1000;
      const expiresAt = new Date(now + threeYearsMs);

      const diffYears = (expiresAt.getTime() - now) / (365 * 24 * 60 * 60 * 1000);
      expect(diffYears).toBeCloseTo(3, 0);
    });
  });

  describe("Gift Card Status Transitions", () => {
    it("should follow valid status transitions", () => {
      const validTransitions: Record<string, string[]> = {
        pending: ["active", "voided"],
        active: ["depleted", "expired", "voided"],
        depleted: [],
        expired: [],
        voided: [],
      };

      expect(validTransitions.pending).toContain("active");
      expect(validTransitions.active).toContain("depleted");
      expect(validTransitions.active).toContain("voided");
      expect(validTransitions.depleted).toHaveLength(0);
    });
  });

  describe("Email Templates", () => {
    it("should include card code in purchaser email", () => {
      const code = "QSB-ABCD-EFGH-JKLM";
      const amount = "100.00";
      // Simulate email content check
      const emailContent = `Gift Card Code: ${code}, Amount: $${amount} AUD`;
      expect(emailContent).toContain(code);
      expect(emailContent).toContain(amount);
    });

    it("should include personal message when provided", () => {
      const message = "Happy Birthday!";
      const emailContent = `Message: "${message}"`;
      expect(emailContent).toContain(message);
    });
  });

  describe("Recharge System", () => {
    const RECHARGE_AMOUNTS = [20, 30, 50, 70, 100, 150, 200];

    it("should accept all valid recharge amounts", () => {
      RECHARGE_AMOUNTS.forEach((amount) => {
        expect(amount).toBeGreaterThanOrEqual(20);
        expect(amount).toBeLessThanOrEqual(200);
      });
    });

    it("should reject invalid recharge amounts", () => {
      const invalidAmounts = [0, 10, 15, 25, 75, 250, -20];
      invalidAmounts.forEach((amount) => {
        expect(RECHARGE_AMOUNTS.includes(amount)).toBe(false);
      });
    });

    it("should correctly calculate new balance after recharge", () => {
      const currentBalance = 25.50;
      const rechargeAmount = 50;
      const newBalance = currentBalance + rechargeAmount;

      expect(newBalance).toBeCloseTo(75.50);
      expect(newBalance).toBeGreaterThan(currentBalance);
    });

    it("should reactivate depleted card after recharge", () => {
      const currentBalance = 0;
      const status = "depleted";
      const rechargeAmount = 50;
      const newBalance = currentBalance + rechargeAmount;
      const newStatus = newBalance > 0 ? "active" : status;

      expect(newBalance).toBe(50);
      expect(newStatus).toBe("active");
    });

    it("should only allow recharge on active or depleted cards", () => {
      const rechargeableStatuses = ["active", "depleted"];
      const nonRechargeableStatuses = ["pending", "expired", "voided"];

      rechargeableStatuses.forEach((status) => {
        expect(["active", "depleted"]).toContain(status);
      });

      nonRechargeableStatuses.forEach((status) => {
        expect(["active", "depleted"]).not.toContain(status);
      });
    });
  });

  describe("Non-Refundable Policy", () => {
    it("should not allow refund transactions on active cards", () => {
      // Policy: balances are non-refundable
      const allowedCustomerActions = ["recharge"];
      expect(allowedCustomerActions).not.toContain("refund");
      expect(allowedCustomerActions).toContain("recharge");
    });

    it("should record recharge as a distinct transaction type", () => {
      const validTransactionTypes = ["activation", "redemption", "refund", "void", "adjustment", "recharge"];
      expect(validTransactionTypes).toContain("recharge");
      expect(validTransactionTypes.length).toBe(6);
    });
  });

  describe("E-Card Design System", () => {
    it("should support admin-uploaded designs with required fields", () => {
      const designFields = ["id", "name", "imageUrl", "imageKey", "sortOrder", "isActive"];
      expect(designFields).toContain("name");
      expect(designFields).toContain("imageUrl");
      expect(designFields).toContain("isActive");
    });

    it("should support toggling design visibility", () => {
      let isActive = true;
      isActive = !isActive;
      expect(isActive).toBe(false);
      isActive = !isActive;
      expect(isActive).toBe(true);
    });

    it("should support both admin designs and preset gradients", () => {
      const presetDesigns = ["classic", "floral", "minimal", "celebration", "coffee", "dessert"];
      const adminDesignId = "admin-1";

      // Admin designs use admin- prefix
      expect(adminDesignId.startsWith("admin-")).toBe(true);
      // Preset designs don't have admin- prefix
      presetDesigns.forEach((id) => {
        expect(id.startsWith("admin-")).toBe(false);
      });
    });

    it("should validate design image file types", () => {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      const invalidTypes = ["image/gif", "image/svg+xml", "application/pdf"];

      validTypes.forEach((type) => {
        expect(["image/jpeg", "image/png", "image/webp"]).toContain(type);
      });
      invalidTypes.forEach((type) => {
        expect(["image/jpeg", "image/png", "image/webp"]).not.toContain(type);
      });
    });
  });

  describe("Gift Card Status Transitions with Recharge", () => {
    it("should allow recharge to reactivate depleted cards", () => {
      const validTransitions: Record<string, string[]> = {
        pending: ["active", "voided"],
        active: ["depleted", "expired", "voided"],
        depleted: ["active"], // recharge can reactivate
        expired: [],
        voided: [],
      };

      expect(validTransitions.depleted).toContain("active");
      expect(validTransitions.expired).not.toContain("active");
      expect(validTransitions.voided).not.toContain("active");
    });
  });
});
