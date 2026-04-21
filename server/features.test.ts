import { describe, expect, it, vi, beforeEach } from "vitest";
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
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    stripePublishableKey: "",
  },
}));

// Mock the database module
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

// Mock notification
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

describe("publicEnquiries", () => {
  describe("submitWholesale", () => {
    it("accepts valid wholesale enquiry", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.publicEnquiries.submitWholesale({
        name: "John Smith",
        email: "john@example.com",
        company: "Cafe Co",
        interest: "Wholesale",
        message: "We are interested in wholesale tiramisu supply.",
      });

      expect(result).toEqual({ success: true });
    });

    it("rejects empty name", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.publicEnquiries.submitWholesale({
          name: "",
          email: "john@example.com",
          message: "Test message",
        })
      ).rejects.toThrow();
    });

    it("rejects invalid email", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.publicEnquiries.submitWholesale({
          name: "John",
          email: "not-an-email",
          message: "Test message",
        })
      ).rejects.toThrow();
    });

    it("rejects empty message", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.publicEnquiries.submitWholesale({
          name: "John",
          email: "john@example.com",
          message: "",
        })
      ).rejects.toThrow();
    });
  });

  describe("submitCustomerCare", () => {
    it("accepts valid customer care enquiry", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.publicEnquiries.submitCustomerCare({
        name: "Jane Doe",
        email: "jane@example.com",
        subject: "Delivery question",
        message: "When will my order arrive?",
      });

      expect(result).toEqual({ success: true });
    });

    it("rejects invalid email for customer care", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.publicEnquiries.submitCustomerCare({
          name: "Jane",
          email: "bad-email",
          message: "Test",
        })
      ).rejects.toThrow();
    });
  });
});

describe("stripeCheckout", () => {
  describe("createCheckoutSession", () => {
    it("rejects items with price below $0.50", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stripeCheckout.createCheckoutSession({
          items: [
            {
              productId: 1,
              productName: "Test",
              price: 0.1,
              quantity: 1,
            },
          ],
          customerName: "Test User",
          customerEmail: "test@example.com",
        })
      ).rejects.toThrow();
    });

    it("rejects empty items array", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stripeCheckout.createCheckoutSession({
          items: [],
          customerName: "Test User",
          customerEmail: "test@example.com",
        })
      ).rejects.toThrow();
    });

    it("rejects invalid customer email", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.stripeCheckout.createCheckoutSession({
          items: [
            {
              productId: 1,
              productName: "Tiramisu",
              price: 12.0,
              quantity: 1,
            },
          ],
          customerName: "Test User",
          customerEmail: "not-email",
        })
      ).rejects.toThrow();
    });
  });
});

describe("adminAuth", () => {
  it("login rejects wrong password", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.adminAuth.login({ password: "wrong" })
    ).rejects.toThrow("Invalid password");
  });

  it("login accepts correct password", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
        cookies: {},
      } as unknown as TrpcContext["req"],
      res: {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAuth.login({
      password: "test-secret-123",
    });
    expect(result).toEqual({ success: true });
  });
});
