import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { products, categories } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const publicProductsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        categoryId: z.number().optional(),
        productType: z.enum(["tiramisu", "gelato", "cake", "merchandise", "postcards", "objects", "wholesale"]).optional(),
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [eq(products.isActive, true)];
      if (input?.categoryId) conditions.push(eq(products.categoryId, input.categoryId));
      if (input?.productType) conditions.push(eq(products.productType, input.productType));

      const result = await db
        .select()
        .from(products)
        .where(and(...conditions))
        .orderBy(desc(products.createdAt))
        .limit(input?.limit ?? 50);

      return result;
    }),

  featured: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select()
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.isFeatured, true)))
      .orderBy(desc(products.createdAt))
      .limit(12);

    return result;
  }),

  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const result = await db.select().from(categories);
    return result;
  }),
});
