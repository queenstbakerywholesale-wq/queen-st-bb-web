import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { jwtVerify } from "jose";
import { eq, and, asc } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pageImages } from "../../drizzle/schema";
import { ENV } from "../_core/env";
import { ADMIN_COOKIE_NAME } from "@shared/const";

/**
 * The public site admin uses its own signed admin cookie (adminAuthRouter),
 * while ctx.user is used by the OAuth app session.  Accept either real app
 * admins or that existing admin cookie; deliberately do not read POS staff
 * cookies here.
 */
const ADMIN_JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret + "_admin");

const adminPageImageProcedure = publicProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role === "admin") {
    return next({ ctx });
  }

  const token = ctx.req.cookies?.[ADMIN_COOKIE_NAME];
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  }

  try {
    const { payload } = await jwtVerify(token, ADMIN_JWT_SECRET);
    if (payload.role !== "admin") throw new Error("Not an admin token");
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
  }

  return next({ ctx });
});

function isSafeImageUrl(value: string): boolean {
  if (value.toLowerCase().includes(".svg")) return false;

  if (/^\/manus-storage\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value)) {
    return !value.includes("..");
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

const imageUrlSchema = z
  .string()
  .trim()
  .min(1, "이미지 URL을 입력하세요.")
  .refine(isSafeImageUrl, "https URL 또는 /manus-storage/ 이미지 경로만 사용할 수 있습니다.");

export const adminPageImagesRouter = router({
  list: adminPageImageProcedure
    .input(
      z.object({
        pageSlug: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      if (input.pageSlug) {
        return db
          .select()
          .from(pageImages)
          .where(eq(pageImages.pageSlug, input.pageSlug))
          .orderBy(asc(pageImages.sortOrder));
      }

      return db
        .select()
        .from(pageImages)
        .orderBy(asc(pageImages.pageSlug), asc(pageImages.sortOrder));
    }),

  upsert: adminPageImageProcedure
    .input(
      z.object({
        id: z.number().optional(), // if provided, update; otherwise insert
        pageSlug: z.string().min(1).max(100),
        slotKey: z.string().min(1).max(100),
        imageUrl: imageUrlSchema,
        storageKey: z.string().max(1000).optional(),
        altText: z.string().max(500).optional(),
        sortOrder: z.number().int().default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (input.id) {
        // Update existing
        await db
          .update(pageImages)
          .set({
            pageSlug: input.pageSlug,
            slotKey: input.slotKey,
            imageUrl: input.imageUrl,
            storageKey: input.storageKey || null,
            altText: input.altText || null,
            sortOrder: input.sortOrder,
            isActive: input.isActive,
          })
          .where(eq(pageImages.id, input.id));
        return { id: input.id };
      } else {
        // Check if slot already exists
        const existing = await db
          .select()
          .from(pageImages)
          .where(
            and(
              eq(pageImages.pageSlug, input.pageSlug),
              eq(pageImages.slotKey, input.slotKey)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update existing slot
          await db
            .update(pageImages)
            .set({
              imageUrl: input.imageUrl,
              storageKey: input.storageKey || null,
              altText: input.altText || null,
              sortOrder: input.sortOrder,
              isActive: input.isActive,
            })
            .where(eq(pageImages.id, existing[0].id));
          return { id: existing[0].id };
        }

        // Insert new
        const [result] = await db.insert(pageImages).values({
          pageSlug: input.pageSlug,
          slotKey: input.slotKey,
          imageUrl: input.imageUrl,
          storageKey: input.storageKey || null,
          altText: input.altText || null,
          sortOrder: input.sortOrder,
          isActive: input.isActive,
        });
        return { id: result.insertId };
      }
    }),

  delete: adminPageImageProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(pageImages).where(eq(pageImages.id, input.id));
      return { success: true };
    }),
});

// Public router for frontend pages to fetch images
export const publicPageImagesRouter = router({
  getByPage: publicProcedure
    .input(z.object({ pageSlug: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      return db
        .select()
        .from(pageImages)
        .where(
          and(
            eq(pageImages.pageSlug, input.pageSlug),
            eq(pageImages.isActive, true)
          )
        )
        .orderBy(asc(pageImages.sortOrder));
    }),
});
