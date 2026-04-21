import { z } from "zod";
import { eq, sql, like, and, or, count, gte } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { cakeBookings, branches } from "../../drizzle/schema";

export const adminBookingsRouter = router({
  list: publicProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        search: z.string().optional(),
        status: z.string().optional(),
        branchId: z.number().optional(),
        dateFrom: z.string().optional(),
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
            like(cakeBookings.bookingNumber, `%${input.search}%`),
            like(cakeBookings.customerName, `%${input.search}%`),
            like(cakeBookings.customerPhone, `%${input.search}%`)
          )
        );
      }
      if (input.status) {
        conditions.push(eq(cakeBookings.status, input.status as any));
      }
      if (input.branchId) {
        conditions.push(eq(cakeBookings.branchId, input.branchId));
      }
      if (input.dateFrom) {
        conditions.push(gte(cakeBookings.pickupDate, input.dateFrom));
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(cakeBookings)
        .where(where);

      const items = await db
        .select()
        .from(cakeBookings)
        .where(where)
        .orderBy(sql`${cakeBookings.pickupDate} DESC, ${cakeBookings.pickupTime} DESC`)
        .limit(input.limit)
        .offset(offset);

      return { items, total: totalResult?.count ?? 0 };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [booking] = await db
        .select()
        .from(cakeBookings)
        .where(eq(cakeBookings.id, input.id));

      return booking ?? null;
    }),

  create: publicProcedure
    .input(
      z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().optional(),
        customerPhone: z.string().min(1),
        customerId: z.number().optional(),
        branchId: z.number(),
        productId: z.number().optional(),
        productName: z.string().min(1),
        size: z.string().optional(),
        customMessage: z.string().optional(),
        customRequest: z.string().optional(),
        pickupDate: z.string(),
        pickupTime: z.string(),
        status: z.enum(["pending", "confirmed", "preparing", "ready", "completed", "cancelled"]).default("pending"),
        paymentMethod: z.enum(["online", "pickup"]).default("pickup"),
        paymentStatus: z.enum(["unpaid", "paid", "refunded"]).default("unpaid"),
        totalPrice: z.string().optional(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const bookingNumber = `CB-${Date.now().toString(36).toUpperCase()}`;

      const result = await db.insert(cakeBookings).values({
        ...input,
        bookingNumber,
      });

      return { id: Number(result[0].insertId), bookingNumber };
    }),

  updateStatus: publicProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum([
          "pending",
          "confirmed",
          "preparing",
          "ready",
          "completed",
          "cancelled",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(cakeBookings)
        .set({ status: input.status })
        .where(eq(cakeBookings.id, input.id));
      return { success: true };
    }),

  updateNotes: publicProcedure
    .input(z.object({ id: z.number(), adminNotes: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(cakeBookings)
        .set({ adminNotes: input.adminNotes })
        .where(eq(cakeBookings.id, input.id));
      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(cakeBookings).where(eq(cakeBookings.id, input.id));
      return { success: true };
    }),

  // Branch management
  listBranches: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db.select().from(branches).orderBy(sql`${branches.name} ASC`);
  }),

  getBranch: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, input.id));

      return branch ?? null;
    }),

  createBranch: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        address: z.string().min(1),
        phone: z.string().optional(),
        email: z.string().optional(),
        openingHours: z.record(z.string(), z.object({
          open: z.string(),
          close: z.string(),
          closed: z.boolean().optional(),
        })).optional(),
        pickupSlotDuration: z.number().default(30),
        maxBookingsPerSlot: z.number().default(3),
        minPrepNoticeHours: z.number().default(24),
        allowSameDayBooking: z.boolean().default(false),
        isActive: z.boolean().default(true),
        closedDates: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(branches).values(input as any);
      return { id: Number(result[0].insertId) };
    }),

  updateBranch: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        openingHours: z.record(z.string(), z.object({
          open: z.string(),
          close: z.string(),
          closed: z.boolean().optional(),
        })).optional(),
        pickupSlotDuration: z.number().optional(),
        maxBookingsPerSlot: z.number().optional(),
        minPrepNoticeHours: z.number().optional(),
        allowSameDayBooking: z.boolean().optional(),
        isActive: z.boolean().optional(),
        closedDates: z.array(z.string()).optional(),
        closedSlots: z.array(z.object({ date: z.string(), time: z.string() })).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...data } = input;
      await db.update(branches).set(data as any).where(eq(branches.id, id));
      return { success: true };
    }),

  // Availability check for public booking
  getAvailableSlots: publicProcedure
    .input(
      z.object({
        branchId: z.number(),
        date: z.string(), // YYYY-MM-DD
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { slots: [], available: false };

      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, input.branchId));

      if (!branch || !branch.isActive) {
        return { slots: [], available: false };
      }

      // Check if date is in closed dates
      if (branch.closedDates?.includes(input.date)) {
        return { slots: [], available: false };
      }

      // Check day of week
      const dayOfWeek = new Date(input.date).toLocaleDateString("en-US", {
        weekday: "long",
      }).toLowerCase();
      const hours = branch.openingHours?.[dayOfWeek];
      if (!hours || hours.closed) {
        return { slots: [], available: false };
      }

      // Check min prep notice
      const now = new Date();
      const bookingDate = new Date(input.date + "T00:00:00");
      const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilBooking < branch.minPrepNoticeHours) {
        if (!branch.allowSameDayBooking || hoursUntilBooking < 0) {
          return { slots: [], available: false };
        }
      }

      // Generate time slots
      const [openH, openM] = hours.open.split(":").map(Number);
      const [closeH, closeM] = hours.close.split(":").map(Number);
      const startMinutes = openH * 60 + openM;
      const endMinutes = closeH * 60 + closeM;
      const slotDuration = branch.pickupSlotDuration;

      const allSlots: string[] = [];
      for (let m = startMinutes; m < endMinutes; m += slotDuration) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        allSlots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
      }

      // Get existing bookings for this date/branch
      const existingBookings = await db
        .select({ pickupTime: cakeBookings.pickupTime, cnt: count() })
        .from(cakeBookings)
        .where(
          and(
            eq(cakeBookings.branchId, input.branchId),
            eq(cakeBookings.pickupDate, input.date),
            sql`${cakeBookings.status} != 'cancelled'`
          )
        )
        .groupBy(cakeBookings.pickupTime);

      const bookingCounts = new Map(
        existingBookings.map((b) => [b.pickupTime, b.cnt])
      );

      // Filter out closed slots
      const closedSlotTimes = new Set(
        (branch.closedSlots ?? [])
          .filter((s) => s.date === input.date)
          .map((s) => s.time)
      );

      const slots = allSlots.map((time) => ({
        time,
        available:
          !closedSlotTimes.has(time) &&
          (bookingCounts.get(time) ?? 0) < branch.maxBookingsPerSlot,
        booked: bookingCounts.get(time) ?? 0,
        max: branch.maxBookingsPerSlot,
      }));

      return { slots, available: slots.some((s) => s.available) };
    }),
});
