import { describe, expect, it, vi, beforeEach } from "vitest";
import { ADMIN_COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// Mock the ENV module so adminPassword is controlled by the test
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
  },
}));

// Import appRouter AFTER the mock is set up
const { appRouter } = await import("./routers");

type CookieCall = {
  name: string;
  value?: string;
  options: Record<string, unknown>;
};

function createPublicContext(): {
  ctx: TrpcContext;
  setCookies: CookieCall[];
  clearedCookies: CookieCall[];
  cookieJar: Record<string, string>;
} {
  const setCookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];
  const cookieJar: Record<string, string> = {};

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: cookieJar,
    } as unknown as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
        cookieJar[name] = value;
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
        delete cookieJar[name];
      },
    } as unknown as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies, cookieJar };
}

describe("adminAuth", () => {
  describe("login", () => {
    it("rejects an incorrect password", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.adminAuth.login({ password: "wrong-password" })
      ).rejects.toThrow("Invalid password");
    });

    it("accepts the correct password and sets a cookie", async () => {
      const { ctx, setCookies } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.adminAuth.login({
        password: "test-secret-123",
      });

      expect(result).toEqual({ success: true });
      expect(setCookies).toHaveLength(1);
      expect(setCookies[0]?.name).toBe(ADMIN_COOKIE_NAME);
      expect(setCookies[0]?.value).toBeTruthy();
      expect(typeof setCookies[0]?.value).toBe("string");
    });
  });

  describe("verify", () => {
    it("returns authenticated: false when no cookie is present", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.adminAuth.verify();
      expect(result).toEqual({ authenticated: false });
    });

    it("returns authenticated: true after a successful login", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Login first to get the cookie set in cookieJar
      await caller.adminAuth.login({ password: "test-secret-123" });

      // Verify should now return true since the cookie is in the jar
      const result = await caller.adminAuth.verify();
      expect(result).toEqual({ authenticated: true });
    });
  });

  describe("logout", () => {
    it("clears the admin cookie", async () => {
      const { ctx, clearedCookies } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.adminAuth.logout();

      expect(result).toEqual({ success: true });
      expect(clearedCookies).toHaveLength(1);
      expect(clearedCookies[0]?.name).toBe(ADMIN_COOKIE_NAME);
      expect(clearedCookies[0]?.options).toMatchObject({
        maxAge: -1,
      });
    });
  });
});
