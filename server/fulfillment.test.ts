import { describe, expect, it, vi } from "vitest";
import {
  isPickupOnlyType,
  FIXED_SHIPPING_FEE_AUD,
  PRODUCT_TYPES,
  CAKE_PRODUCT_TYPES,
} from "../shared/const";
import type { TrpcContext } from "./_core/context";

// Mock ENV
vi.mock("./_core/env", () => ({
  ENV: {
    appId: "test",
    cookieSecret: "test-cookie-secret-for-jwt",
    databaseUrl: "",
    oAuthServerUrl: "",
    ownerOpenId: "",
    isProduction: false,
    forgeApiUrl: "",
    forgeApiKey: "",
    adminPassword: "test-secret-123",
    stripeSecretKey: "sk_test_mock",
    stripeWebhookSecret: "",
    stripePublishableKey: "",
  },
}));

// Mock DB
const mockInsert = vi.fn().mockReturnValue({
  values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
});
const mockSelect = vi.fn().mockReturnValue({
  from: vi.fn().mockReturnValue({
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
      orderBy: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
    orderBy: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
    }),
  }),
});

vi.mock("../drizzle/schema", () => ({
  enquiries: { type: "type", name: "name", email: "email", phone: "phone", company: "company", interest: "interest", subject: "subject", message: "message", status: "status", createdAt: "createdAt" },
  orders: { id: "id", status: "status", paymentStatus: "paymentStatus", createdAt: "createdAt", total: "total", orderNumber: "orderNumber", customerName: "customerName" },
  orderItems: {},
  cakeBookings: { pickupDate: "pickupDate", pickupTime: "pickupTime" },
  products: { id: "id", name: "name", stock: "stock", lowStockThreshold: "lowStockThreshold", isActive: "isActive", productType: "productType", category: "category" },
  customers: { id: "id", name: "name", email: "email", phone: "phone", totalOrders: "totalOrders", createdAt: "createdAt" },
  pageImages: { page: "page", section: "section", imageUrl: "imageUrl" },
  branches: { id: "id", name: "name", isActive: "isActive" },
  bookingTimeSlots: { branchId: "branchId", date: "date" },
  shippingTracking: {},
  users: { id: "id", openId: "openId", name: "name", email: "email", loginMethod: "loginMethod", role: "role", createdAt: "createdAt", updatedAt: "updatedAt", lastSignedIn: "lastSignedIn" },
}));

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: mockInsert,
    select: mockSelect,
  }),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// Mock Stripe
vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: "cs_test_123",
            url: "https://checkout.stripe.com/test",
          }),
          retrieve: vi.fn().mockResolvedValue({
            payment_status: "paid",
            metadata: { order_number: "QSB-TEST-001" },
            customer_email: "test@example.com",
          }),
        },
      },
    })),
  };
});

const { appRouter } = await import("./routers");

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
      cookies: {},
    } as unknown as TrpcContext["req"],
    res: {
      cookie: vi.fn(),
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
  return { ctx };
}

// ─── Shared Constants Tests ─────────────────────────────────────────

describe("Fulfillment Constants", () => {
  it("identifies cake as pickup-only type", () => {
    expect(isPickupOnlyType("cake")).toBe(true);
  });

  it("identifies merchandise as NOT pickup-only", () => {
    expect(isPickupOnlyType("merchandise")).toBe(false);
  });

  it("identifies tiramisu as NOT pickup-only", () => {
    expect(isPickupOnlyType("tiramisu")).toBe(false);
  });

  it("identifies gelato as NOT pickup-only", () => {
    expect(isPickupOnlyType("gelato")).toBe(false);
  });

  it("identifies postcards as NOT pickup-only", () => {
    expect(isPickupOnlyType("postcards")).toBe(false);
  });

  it("identifies objects as NOT pickup-only", () => {
    expect(isPickupOnlyType("objects")).toBe(false);
  });

  it("has a positive fixed shipping fee", () => {
    expect(FIXED_SHIPPING_FEE_AUD).toBeGreaterThan(0);
  });

  it("PRODUCT_TYPES includes all expected types", () => {
    expect(PRODUCT_TYPES).toContain("cake");
    expect(PRODUCT_TYPES).toContain("merchandise");
    expect(PRODUCT_TYPES).toContain("tiramisu");
    expect(PRODUCT_TYPES).toContain("gelato");
    expect(PRODUCT_TYPES).toContain("postcards");
    expect(PRODUCT_TYPES).toContain("objects");
  });

  it("CAKE_PRODUCT_TYPES only contains cake", () => {
    expect(CAKE_PRODUCT_TYPES).toEqual(["cake"]);
  });
});

// ─── Checkout Fulfillment Logic Tests ───────────────────────────────

describe("stripeCheckout fulfillment logic", () => {
  it("creates a pickup checkout session for cake items", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createCheckoutSession({
      items: [
        {
          productId: 1,
          productName: "Chocolate Cake",
          price: 45.0,
          quantity: 1,
          productType: "cake",
        },
      ],
      customerName: "Test User",
      customerEmail: "test@example.com",
      fulfillmentType: "pickup",
      pickupBranchId: 1,
      pickupBranchName: "Queen St Branch",
    });

    expect(result.checkoutUrl).toBeTruthy();
    expect(result.fulfillmentType).toBe("pickup");
    expect(result.hasCakeItems).toBe(true);
    expect(result.shippingFee).toBe(0);
  });

  it("forces pickup when cart has cake items even if shipping requested", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createCheckoutSession({
      items: [
        {
          productId: 1,
          productName: "Chocolate Cake",
          price: 45.0,
          quantity: 1,
          productType: "cake",
        },
        {
          productId: 2,
          productName: "Espresso Cup",
          price: 18.0,
          quantity: 1,
          productType: "merchandise",
        },
      ],
      customerName: "Test User",
      customerEmail: "test@example.com",
      fulfillmentType: "shipping", // Requesting shipping, but cart has cake
      shippingAddress: "123 Test St, Sydney NSW 2000",
    });

    // Should be forced to pickup because of cake
    expect(result.fulfillmentType).toBe("pickup");
    expect(result.hasCakeItems).toBe(true);
    expect(result.shippingFee).toBe(0);
  });

  it("allows shipping for non-cake items with shipping fee", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createCheckoutSession({
      items: [
        {
          productId: 2,
          productName: "Espresso Cup",
          price: 18.0,
          quantity: 2,
          productType: "merchandise",
        },
      ],
      customerName: "Test User",
      customerEmail: "test@example.com",
      fulfillmentType: "shipping",
      shippingAddress: "123 Test St, Sydney NSW 2000",
    });

    expect(result.fulfillmentType).toBe("shipping");
    expect(result.hasCakeItems).toBe(false);
    expect(result.shippingFee).toBe(FIXED_SHIPPING_FEE_AUD);
  });

  it("allows pickup for non-cake items with no shipping fee", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createCheckoutSession({
      items: [
        {
          productId: 2,
          productName: "Espresso Cup",
          price: 18.0,
          quantity: 1,
          productType: "merchandise",
        },
      ],
      customerName: "Test User",
      customerEmail: "test@example.com",
      fulfillmentType: "pickup",
      pickupBranchId: 1,
      pickupBranchName: "Queen St Branch",
    });

    expect(result.fulfillmentType).toBe("pickup");
    expect(result.hasCakeItems).toBe(false);
    expect(result.shippingFee).toBe(0);
  });

  it("rejects shipping without address", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.stripe.createCheckoutSession({
        items: [
          {
            productId: 2,
            productName: "Espresso Cup",
            price: 18.0,
            quantity: 1,
            productType: "merchandise",
          },
        ],
        customerName: "Test User",
        customerEmail: "test@example.com",
        fulfillmentType: "shipping",
        // No shippingAddress provided
      })
    ).rejects.toThrow("Shipping address is required");
  });

  it("mixed cart with cake + merchandise forces pickup and no shipping fee", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createCheckoutSession({
      items: [
        {
          productId: 1,
          productName: "Birthday Cake",
          price: 55.0,
          quantity: 1,
          productType: "cake",
        },
        {
          productId: 3,
          productName: "Postcard Set",
          price: 8.0,
          quantity: 3,
          productType: "postcards",
        },
      ],
      customerName: "Test User",
      customerEmail: "test@example.com",
      fulfillmentType: "pickup",
    });

    expect(result.fulfillmentType).toBe("pickup");
    expect(result.hasCakeItems).toBe(true);
    expect(result.shippingFee).toBe(0);
  });
});
