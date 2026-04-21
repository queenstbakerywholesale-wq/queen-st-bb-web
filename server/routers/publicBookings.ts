import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { branches, cakeBookings, products, customers } from "../../drizzle/schema";
import { eq, and, count } from "drizzle-orm";
import { nanoid } from "nanoid";

export const publicBookingsRouter = router({
  // Get active branches
  branches: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select({
        id: branches.id,
        name: branches.name,
        address: branches.address,
        phone: branches.phone,
        openingHours: branches.openingHours,
        pickupSlotDuration: branches.pickupSlotDuration,
        maxBookingsPerSlot: branches.maxBookingsPerSlot,
        minPrepNoticeHours: branches.minPrepNoticeHours,
        allowSameDayBooking: branches.allowSameDayBooking,
        closedDates: branches.closedDates,
      })
      .from(branches)
      .where(eq(branches.isActive, true));

    return result;
  }),

  // Get available cake products
  cakeProducts: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const result = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.shortDescription,
        price: products.price,
        imageUrl: products.imageUrl,
        sizes: products.sizes,
      })
      .from(products)
      .where(and(eq(products.isActive, true), eq(products.productType, "cake")));

    return result;
  }),

  // Check slot availability for a branch on a given date
  checkSlots: publicProcedure
    .input(
      z.object({
        branchId: z.number(),
        date: z.string(), // YYYY-MM-DD
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { slots: [] };

      // Get branch info
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, input.branchId))
        .limit(1);

      if (!branch) return { slots: [] };

      // Enforce same-day booking rule
      const now = new Date();
      const requestedDate = new Date(input.date + "T00:00:00");
      const todayStr = now.toISOString().split("T")[0];
      if (input.date === todayStr && !branch.allowSameDayBooking) {
        return { slots: [] };
      }

      // Enforce minimum preparation notice hours
      const minNoticeMs = branch.minPrepNoticeHours * 60 * 60 * 1000;
      const earliestPickup = new Date(now.getTime() + minNoticeMs);

      // Check if date is a closed date
      const closedDates = branch.closedDates || [];
      if (closedDates.includes(input.date)) return { slots: [] };

      // Get day of week
      const dayOfWeek = new Date(input.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
      const hours = branch.openingHours as Record<string, { open: string; close: string; closed?: boolean }> | null;
      const dayHours = hours?.[dayOfWeek];

      if (!dayHours || dayHours.closed) return { slots: [] };

      // Generate time slots
      const slots: { time: string; available: boolean }[] = [];
      const [openH, openM] = dayHours.open.split(":").map(Number);
      const [closeH, closeM] = dayHours.close.split(":").map(Number);
      const duration = branch.pickupSlotDuration;

      let currentMinutes = openH * 60 + openM;
      const endMinutes = closeH * 60 + closeM;

      // Get existing bookings for this date/branch
      const existingBookings = await db
        .select({
          pickupTime: cakeBookings.pickupTime,
          cnt: count(),
        })
        .from(cakeBookings)
        .where(
          and(
            eq(cakeBookings.branchId, input.branchId),
            eq(cakeBookings.pickupDate, input.date),
            // Exclude cancelled bookings
          )
        )
        .groupBy(cakeBookings.pickupTime);

      const bookingCounts: Record<string, number> = {};
      for (const b of existingBookings) {
        bookingCounts[b.pickupTime] = Number(b.cnt);
      }

      // Check closed slots
      const closedSlots = branch.closedSlots || [];
      const closedSlotSet = new Set(
        closedSlots
          .filter((s) => s.date === input.date)
          .map((s) => s.time)
      );

      while (currentMinutes + duration <= endMinutes) {
        const h = Math.floor(currentMinutes / 60);
        const m = currentMinutes % 60;
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

        const booked = bookingCounts[timeStr] || 0;
        const isClosed = closedSlotSet.has(timeStr);

        // Check if this slot is past the minimum preparation notice
        const slotDateTime = new Date(`${input.date}T${timeStr}:00`);
        const isPastMinNotice = slotDateTime >= earliestPickup;

        const available = !isClosed && isPastMinNotice && booked < branch.maxBookingsPerSlot;

        slots.push({ time: timeStr, available });
        currentMinutes += duration;
      }

      return { slots };
    }),

  // Submit a booking
  submit: publicProcedure
    .input(
      z.object({
        customerName: z.string().min(1),
        customerEmail: z.string().email().optional(),
        customerPhone: z.string().min(1),
        branchId: z.number(),
        productName: z.string().min(1),
        productId: z.number().optional(),
        size: z.string().optional(),
        customMessage: z.string().optional(),
        customRequest: z.string().optional(),
        pickupDate: z.string(), // YYYY-MM-DD
        pickupTime: z.string(), // HH:mm
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Server-side validation: check branch rules
      const [branch] = await db
        .select()
        .from(branches)
        .where(eq(branches.id, input.branchId))
        .limit(1);

      if (!branch) throw new Error("Branch not found");

      // Enforce same-day booking rule
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      if (input.pickupDate === todayStr && !branch.allowSameDayBooking) {
        throw new Error("Same-day bookings are not available for this location");
      }

      // Enforce minimum preparation notice
      const slotDateTime = new Date(`${input.pickupDate}T${input.pickupTime}:00`);
      const minNoticeMs = branch.minPrepNoticeHours * 60 * 60 * 1000;
      const earliestPickup = new Date(now.getTime() + minNoticeMs);
      if (slotDateTime < earliestPickup) {
        throw new Error(`This location requires at least ${branch.minPrepNoticeHours} hours advance notice`);
      }

      // Check closed dates
      const closedDates = branch.closedDates || [];
      if (closedDates.includes(input.pickupDate)) {
        throw new Error("This location is closed on the selected date");
      }

      const bookingNumber = `CB-${nanoid(8).toUpperCase()}`;

      // Upsert customer
      let customerId: number | undefined;
      if (input.customerPhone) {
        const existing = await db
          .select()
          .from(customers)
          .where(eq(customers.phone, input.customerPhone))
          .limit(1);

        if (existing.length > 0) {
          customerId = existing[0].id;
        } else {
          const [inserted] = await db.insert(customers).values({
            name: input.customerName,
            email: input.customerEmail || null,
            phone: input.customerPhone,
          });
          customerId = inserted.insertId;
        }
      }

      await db.insert(cakeBookings).values({
        bookingNumber,
        customerId: customerId || null,
        customerName: input.customerName,
        customerEmail: input.customerEmail || null,
        customerPhone: input.customerPhone,
        branchId: input.branchId,
        productId: input.productId || null,
        productName: input.productName,
        size: input.size || null,
        customMessage: input.customMessage || null,
        customRequest: input.customRequest || null,
        pickupDate: input.pickupDate,
        pickupTime: input.pickupTime,
      });

      return { bookingNumber };
    }),
});
