import { z } from "zod";
import { eq, desc, and, like, sql } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { enquiries } from "../../drizzle/schema";

export const adminEnquiriesRouter = router({
  list: publicProcedure
    .input(
      z.object({
        type: z.enum(["wholesale", "customer_care"]).optional(),
        status: z.enum(["new", "in_progress", "responded", "closed"]).optional(),
        search: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const conditions = [];
      if (input.type) conditions.push(eq(enquiries.type, input.type));
      if (input.status) conditions.push(eq(enquiries.status, input.status));
      if (input.search) {
        conditions.push(
          sql`(${enquiries.name} LIKE ${`%${input.search}%`} OR ${enquiries.email} LIKE ${`%${input.search}%`} OR ${enquiries.company} LIKE ${`%${input.search}%`})`
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      return db
        .select()
        .from(enquiries)
        .where(where)
        .orderBy(desc(enquiries.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const rows = await db
        .select()
        .from(enquiries)
        .where(eq(enquiries.id, input.id))
        .limit(1);

      return rows[0] || null;
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "in_progress", "responded", "closed"]),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.adminNotes !== undefined) updateData.adminNotes = input.adminNotes;

      await db
        .update(enquiries)
        .set(updateData)
        .where(eq(enquiries.id, input.id));

      return { success: true };
    }),

  stats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, new: 0, wholesale: 0, customerCare: 0 };

    const [totalRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(enquiries);
    const [newRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(enquiries)
      .where(eq(enquiries.status, "new"));
    const [wholesaleRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(enquiries)
      .where(eq(enquiries.type, "wholesale"));
    const [customerCareRow] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(enquiries)
      .where(eq(enquiries.type, "customer_care"));

    return {
      total: totalRow?.count || 0,
      new: newRow?.count || 0,
      wholesale: wholesaleRow?.count || 0,
      customerCare: customerCareRow?.count || 0,
    };
  }),
});
