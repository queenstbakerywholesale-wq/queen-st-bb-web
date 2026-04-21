import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { SignJWT, jwtVerify } from "jose";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { ADMIN_COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";

const ADMIN_JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret + "_admin");

async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(ADMIN_JWT_SECRET);
}

async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, ADMIN_JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export const adminAuthRouter = router({
  login: publicProcedure
    .input(z.object({ password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!ENV.adminPassword) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Admin password not configured",
        });
      }

      if (input.password !== ENV.adminPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid password",
        });
      }

      const token = await createAdminToken();
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(ADMIN_COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true };
    }),

  verify: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.[ADMIN_COOKIE_NAME];
    if (!token) {
      return { authenticated: false };
    }
    const valid = await verifyAdminToken(token);
    return { authenticated: valid };
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(ADMIN_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
});
