import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { SignJWT, jwtVerify } from "jose";
import { eq, and } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { staffMembers } from "../../drizzle/schema";
import { STAFF_COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import bcrypt from "bcryptjs";

const STAFF_JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret + "_staff");

interface StaffTokenPayload {
  staffId: number;
  branchId: number;
  role: "staff" | "manager";
  displayName: string;
}

async function createStaffToken(payload: StaffTokenPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(STAFF_JWT_SECRET);
}

async function verifyStaffToken(token: string): Promise<StaffTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, STAFF_JWT_SECRET);
    return payload as unknown as StaffTokenPayload;
  } catch {
    return null;
  }
}

export const staffAuthRouter = router({
  login: publicProcedure
    .input(z.object({ username: z.string(), password: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [staff] = await db
        .select()
        .from(staffMembers)
        .where(
          and(
            eq(staffMembers.username, input.username),
            eq(staffMembers.isActive, true)
          )
        )
        .limit(1);

      if (!staff) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const validPassword = await bcrypt.compare(input.password, staff.passwordHash);
      if (!validPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      // Update last login
      await db
        .update(staffMembers)
        .set({ lastLoginAt: new Date() })
        .where(eq(staffMembers.id, staff.id));

      const token = await createStaffToken({
        staffId: staff.id,
        branchId: staff.branchId,
        role: staff.role,
        displayName: staff.displayName,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(STAFF_COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      });

      return {
        success: true,
        staff: {
          id: staff.id,
          displayName: staff.displayName,
          branchId: staff.branchId,
          role: staff.role,
        },
      };
    }),

  // PIN-based quick login (for POS)
  pinLogin: publicProcedure
    .input(z.object({ pin: z.string(), branchId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [staff] = await db
        .select()
        .from(staffMembers)
        .where(
          and(
            eq(staffMembers.pin, input.pin),
            eq(staffMembers.branchId, input.branchId),
            eq(staffMembers.isActive, true)
          )
        )
        .limit(1);

      if (!staff) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid PIN",
        });
      }

      await db
        .update(staffMembers)
        .set({ lastLoginAt: new Date() })
        .where(eq(staffMembers.id, staff.id));

      const token2 = await createStaffToken({
        staffId: staff.id,
        branchId: staff.branchId,
        role: staff.role,
        displayName: staff.displayName,
      });

      const cookieOptions2 = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(STAFF_COOKIE_NAME, token2, {
        ...cookieOptions2,
        maxAge: 12 * 60 * 60 * 1000,
      });

      return {
        success: true,
        staff: {
          id: staff.id,
          displayName: staff.displayName,
          branchId: staff.branchId,
          role: staff.role,
        },
      };
    }),

  verify: publicProcedure.query(async ({ ctx }) => {
    const token = ctx.req.cookies?.[STAFF_COOKIE_NAME];
    if (!token) {
      return { authenticated: false, staff: null };
    }
    const payload = await verifyStaffToken(token);
    if (!payload) {
      return { authenticated: false, staff: null };
    }
    return {
      authenticated: true,
      staff: {
        id: payload.staffId,
        branchId: payload.branchId,
        role: payload.role,
        displayName: payload.displayName,
      },
    };
  }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(STAFF_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),
});

// Helper to verify staff from context (used by other routers)
export async function getStaffFromContext(ctx: any): Promise<StaffTokenPayload | null> {
  const token = ctx.req.cookies?.[STAFF_COOKIE_NAME];
  if (!token) return null;
  return verifyStaffToken(token);
}
