import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { pageImages } from "../../drizzle/schema";

export const adminPageImagesRouter = router({
  list: publicProcedure
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

  upsert: publicProcedure
    .input(
      z.object({
        id: z.number().optional(), // if provided, update; otherwise insert
        pageSlug: z.string().min(1).max(100),
        slotKey: z.string().min(1).max(100),
        imageUrl: z.string().min(1),
        storageKey: z.string().optional(),
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

  delete: publicProcedure
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
