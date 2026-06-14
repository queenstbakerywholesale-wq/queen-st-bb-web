import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, gte, lte, desc, isNull } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { staffAttendance, staffMembers } from "../../drizzle/schema";
import { getStaffFromContext } from "./staffAuth";
import { storagePut } from "../storage";

export const attendanceRouter = router({
  // ─── Get today's attendance status for current staff ─────────────
  todayStatus: publicProcedure.query(async ({ ctx }) => {
    const staff = await getStaffFromContext(ctx);
    if (!staff) throw new TRPCError({ code: "UNAUTHORIZED" });

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const today = new Date().toISOString().slice(0, 10);
    const [record] = await db
      .select()
      .from(staffAttendance)
      .where(
        and(
          eq(staffAttendance.staffId, staff.staffId),
          eq(staffAttendance.date, today)
        )
      )
      .limit(1);

    return record || null;
  }),

  // ─── Clock In ───────────────────────────────────────────────────
  clockIn: publicProcedure
    .input(z.object({
      photoBase64: z.string(), // base64 encoded image
    }))
    .mutation(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const today = new Date().toISOString().slice(0, 10);

      // Check if already clocked in today
      const [existing] = await db
        .select()
        .from(staffAttendance)
        .where(
          and(
            eq(staffAttendance.staffId, staff.staffId),
            eq(staffAttendance.date, today)
          )
        )
        .limit(1);

      if (existing && existing.clockInTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already clocked in today" });
      }

      // Upload photo to S3
      const photoBuffer = Buffer.from(input.photoBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const photoKey = `attendance/${staff.staffId}/${today}_in_${Date.now()}.jpg`;
      const { url: photoUrl } = await storagePut(photoKey, photoBuffer, "image/jpeg");

      const now = new Date();

      if (existing) {
        // Update existing record
        await db
          .update(staffAttendance)
          .set({ clockInTime: now, clockInPhotoUrl: photoUrl })
          .where(eq(staffAttendance.id, existing.id));
      } else {
        // Create new record
        await db.insert(staffAttendance).values({
          staffId: staff.staffId,
          branchId: staff.branchId,
          date: today,
          clockInTime: now,
          clockInPhotoUrl: photoUrl,
        });
      }

      return { success: true, clockInTime: now.toISOString() };
    }),

  // ─── Clock Out ──────────────────────────────────────────────────
  clockOut: publicProcedure
    .input(z.object({
      photoBase64: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff) throw new TRPCError({ code: "UNAUTHORIZED" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const today = new Date().toISOString().slice(0, 10);

      const [existing] = await db
        .select()
        .from(staffAttendance)
        .where(
          and(
            eq(staffAttendance.staffId, staff.staffId),
            eq(staffAttendance.date, today)
          )
        )
        .limit(1);

      if (!existing || !existing.clockInTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Must clock in first" });
      }

      if (existing.clockOutTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already clocked out today" });
      }

      // Upload photo to S3
      const photoBuffer = Buffer.from(input.photoBase64.replace(/^data:image\/\w+;base64,/, ""), "base64");
      const photoKey = `attendance/${staff.staffId}/${today}_out_${Date.now()}.jpg`;
      const { url: photoUrl } = await storagePut(photoKey, photoBuffer, "image/jpeg");

      const now = new Date();
      const totalMinutes = Math.round((now.getTime() - new Date(existing.clockInTime).getTime()) / 60000);

      await db
        .update(staffAttendance)
        .set({
          clockOutTime: now,
          clockOutPhotoUrl: photoUrl,
          totalMinutes,
        })
        .where(eq(staffAttendance.id, existing.id));

      return { success: true, clockOutTime: now.toISOString(), totalMinutes };
    }),

  // ─── List attendance records (admin/manager) ────────────────────
  list: publicProcedure
    .input(z.object({
      branchId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff || staff.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

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

      // Get staff names
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

  // ─── Export attendance as Excel (CSV) ───────────────────────────
  exportExcel: publicProcedure
    .input(z.object({
      branchId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const staff = await getStaffFromContext(ctx);
      if (!staff || staff.role !== "manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Manager access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

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

      // Get staff names
      const staffList = await db
        .select({ id: staffMembers.id, displayName: staffMembers.displayName })
        .from(staffMembers)
        .where(eq(staffMembers.branchId, input.branchId));

      const staffMap = Object.fromEntries(staffList.map(s => [s.id, s.displayName]));

      // Build CSV content
      const headers = ["Date", "Staff Name", "Clock In", "Clock Out", "Total Hours", "Total Minutes"];
      const rows = records.map(r => {
        const clockIn = r.clockInTime ? new Date(r.clockInTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
        const clockOut = r.clockOutTime ? new Date(r.clockOutTime).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
        const totalHours = r.totalMinutes ? (r.totalMinutes / 60).toFixed(2) : "";
        return [r.date, staffMap[r.staffId] || "Unknown", clockIn, clockOut, totalHours, r.totalMinutes?.toString() || ""];
      });

      const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

      // Upload CSV to S3
      const filename = `attendance_${input.branchId}_${input.startDate}_to_${input.endDate}.csv`;
      const { url } = await storagePut(
        `exports/${filename}`,
        Buffer.from("\uFEFF" + csvContent, "utf-8"), // BOM for Excel UTF-8
        "text/csv"
      );

      return { url, filename };
    }),
});
