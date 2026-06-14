import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { staffShifts, shiftSwapRequests, staffMembers } from "../../drizzle/schema";
import { getStaffFromContext } from "./staffAuth";

export const shiftsRouter = router({
  // ─── List shifts for a branch (week view) ────────────────────────
  listByBranch: publicProcedure
    .input(z.object({
      branchId: z.number(),
      startDate: z.string(), // YYYY-MM-DD
      endDate: z.string(),   // YYYY-MM-DD
    }))
    .query(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const shifts = await db
        .select()
        .from(staffShifts)
        .where(
          and(
            eq(staffShifts.branchId, input.branchId),
            gte(staffShifts.date, input.startDate),
            lte(staffShifts.date, input.endDate)
          )
        );

      // Get staff names for display
      const staffList = await db
        .select({ id: staffMembers.id, displayName: staffMembers.displayName })
        .from(staffMembers)
        .where(eq(staffMembers.branchId, input.branchId));

      const staffMap = Object.fromEntries(staffList.map(s => [s.id, s.displayName]));

      return shifts.map(s => ({
        ...s,
        staffName: staffMap[s.staffId] || "Unknown",
      }));
    }),

  // ─── List my shifts ──────────────────────────────────────────────
  myShifts: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const today = new Date().toISOString().slice(0, 10);
      const startDate = input.startDate || today;
      // Default to 30 days from start
      const endDate = input.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const shifts = await db
        .select()
        .from(staffShifts)
        .where(
          and(
            eq(staffShifts.staffId, staff.staffId),
            gte(staffShifts.date, startDate),
            lte(staffShifts.date, endDate)
          )
        );

      return shifts;
    }),

  // ─── Create shift (manager only) ────────────────────────────────
  create: publicProcedure
    .input(z.object({
      branchId: z.number(),
      staffId: z.number(),
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff || staff.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only managers can create shifts" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [result] = await db.insert(staffShifts).values({
        branchId: input.branchId,
        staffId: input.staffId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        notes: input.notes || null,
        createdBy: staff.staffId,
      });

      return { success: true, id: (result as any).insertId };
    }),

  // ─── Update shift (manager only) ────────────────────────────────
  update: publicProcedure
    .input(z.object({
      id: z.number(),
      staffId: z.number().optional(),
      date: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff || staff.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only managers can update shifts" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, ...updates } = input;
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(cleanUpdates).length > 0) {
        await db.update(staffShifts).set(cleanUpdates).where(eq(staffShifts.id, id));
      }

      return { success: true };
    }),

  // ─── Delete shift (manager only) ────────────────────────────────
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff || staff.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only managers can delete shifts" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      await db.delete(staffShifts).where(eq(staffShifts.id, input.id));
      return { success: true };
    }),

  // ─── Request shift swap ──────────────────────────────────────────
  requestSwap: publicProcedure
    .input(z.object({
      shiftId: z.number(),
      targetStaffId: z.number().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Verify the shift belongs to the requester
      const [shift] = await db
        .select()
        .from(staffShifts)
        .where(eq(staffShifts.id, input.shiftId))
        .limit(1);

      if (!shift || shift.staffId !== staff.staffId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only swap your own shifts" });
      }

      const [result] = await db.insert(shiftSwapRequests).values({
        shiftId: input.shiftId,
        requesterId: staff.staffId,
        targetStaffId: input.targetStaffId || null,
        reason: input.reason || null,
      });

      return { success: true, id: (result as any).insertId };
    }),

  // ─── List swap requests (manager sees all, staff sees own) ──────
  listSwapRequests: publicProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const requests = await db
        .select()
        .from(shiftSwapRequests)
        .orderBy(desc(shiftSwapRequests.createdAt));

      // Get related shift and staff info
      const shiftIds = Array.from(new Set(requests.map(r => r.shiftId)));
      const shifts = shiftIds.length > 0
        ? await db.select().from(staffShifts).where(eq(staffShifts.branchId, input.branchId))
        : [];

      const staffList = await db
        .select({ id: staffMembers.id, displayName: staffMembers.displayName })
        .from(staffMembers)
        .where(eq(staffMembers.branchId, input.branchId));

      const staffMap = Object.fromEntries(staffList.map(s => [s.id, s.displayName]));
      const shiftMap = Object.fromEntries(shifts.map(s => [s.id, s]));

      // Filter: manager sees all for their branch, staff sees only own
      const filtered = requests.filter(r => {
        const shift = shiftMap[r.shiftId];
        if (!shift) return false;
        if (staff.role === "manager") return shift.branchId === input.branchId;
        return r.requesterId === staff.staffId || r.targetStaffId === staff.staffId;
      });

      return filtered.map(r => ({
        ...r,
        requesterName: staffMap[r.requesterId] || "Unknown",
        targetStaffName: r.targetStaffId ? staffMap[r.targetStaffId] || "Unknown" : null,
        shift: shiftMap[r.shiftId] || null,
      }));
    }),

  // ─── Respond to swap request (manager or target staff) ──────────
  respondSwap: publicProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["accepted", "rejected"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [request] = await db
        .select()
        .from(shiftSwapRequests)
        .where(eq(shiftSwapRequests.id, input.id))
        .limit(1);

      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      // Only manager or target staff can respond
      if (staff.role !== "manager" && request.targetStaffId !== staff.staffId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .update(shiftSwapRequests)
        .set({ status: input.status, respondedAt: new Date() })
        .where(eq(shiftSwapRequests.id, input.id));

      // If accepted and there's a target, swap the shift assignment
      if (input.status === "accepted" && request.targetStaffId) {
        await db
          .update(staffShifts)
          .set({ staffId: request.targetStaffId })
          .where(eq(staffShifts.id, request.shiftId));
      }

      return { success: true };
    }),

  // ─── List staff for branch (for shift assignment dropdown) ──────
  listStaff: publicProcedure
    .input(z.object({ branchId: z.number() }))
    .query(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const list = await db
        .select({
          id: staffMembers.id,
          displayName: staffMembers.displayName,
          role: staffMembers.role,
        })
        .from(staffMembers)
        .where(
          and(
            eq(staffMembers.branchId, input.branchId),
            eq(staffMembers.isActive, true)
          )
        );

      return list;
    }),
});
