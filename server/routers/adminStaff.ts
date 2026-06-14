import { z } from "zod";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { staffMembers, branches, staffAttendance } from "../../drizzle/schema";
import { storagePut } from "../storage";
import bcrypt from "bcryptjs";

export const adminStaffRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const staff = await db
      .select({
        id: staffMembers.id,
        username: staffMembers.username,
        displayName: staffMembers.displayName,
        branchId: staffMembers.branchId,
        role: staffMembers.role,
        isActive: staffMembers.isActive,
        lastLoginAt: staffMembers.lastLoginAt,
        createdAt: staffMembers.createdAt,
      })
      .from(staffMembers)
      .orderBy(desc(staffMembers.createdAt));

    // Get branch names
    const allBranches = await db.select().from(branches);
    const branchMap = Object.fromEntries(allBranches.map((b) => [b.id, b.name]));

    return staff.map((s) => ({
      ...s,
      branchName: branchMap[s.branchId] || "Unknown",
    }));
  }),

  create: publicProcedure
    .input(
      z.object({
        username: z.string().min(3).max(100),
        password: z.string().min(4),
        displayName: z.string().min(1).max(200),
        branchId: z.number(),
        role: z.enum(["staff", "manager"]),
        pin: z.string().min(4).max(10).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const passwordHash = await bcrypt.hash(input.password, 10);

      await db.insert(staffMembers).values({
        username: input.username,
        passwordHash,
        displayName: input.displayName,
        branchId: input.branchId,
        role: input.role,
        pin: input.pin || null,
      });

      return { success: true };
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        displayName: z.string().min(1).max(200).optional(),
        branchId: z.number().optional(),
        role: z.enum(["staff", "manager"]).optional(),
        pin: z.string().min(4).max(10).optional().nullable(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;
      const setData: any = {};
      if (updates.displayName !== undefined) setData.displayName = updates.displayName;
      if (updates.branchId !== undefined) setData.branchId = updates.branchId;
      if (updates.role !== undefined) setData.role = updates.role;
      if (updates.pin !== undefined) setData.pin = updates.pin;
      if (updates.isActive !== undefined) setData.isActive = updates.isActive;

      await db.update(staffMembers).set(setData).where(eq(staffMembers.id, id));
      return { success: true };
    }),

  resetPassword: publicProcedure
    .input(z.object({ id: z.number(), newPassword: z.string().min(4) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const passwordHash = await bcrypt.hash(input.newPassword, 10);
      await db
        .update(staffMembers)
        .set({ passwordHash })
        .where(eq(staffMembers.id, input.id));

      return { success: true };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Soft delete by deactivating
      await db
        .update(staffMembers)
        .set({ isActive: false })
        .where(eq(staffMembers.id, input.id));

      return { success: true };
    }),

  // Get branches for dropdown
  branches: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    return db
      .select({ id: branches.id, name: branches.name })
      .from(branches)
      .where(eq(branches.isActive, true));
  }),

  // ─── Attendance Records ─────────────────────────────────────────
  attendanceList: publicProcedure
    .input(z.object({
      branchId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const records = await db
        .select()
        .from(staffAttendance)
        .where(
          and(
            eq(staffAttendance.branchId, input.branchId),
            gte(staffAttendance.date, input.startDate),
            lte(staffAttendance.date, input.endDate)
          )
        )
        .orderBy(desc(staffAttendance.date));

      const staffList = await db
        .select({ id: staffMembers.id, displayName: staffMembers.displayName })
        .from(staffMembers)
        .where(eq(staffMembers.branchId, input.branchId));

      const staffMap = Object.fromEntries(staffList.map(s => [s.id, s.displayName]));

      return records.map(r => ({
        ...r,
        staffName: staffMap[r.staffId] || "Unknown",
      }));
    }),

  // ─── Export Attendance to Excel (CSV) ───────────────────────────
  attendanceExport: publicProcedure
    .input(z.object({
      branchId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const records = await db
        .select()
        .from(staffAttendance)
        .where(
          and(
            eq(staffAttendance.branchId, input.branchId),
            gte(staffAttendance.date, input.startDate),
            lte(staffAttendance.date, input.endDate)
          )
        )
        .orderBy(staffAttendance.date);

      const staffList = await db
        .select({ id: staffMembers.id, displayName: staffMembers.displayName })
        .from(staffMembers)
        .where(eq(staffMembers.branchId, input.branchId));

      const staffMap = Object.fromEntries(staffList.map(s => [s.id, s.displayName]));

      // Build CSV with BOM for Excel
      const headers = ["Date", "Staff Name", "Clock In", "Clock Out", "Total Hours", "Total Minutes"];
      const rows = records.map(r => {
        const clockIn = r.clockInTime ? new Date(r.clockInTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Australia/Melbourne" }) : "";
        const clockOut = r.clockOutTime ? new Date(r.clockOutTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Australia/Melbourne" }) : "";
        const totalHours = r.totalMinutes ? (r.totalMinutes / 60).toFixed(2) : "";
        return [r.date, staffMap[r.staffId] || "Unknown", clockIn, clockOut, totalHours, r.totalMinutes?.toString() || ""];
      });

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const filename = `attendance_${input.branchId}_${input.startDate}_to_${input.endDate}.csv`;
      const { url } = await storagePut(
        `exports/${filename}`,
        Buffer.from("\uFEFF" + csvContent, "utf-8"),
        "text/csv"
      );

      return { url, filename };
    }),
});
