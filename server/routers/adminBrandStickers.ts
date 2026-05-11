import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { brandStickers } from "../../drizzle/schema";
import { storagePut } from "../storage";

export const adminBrandStickersRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(brandStickers)
      .orderBy(asc(brandStickers.sortOrder), asc(brandStickers.id));
  }),

  // Public endpoint for gift card editor
  publicList: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(brandStickers)
      .where(eq(brandStickers.isActive, true))
      .orderBy(asc(brandStickers.sortOrder), asc(brandStickers.id));
  }),

  upload: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        imageBase64: z.string(),
        mimeType: z.string().refine(
          (v) => ["image/jpeg", "image/png", "image/webp"].includes(v),
          "Only JPG, PNG, WEBP allowed"
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Upload to S3
      const ext = input.mimeType === "image/png" ? "png" : input.mimeType === "image/webp" ? "webp" : "jpg";
      const fileKey = `brand-stickers/${Date.now()}-${input.name.replace(/[^a-zA-Z0-9]/g, "_")}.${ext}`;
      const buffer = Buffer.from(input.imageBase64, "base64");
      const { key, url } = await storagePut(fileKey, buffer, input.mimeType);

      // Get max sort order
      const existing = await db
        .select({ maxSort: brandStickers.sortOrder })
        .from(brandStickers)
        .orderBy(asc(brandStickers.sortOrder));
      const maxSort = existing.length > 0 ? Math.max(...existing.map((e) => e.maxSort)) + 1 : 0;

      const [result] = await db.insert(brandStickers).values({
        name: input.name,
        imageUrl: url,
        imageKey: key,
        sortOrder: maxSort,
        isActive: true,
      });

      return { id: result.insertId, url, key };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(brandStickers).where(eq(brandStickers.id, input.id));
      return { success: true };
    }),

  toggleActive: publicProcedure
    .input(z.object({ id: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(brandStickers)
        .set({ isActive: input.isActive })
        .where(eq(brandStickers.id, input.id));
      return { success: true };
    }),

  reorder: publicProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      for (let i = 0; i < input.ids.length; i++) {
        await db
          .update(brandStickers)
          .set({ sortOrder: i })
          .where(eq(brandStickers.id, input.ids[i]));
      }
      return { success: true };
    }),
});
