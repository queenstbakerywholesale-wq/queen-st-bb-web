import { z } from "zod";
import { eq, sql, like, or, count } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { customers, orders, cakeBookings } from "../../drizzle/schema";

export const adminCustomersRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };

      const offset = (input.page - 1) * input.limit;
      const conditions = [];

      if (input.search) {
        conditions.push(
          or(
            like(customers.name, `%${input.search}%`),
            like(customers.email, `%${input.search}%`),
            like(customers.phone, `%${input.search}%`)
          )
        );
      }

      const where = conditions.length > 0 ? conditions[0] : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(customers)
        .where(where);

      const items = await db
        .select()
        .from(customers)
        .where(where)
        .orderBy(sql`${customers.createdAt} DESC`)
        .limit(input.limit)
        .offset(offset);

      return { items, total: totalResult?.count ?? 0 };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, input.id));

      if (!customer) return null;

      const customerOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.customerId, input.id))
        .orderBy(sql`${orders.createdAt} DESC`)
        .limit(20);

      const customerBookings = await db
        .select()
        .from(cakeBookings)
        .where(eq(cakeBookings.customerId, input.id))
        .orderBy(sql`${cakeBookings.createdAt} DESC`)
        .limit(20);

      return { ...customer, orders: customerOrders, bookings: customerBookings };
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(customers).values(input);
      return { id: Number(result[0].insertId) };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...data } = input;
      await db.update(customers).set(data).where(eq(customers.id, id));
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(customers).where(eq(customers.id, input.id));
      return { success: true };
    }),
});
