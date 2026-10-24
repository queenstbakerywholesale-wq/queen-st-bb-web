import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { storagePut } from "../storage";
import { branches, shiftSwapRequests, staffMembers, staffShifts } from "../../drizzle/schema";
import { getStaffFromContext } from "./staffAuth";
import {
  buildShiftWorkbook,
  mondayToSundayForCalendarDate,
  shiftWorkbookFilename,
  type WorkbookShift,
} from "../shiftWorkbook";

type StaffRole = "staff" | "manager" | "owner";
type AuthenticatedStaff = {
  staffId: number;
  branchId: number;
  role: StaffRole;
  displayName: string;
};
type ShiftStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";
type ShiftRecord = {
  id: number;
  branchId: number;
  staffId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  notes: string | null;
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const ACTIVE_SHIFT_STATUSES = new Set<ShiftStatus>(["scheduled", "confirmed", "completed"]);
const shiftStatusSchema = z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]);

function badRequest(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

function notFound(message = "Record not found"): never {
  throw new TRPCError({ code: "NOT_FOUND", message });
}

function parseCalendarDate(value: string): Date {
  const match = DATE_RE.exec(value);
  if (!match) badRequest("Date must use YYYY-MM-DD format");

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    badRequest("Date must be a real calendar date");
  }
  return date;
}

function formatCalendarDate(date: Date): string {
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

function addCalendarDays(value: string, days: number): string {
  const date = parseCalendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatCalendarDate(date);
}

function validateDateRange(startDate: string, endDate: string): void {
  const start = parseCalendarDate(startDate);
  const end = parseCalendarDate(endDate);
  if (end < start) badRequest("End date must not be before start date");

  const inclusiveDays = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (inclusiveDays > 366) badRequest("Date ranges must be 366 days or less");
}

function timeToMinutes(value: string): number {
  if (!TIME_RE.test(value)) badRequest("Time must use HH:MM 24-hour format");
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function validateShiftTimes(startTime: string, endTime: string): void {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === end) badRequest("Shift start and end times must be different");
}

function shiftInterval(shift: Pick<ShiftRecord, "date" | "startTime" | "endTime">): { start: number; end: number } {
  const date = parseCalendarDate(shift.date);
  const start = date.getTime() + timeToMinutes(shift.startTime) * 60 * 1000;
  let end = date.getTime() + timeToMinutes(shift.endTime) * 60 * 1000;
  // Earlier end times are the following day. Equal times are invalid for all
  // new or changed shifts and treated as a zero-length legacy interval here.
  if (end < start) end += 24 * 60 * 60 * 1000;
  return { start, end };
}

function shiftsOverlap(left: Pick<ShiftRecord, "date" | "startTime" | "endTime">, right: Pick<ShiftRecord, "date" | "startTime" | "endTime">): boolean {
  const leftInterval = shiftInterval(left);
  const rightInterval = shiftInterval(right);
  return leftInterval.start < rightInterval.end && rightInterval.start < leftInterval.end;
}

function melbourneToday(): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

async function requireStaff(ctx: unknown): Promise<AuthenticatedStaff> {
  const staff = await getStaffFromContext(ctx);
  if (!staff) throw new TRPCError({ code: "UNAUTHORIZED" });
  return staff;
}

function canManageBranch(staff: AuthenticatedStaff, branchId: number): boolean {
  return staff.role === "owner" || (staff.role === "manager" && staff.branchId === branchId);
}

function requireBranchManager(staff: AuthenticatedStaff, branchId: number): void {
  if (!canManageBranch(staff, branchId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit schedules for your own branch" });
  }
}

function shouldIncludeWages(staff: AuthenticatedStaff): boolean {
  return staff.role === "owner";
}

async function getBranchOrThrow(db: any, branchId: number): Promise<{ id: number; name: string }> {
  const [branch] = await db
    .select({ id: branches.id, name: branches.name })
    .from(branches)
    .where(eq(branches.id, branchId))
    .limit(1);
  if (!branch) notFound("Branch not found");
  return branch;
}

async function getShiftOrThrow(db: any, id: number): Promise<ShiftRecord> {
  const [shift] = await db.select().from(staffShifts).where(eq(staffShifts.id, id)).limit(1);
  if (!shift) notFound("Shift not found");
  return shift as ShiftRecord;
}

async function assertActiveBranchStaff(db: any, staffId: number, branchId: number): Promise<void> {
  const [targetStaff] = await db
    .select({ id: staffMembers.id })
    .from(staffMembers)
    .where(
      and(
        eq(staffMembers.id, staffId),
        eq(staffMembers.branchId, branchId),
        eq(staffMembers.isActive, true),
      ),
    )
    .limit(1);

  if (!targetStaff) {
    badRequest("Assigned staff must be active and belong to the selected branch");
  }
}

async function assertNoActiveShiftOverlap(
  db: any,
  candidate: Pick<ShiftRecord, "id" | "staffId" | "date" | "startTime" | "endTime" | "status">,
  excludeShiftId?: number,
): Promise<void> {
  if (!ACTIVE_SHIFT_STATUSES.has(candidate.status)) return;

  // An existing overnight shift can start on the previous date; a candidate
  // overnight shift can meet a shift that starts on the next date.
  const nearbyShifts = await db
    .select()
    .from(staffShifts)
    .where(
      and(
        eq(staffShifts.staffId, candidate.staffId),
        gte(staffShifts.date, addCalendarDays(candidate.date, -1)),
        lte(staffShifts.date, addCalendarDays(candidate.date, 1)),
      ),
    );

  const conflict = (nearbyShifts as ShiftRecord[]).find((existing) =>
    existing.id !== excludeShiftId &&
    ACTIVE_SHIFT_STATUSES.has(existing.status) &&
    shiftsOverlap(candidate, existing),
  );
  if (conflict) {
    badRequest("Assigned staff already has an overlapping active shift");
  }
}

function workbookShifts(
  shifts: ShiftRecord[],
  staffList: Array<{ id: number; displayName: string; hourlyRate: string }>,
  includeWages: boolean,
): WorkbookShift[] {
  const staffById = new Map(staffList.map((member) => [member.id, member]));
  return shifts.map((shift) => {
    const member = staffById.get(shift.staffId);
    return {
      ...shift,
      staffName: member?.displayName ?? "Unknown",
      hourlyRate: includeWages ? member?.hourlyRate ?? null : null,
    };
  });
}

async function createWorkbookData(
  db: any,
  branchId: number,
  startDate: string,
  endDate: string,
  includeWages: boolean,
): Promise<{ buffer: Buffer; filename: string }> {
  validateDateRange(startDate, endDate);
  const branch = await getBranchOrThrow(db, branchId);
  const shifts = (await db
    .select()
    .from(staffShifts)
    .where(
      and(
        eq(staffShifts.branchId, branchId),
        gte(staffShifts.date, startDate),
        lte(staffShifts.date, endDate),
      ),
    )) as ShiftRecord[];
  const staffList = await db
    .select({ id: staffMembers.id, displayName: staffMembers.displayName, hourlyRate: staffMembers.hourlyRate })
    .from(staffMembers)
    .where(eq(staffMembers.branchId, branchId));
  const filename = shiftWorkbookFilename(branch.name, startDate, endDate);
  const buffer = await buildShiftWorkbook({
    branch,
    shifts: workbookShifts(shifts, staffList, includeWages),
    includeWages,
  });
  return { buffer, filename };
}

type SavedWorkbook = { url: string; filename: string };
type SnapshotResult = { workbook: SavedWorkbook | null; workbookError?: string };

async function saveWeeklyBranchSnapshot(
  db: any,
  branchId: number,
  scheduleDate: string,
  includeWages: boolean,
): Promise<SnapshotResult> {
  try {
    const { startDate, endDate } = mondayToSundayForCalendarDate(scheduleDate);
    const { buffer, filename } = await createWorkbookData(db, branchId, startDate, endDate, includeWages);
    const visibilityFolder = includeWages ? "owner-wages" : "schedule-no-wages";
    const stored = await storagePut(
      `staff-schedules/branch-${branchId}/weekly/${visibilityFolder}/${filename}`,
      buffer,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    return { workbook: { url: stored.url, filename } };
  } catch (error) {
    // A completed database mutation must never be reported as an XLSX success
    // and must not be rolled back merely because object storage is unavailable.
    console.error("[Shifts] Unable to save weekly workbook snapshot", error);
    return { workbook: null, workbookError: "Schedule was saved, but its workbook snapshot could not be saved." };
  }
}

async function saveAffectedWeeklySnapshots(
  db: any,
  branchId: number,
  dates: string[],
  callerCanSeeWages: boolean,
): Promise<SnapshotResult> {
  try {
    const uniqueWeeks = new Map<string, string>();
    for (const date of dates) {
      const week = mondayToSundayForCalendarDate(date);
      uniqueWeeks.set(`${week.startDate}:${week.endDate}`, date);
    }

    let primary: SnapshotResult = { workbook: null };
    const errors: string[] = [];
    // Upload both variants every time. Their distinct paths prevent a public
    // storage URL made for a manager/staff request from ever containing owner
    // wage fields, while an owner receives the richer generated file.
    for (const date of Array.from(uniqueWeeks.values())) {
      const noWages = await saveWeeklyBranchSnapshot(db, branchId, date, false);
      const withWages = await saveWeeklyBranchSnapshot(db, branchId, date, true);
      const callerResult = callerCanSeeWages ? withWages : noWages;
      primary = callerResult;
      if (noWages.workbookError) errors.push(noWages.workbookError);
      if (withWages.workbookError) errors.push(withWages.workbookError);
    }

    if (errors.length > 0) {
      return { ...primary, workbookError: errors[0] };
    }
    return primary;
  } catch (error) {
    console.error("[Shifts] Unable to prepare weekly workbook snapshot", error);
    return { workbook: null, workbookError: "Schedule was saved, but its workbook snapshot could not be saved." };
  }
}

export const shiftsRouter = router({
  // All authenticated staff use the shared, three-branch schedule read view.
  listBranches: publicProcedure.query(async ({ ctx }) => {
    await requireStaff(ctx);
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const result = await db.select({ id: branches.id, name: branches.name }).from(branches);
    return (result as Array<{ id: number; name: string }>).sort((left, right) => left.id - right.id);
  }),

  listByBranch: publicProcedure
    .input(z.object({ branchId: z.number().int().positive(), startDate: z.string(), endDate: z.string() }))
    .query(async ({ input, ctx }) => {
      const staff = await requireStaff(ctx);
      validateDateRange(input.startDate, input.endDate);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await getBranchOrThrow(db, input.branchId);

      const shifts = (await db
        .select()
        .from(staffShifts)
        .where(
          and(
            eq(staffShifts.branchId, input.branchId),
            gte(staffShifts.date, input.startDate),
            lte(staffShifts.date, input.endDate),
          ),
        )) as ShiftRecord[];
      const staffList = await db
        .select({ id: staffMembers.id, displayName: staffMembers.displayName, hourlyRate: staffMembers.hourlyRate })
        .from(staffMembers)
        .where(eq(staffMembers.branchId, input.branchId));
      const staffById = new Map(staffList.map((member) => [member.id, member]));

      return shifts.map((shift) => ({
        ...shift,
        staffName: staffById.get(shift.staffId)?.displayName ?? "Unknown",
        hourlyRate: shouldIncludeWages(staff) ? staffById.get(shift.staffId)?.hourlyRate ?? null : null,
      }));
    }),

  myShifts: publicProcedure
    .input(z.object({ startDate: z.string().optional(), endDate: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const staff = await requireStaff(ctx);
      const startDate = input.startDate ?? melbourneToday();
      const endDate = input.endDate ?? addCalendarDays(startDate, 29);
      validateDateRange(startDate, endDate);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db
        .select()
        .from(staffShifts)
        .where(and(eq(staffShifts.staffId, staff.staffId), gte(staffShifts.date, startDate), lte(staffShifts.date, endDate)));
    }),

  create: publicProcedure
    .input(z.object({
      branchId: z.number().int().positive(),
      staffId: z.number().int().positive(),
      date: z.string(),
      startTime: z.string(),
      endTime: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const staff = await requireStaff(ctx);
      requireBranchManager(staff, input.branchId);
      parseCalendarDate(input.date);
      validateShiftTimes(input.startTime, input.endTime);

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await getBranchOrThrow(db, input.branchId);
      await assertActiveBranchStaff(db, input.staffId, input.branchId);
      await assertNoActiveShiftOverlap(db, { ...input, id: 0, status: "scheduled" });

      const [result] = await db.insert(staffShifts).values({
        branchId: input.branchId,
        staffId: input.staffId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        notes: input.notes || null,
        createdBy: staff.staffId,
      });
      const snapshot = await saveAffectedWeeklySnapshots(db, input.branchId, [input.date], shouldIncludeWages(staff));
      return { success: true, id: (result as { insertId: number }).insertId, ...snapshot };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.number().int().positive(),
      staffId: z.number().int().positive().optional(),
      date: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      status: shiftStatusSchema.optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const staff = await requireStaff(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const current = await getShiftOrThrow(db, input.id);
      requireBranchManager(staff, current.branchId);

      const next: ShiftRecord = {
        ...current,
        staffId: input.staffId ?? current.staffId,
        date: input.date ?? current.date,
        startTime: input.startTime ?? current.startTime,
        endTime: input.endTime ?? current.endTime,
        status: input.status ?? current.status,
        notes: input.notes ?? current.notes,
      };
      const scheduleWasChanged = input.staffId !== undefined || input.date !== undefined || input.startTime !== undefined || input.endTime !== undefined || input.status !== undefined;
      if (scheduleWasChanged) {
        parseCalendarDate(next.date);
        validateShiftTimes(next.startTime, next.endTime);
        await assertActiveBranchStaff(db, next.staffId, current.branchId);
        await assertNoActiveShiftOverlap(db, next, current.id);
      }

      const { id, ...updates } = input;
      const cleanUpdates = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== undefined));
      if (Object.keys(cleanUpdates).length > 0) {
        await db.update(staffShifts).set(cleanUpdates).where(eq(staffShifts.id, id));
      }
      const snapshot = await saveAffectedWeeklySnapshots(db, current.branchId, [current.date, next.date], shouldIncludeWages(staff));
      return { success: true, ...snapshot };
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const staff = await requireStaff(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const current = await getShiftOrThrow(db, input.id);
      requireBranchManager(staff, current.branchId);

      await db.delete(staffShifts).where(eq(staffShifts.id, input.id));
      const snapshot = await saveAffectedWeeklySnapshots(db, current.branchId, [current.date], shouldIncludeWages(staff));
      return { success: true, ...snapshot };
    }),

  requestSwap: publicProcedure
    .input(z.object({
      shiftId: z.number().int().positive(),
      targetStaffId: z.number().int().positive().optional(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const staff = await requireStaff(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const shift = await getShiftOrThrow(db, input.shiftId);

      if (shift.staffId !== staff.staffId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only swap your own shifts" });
      }
      if (input.targetStaffId !== undefined) {
        if (input.targetStaffId === staff.staffId) badRequest("Swap target must be a different staff member");
        await assertActiveBranchStaff(db, input.targetStaffId, shift.branchId);
        await assertNoActiveShiftOverlap(
          db,
          { ...shift, staffId: input.targetStaffId },
          shift.id,
        );
      }

      const [result] = await db.insert(shiftSwapRequests).values({
        shiftId: input.shiftId,
        requesterId: staff.staffId,
        targetStaffId: input.targetStaffId ?? null,
        reason: input.reason ?? null,
      });
      return { success: true, id: (result as { insertId: number }).insertId };
    }),

  listSwapRequests: publicProcedure
    .input(z.object({ branchId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const staff = await requireStaff(ctx);
      if (staff.role === "manager") requireBranchManager(staff, input.branchId);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await getBranchOrThrow(db, input.branchId);

      const requests = await db.select().from(shiftSwapRequests).orderBy(desc(shiftSwapRequests.createdAt));
      const shifts = (await db.select().from(staffShifts).where(eq(staffShifts.branchId, input.branchId))) as ShiftRecord[];
      const staffList = await db
        .select({ id: staffMembers.id, displayName: staffMembers.displayName })
        .from(staffMembers)
        .where(eq(staffMembers.branchId, input.branchId));
      const staffById = new Map(staffList.map((member) => [member.id, member.displayName]));
      const shiftById = new Map(shifts.map((shift) => [shift.id, shift]));

      return (requests as Array<{
        id: number;
        shiftId: number;
        requesterId: number;
        targetStaffId: number | null;
        status: "pending" | "accepted" | "rejected" | "cancelled";
        reason: string | null;
        respondedAt: Date | null;
        createdAt: Date;
      }>).filter((request) => {
        const requestShift = shiftById.get(request.shiftId);
        if (!requestShift) return false;
        if (staff.role === "owner" || staff.role === "manager") return true;
        return request.requesterId === staff.staffId || request.targetStaffId === staff.staffId;
      }).map((request) => ({
        ...request,
        requesterName: staffById.get(request.requesterId) ?? "Unknown",
        targetStaffName: request.targetStaffId ? staffById.get(request.targetStaffId) ?? "Unknown" : null,
        shift: shiftById.get(request.shiftId) ?? null,
      }));
    }),

  respondSwap: publicProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["accepted", "rejected"]) }))
    .mutation(async ({ input, ctx }) => {
      const staff = await requireStaff(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [request] = await db.select().from(shiftSwapRequests).where(eq(shiftSwapRequests.id, input.id)).limit(1);
      if (!request) notFound("Swap request not found");
      const shift = await getShiftOrThrow(db, request.shiftId);

      if (staff.role === "manager") requireBranchManager(staff, shift.branchId);
      if (staff.role === "staff" && request.targetStaffId !== staff.staffId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (request.status !== "pending") badRequest("This swap request has already been handled");

      let snapshot: SnapshotResult | undefined;
      if (input.status === "accepted" && request.targetStaffId) {
        await assertActiveBranchStaff(db, request.targetStaffId, shift.branchId);
        await assertNoActiveShiftOverlap(db, { ...shift, staffId: request.targetStaffId }, shift.id);
        await db.update(staffShifts).set({ staffId: request.targetStaffId }).where(eq(staffShifts.id, shift.id));
        snapshot = await saveAffectedWeeklySnapshots(db, shift.branchId, [shift.date], shouldIncludeWages(staff));
      }

      await db.update(shiftSwapRequests).set({ status: input.status, respondedAt: new Date() }).where(eq(shiftSwapRequests.id, input.id));
      return { success: true, ...(snapshot ?? {}) };
    }),

  listStaff: publicProcedure
    .input(z.object({ branchId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const staff = await requireStaff(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await getBranchOrThrow(db, input.branchId);

      const list = await db
        .select({
          id: staffMembers.id,
          displayName: staffMembers.displayName,
          role: staffMembers.role,
          hourlyRate: staffMembers.hourlyRate,
        })
        .from(staffMembers)
        .where(and(eq(staffMembers.branchId, input.branchId), eq(staffMembers.isActive, true)));

      return (list as Array<{ id: number; displayName: string; role: StaffRole; hourlyRate: string }>).map((member) => ({
        id: member.id,
        displayName: member.displayName,
        role: member.role,
        hourlyRate: shouldIncludeWages(staff) ? member.hourlyRate : null,
      }));
    }),

  exportWorkbook: publicProcedure
    .input(z.object({ branchId: z.number().int().positive(), startDate: z.string(), endDate: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const staff = await requireStaff(ctx);
      validateDateRange(input.startDate, input.endDate);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const includeWages = shouldIncludeWages(staff);
      const { buffer, filename } = await createWorkbookData(
        db,
        input.branchId,
        input.startDate,
        input.endDate,
        includeWages,
      );
      const visibilityFolder = includeWages ? "owner-wages" : "schedule-no-wages";
      const stored = await storagePut(
        `staff-schedules/branch-${input.branchId}/exports/${visibilityFolder}/${filename}`,
        buffer,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      return { url: stored.url, filename };
    }),
});
