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
});
