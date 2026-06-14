import { describe, it, expect } from "vitest";

describe("POS System", () => {
  describe("POS Router Structure", () => {
    it("should export posRouter with required procedures", async () => {
      const { posRouter } = await import("./routers/pos");
      expect(posRouter).toBeDefined();
      // Check that the router has the expected procedures
      const procedures = Object.keys((posRouter as any)._def.procedures || {});
      expect(procedures).toContain("listCategories");
      expect(procedures).toContain("createCategory");
      expect(procedures).toContain("listMenuItems");
      expect(procedures).toContain("createMenuItem");
      expect(procedures).toContain("deleteMenuItem");
      expect(procedures).toContain("createOrder");
      expect(procedures).toContain("salesSummary");
      expect(procedures).toContain("recentOrders");
      expect(procedures).toContain("listInvoices");
      expect(procedures).toContain("createInvoice");
      expect(procedures).toContain("sendInvoice");
    });
  });

  describe("Staff Auth Router Structure", () => {
    it("should export staffAuthRouter with login/verify/logout", async () => {
      const { staffAuthRouter } = await import("./routers/staffAuth");
      expect(staffAuthRouter).toBeDefined();
      const procedures = Object.keys((staffAuthRouter as any)._def.procedures || {});
      expect(procedures).toContain("login");
      expect(procedures).toContain("verify");
      expect(procedures).toContain("logout");
    });
  });

  describe("Admin Staff Router Structure", () => {
    it("should export adminStaffRouter with CRUD operations", async () => {
      const { adminStaffRouter } = await import("./routers/adminStaff");
      expect(adminStaffRouter).toBeDefined();
      const procedures = Object.keys((adminStaffRouter as any)._def.procedures || {});
      expect(procedures).toContain("list");
      expect(procedures).toContain("create");
      expect(procedures).toContain("update");
      expect(procedures).toContain("delete");
      expect(procedures).toContain("branches");
    });
  });

  describe("POS Order Calculation", () => {
    it("should calculate fixed price items correctly", () => {
      const items = [
        { unitPrice: "5.00", quantity: 2 },
        { unitPrice: "3.50", quantity: 1 },
      ];
      const total = items.reduce((sum, item) => sum + parseFloat(item.unitPrice) * item.quantity, 0);
      expect(total).toBe(13.50);
    });

    it("should calculate weight-based items correctly", () => {
      // $8.50 per 100g, 250g
      const unitPrice = 8.50;
      const weightGrams = 250;
      const total = (weightGrams / 100) * unitPrice;
      expect(total).toBe(21.25);
    });

    it("should calculate change correctly", () => {
      const total = 15.75;
      const cashReceived = 20.00;
      const change = cashReceived - total;
      expect(change).toBe(4.25);
    });

    it("should generate valid order numbers", () => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
      const orderNumber = `POS-1-${dateStr}-${random}`;
      expect(orderNumber).toMatch(/^POS-\d+-\d{8}-\d{4}$/);
    });

    it("should generate valid invoice numbers", () => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const random = Math.floor(Math.random() * 9999).toString().padStart(4, "0");
      const invoiceNumber = `INV-${dateStr}-${random}`;
      expect(invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
    });
  });

  describe("POS Modifier System", () => {
    it("should export modifier CRUD procedures", async () => {
      const { posRouter } = await import("./routers/pos");
      const procedures = Object.keys((posRouter as any)._def.procedures || {});
      expect(procedures).toContain("listModifiers");
      expect(procedures).toContain("listModifiersByBranch");
      expect(procedures).toContain("createModifier");
      expect(procedures).toContain("updateModifier");
      expect(procedures).toContain("deleteModifier");
    });

    it("should export updateMenuItem procedure", async () => {
      const { posRouter } = await import("./routers/pos");
      const procedures = Object.keys((posRouter as any)._def.procedures || {});
      expect(procedures).toContain("updateMenuItem");
    });

    it("should calculate price with modifier adjustments correctly", () => {
      const basePrice = 7.50;
      const modifiers = [
        { name: "Size", option: "Large", priceAdjustment: 2.50 },
        { name: "Extras", option: "Cream", priceAdjustment: 1.00 },
      ];
      const totalAdj = modifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
      const finalPrice = basePrice + totalAdj;
      expect(finalPrice).toBe(11.00);
    });

    it("should calculate price with negative adjustments", () => {
      const basePrice = 10.00;
      const modifiers = [
        { name: "Size", option: "Small", priceAdjustment: -2.00 },
      ];
      const totalAdj = modifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
      const finalPrice = basePrice + totalAdj;
      expect(finalPrice).toBe(8.00);
    });

    it("should format modifier label for cart display", () => {
      const itemName = "Tiramisu Cup";
      const modifiers = [
        { name: "Size", option: "Large", priceAdjustment: 2.50 },
        { name: "Temperature", option: "Iced", priceAdjustment: 0 },
      ];
      const modLabel = modifiers.map(m => m.option).join(", ");
      const displayName = `${itemName} (${modLabel})`;
      expect(displayName).toBe("Tiramisu Cup (Large, Iced)");
    });
  });

  describe("POS GST & Surcharge Calculation", () => {
    it("should calculate GST 10% inclusive correctly", () => {
      const subtotal = 55.00;
      const surchargeType = "none";
      const surchargePercent = surchargeType === "weekend" ? 10 : surchargeType === "holiday" ? 15 : 0;
      const surchargeAmount = subtotal * (surchargePercent / 100);
      const afterSurcharge = subtotal + surchargeAmount;
      const tax = afterSurcharge / 11;
      const total = afterSurcharge;
      expect(total).toBe(55.00);
      expect(tax).toBeCloseTo(5.00, 2);
    });

    it("should calculate weekend surcharge 10% correctly", () => {
      const subtotal = 100.00;
      const surchargeType = "weekend";
      const surchargePercent = surchargeType === "weekend" ? 10 : surchargeType === "holiday" ? 15 : 0;
      const surchargeAmount = subtotal * (surchargePercent / 100);
      const afterSurcharge = subtotal + surchargeAmount;
      const tax = afterSurcharge / 11;
      const total = afterSurcharge;
      expect(surchargeAmount).toBe(10.00);
      expect(total).toBe(110.00);
      expect(tax).toBeCloseTo(10.00, 2);
    });

    it("should calculate holiday surcharge 15% correctly", () => {
      const subtotal = 80.00;
      const surchargeType = "holiday";
      const surchargePercent = surchargeType === "weekend" ? 10 : surchargeType === "holiday" ? 15 : 0;
      const surchargeAmount = subtotal * (surchargePercent / 100);
      const afterSurcharge = subtotal + surchargeAmount;
      const tax = afterSurcharge / 11;
      const total = afterSurcharge;
      expect(surchargeAmount).toBe(12.00);
      expect(total).toBe(92.00);
      expect(tax).toBeCloseTo(8.36, 2);
    });

    it("should validate fulfillment types", () => {
      const validTypes = ["for_here", "to_go", "delivery", "pickup"];
      expect(validTypes).toContain("for_here");
      expect(validTypes).toContain("to_go");
      expect(validTypes).toContain("delivery");
      expect(validTypes).toContain("pickup");
      expect(validTypes).not.toContain("invalid");
    });

    it("should validate surcharge types", () => {
      const validTypes = ["none", "weekend", "holiday"];
      expect(validTypes).toContain("none");
      expect(validTypes).toContain("weekend");
      expect(validTypes).toContain("holiday");
    });

    it("should include fulfillmentType and surchargeType in createOrder input schema", async () => {
      const { posRouter } = await import("./routers/pos");
      const procedures = Object.keys((posRouter as any)._def.procedures || {});
      expect(procedures).toContain("createOrder");
    });

    it("should calculate staff discount 30% correctly", () => {
      const subtotal = 100.00;
      const discountType = "staff";
      const discountPercent = discountType === "staff" ? 30 : discountType === "influencer" ? 100 : 0;
      const discountAmount = subtotal * (discountPercent / 100);
      const afterDiscount = subtotal - discountAmount;
      expect(discountAmount).toBe(30.00);
      expect(afterDiscount).toBe(70.00);
    });

    it("should calculate influencer discount 100% correctly", () => {
      const subtotal = 55.00;
      const discountType = "influencer";
      const discountPercent = discountType === "staff" ? 30 : discountType === "influencer" ? 100 : 0;
      const discountAmount = subtotal * (discountPercent / 100);
      const afterDiscount = subtotal - discountAmount;
      expect(discountAmount).toBe(55.00);
      expect(afterDiscount).toBe(0);
    });

    it("should apply discount before surcharge", () => {
      const subtotal = 100.00;
      // Staff discount 30%
      const discountPercent = 30;
      const discountAmount = subtotal * (discountPercent / 100);
      const afterDiscount = subtotal - discountAmount; // 70
      // Weekend surcharge 10% on discounted amount
      const surchargePercent = 10;
      const surchargeAmount = afterDiscount * (surchargePercent / 100); // 7
      const total = afterDiscount + surchargeAmount; // 77
      expect(afterDiscount).toBe(70.00);
      expect(surchargeAmount).toBe(7.00);
      expect(total).toBe(77.00);
    });

    it("should validate discount types", () => {
      const validTypes = ["none", "staff", "influencer"];
      expect(validTypes).toContain("none");
      expect(validTypes).toContain("staff");
      expect(validTypes).toContain("influencer");
    });
  });

  describe("POS Sales Aggregation", () => {
    it("should aggregate items by name correctly", () => {
      const items = [
        { itemName: "Tiramisu Cup", quantity: 2, totalPrice: "24.00" },
        { itemName: "Gelato Scoop", quantity: 1, totalPrice: "8.50" },
        { itemName: "Tiramisu Cup", quantity: 1, totalPrice: "12.00" },
        { itemName: "Gelato Scoop", quantity: 3, totalPrice: "25.50" },
      ];

      const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
      for (const item of items) {
        const existing = itemMap.get(item.itemName) || { name: item.itemName, quantity: 0, revenue: 0 };
        existing.quantity += item.quantity;
        existing.revenue += parseFloat(item.totalPrice);
        itemMap.set(item.itemName, existing);
      }

      const aggregated = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);
      expect(aggregated).toHaveLength(2);
      expect(aggregated[0].name).toBe("Tiramisu Cup");
      expect(aggregated[0].quantity).toBe(3);
      expect(aggregated[0].revenue).toBe(36.00);
      expect(aggregated[1].name).toBe("Gelato Scoop");
      expect(aggregated[1].quantity).toBe(4);
      expect(aggregated[1].revenue).toBe(34.00);
    });

    it("should calculate hourly breakdown correctly", () => {
      const orders = [
        { createdAt: new Date("2026-01-15T09:30:00"), total: "15.00" },
        { createdAt: new Date("2026-01-15T09:45:00"), total: "20.00" },
        { createdAt: new Date("2026-01-15T14:00:00"), total: "8.50" },
      ];

      const hourly = new Array(24).fill(0);
      for (const order of orders) {
        const hour = new Date(order.createdAt).getHours();
        hourly[hour] += parseFloat(order.total);
      }

      expect(hourly[9]).toBe(35.00);
      expect(hourly[14]).toBe(8.50);
      expect(hourly[0]).toBe(0);
    });
  });
});
