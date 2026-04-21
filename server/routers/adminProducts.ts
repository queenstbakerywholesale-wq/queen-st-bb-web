import { z } from "zod";
import { eq, sql, like, and, count } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { products, categories } from "../../drizzle/schema";

export const adminProductsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        categoryId: z.number().optional(),
        productType: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };

      const offset = (input.page - 1) * input.limit;
      const conditions = [];

      if (input.search) {
        conditions.push(like(products.name, `%${input.search}%`));
      }
      if (input.categoryId !== undefined) {
        conditions.push(eq(products.categoryId, input.categoryId));
      }
      if (input.productType) {
        conditions.push(eq(products.productType, input.productType as any));
      }
      if (input.isActive !== undefined) {
        conditions.push(eq(products.isActive, input.isActive));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(products)
        .where(where);

      const items = await db
        .select()
        .from(products)
        .where(where)
        .orderBy(sql`${products.createdAt} DESC`)
        .limit(input.limit)
        .offset(offset);

      return { items, total: totalResult?.count ?? 0 };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id));

      return product ?? null;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        categoryId: z.number().optional(),
        price: z.string(),
        compareAtPrice: z.string().optional(),
        imageUrl: z.string().optional(),
        images: z.array(z.string()).optional(),
        stock: z.number().default(0),
        lowStockThreshold: z.number().default(5),
        isActive: z.boolean().default(true),
        isFeatured: z.boolean().default(false),
        productType: z.enum([
          "tiramisu",
          "gelato",
          "cake",
          "merchandise",
          "wholesale",
        ]),
        sizes: z
          .array(z.object({ name: z.string(), priceAdjustment: z.number() }))
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(products).values({
        ...input,
        images: input.images ?? null,
        sizes: input.sizes ?? null,
        compareAtPrice: input.compareAtPrice ?? null,
      });

      return { id: Number(result[0].insertId) };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
        shortDescription: z.string().optional(),
        categoryId: z.number().nullable().optional(),
        price: z.string().optional(),
        compareAtPrice: z.string().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        images: z.array(z.string()).nullable().optional(),
        stock: z.number().optional(),
        lowStockThreshold: z.number().optional(),
        isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(),
        productType: z
          .enum(["tiramisu", "gelato", "cake", "merchandise", "wholesale"])
          .optional(),
        sizes: z
          .array(z.object({ name: z.string(), priceAdjustment: z.number() }))
          .nullable()
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...data } = input;
      await db.update(products).set(data).where(eq(products.id, id));
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(products).where(eq(products.id, input.id));
      return { success: true };
    }),

  // Categories
  listCategories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(categories)
      .orderBy(sql`${categories.sortOrder} ASC`);
  }),

  createCategory: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        sortOrder: z.number().default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(categories).values(input);
      return { id: Number(result[0].insertId) };
    }),

  updateCategory: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        sortOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...data } = input;
      await db.update(categories).set(data).where(eq(categories.id, id));
      return { success: true };
    }),

  deleteCategory: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(categories).where(eq(categories.id, input.id));
      return { success: true };
    }),
});
