import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildShiftWorkbook } from "./shiftWorkbook";

const tables = {
  branches: { id: "branches.id", name: "branches.name" },
  staffShifts: {
    id: "shifts.id",
    branchId: "shifts.branchId",
    staffId: "shifts.staffId",
    date: "shifts.date",
    startTime: "shifts.startTime",
    endTime: "shifts.endTime",
    status: "shifts.status",
    notes: "shifts.notes",
    createdAt: "shifts.createdAt",
  },
  staffMembers: {
    id: "staff.id",
    branchId: "staff.branchId",
    displayName: "staff.displayName",
    hourlyRate: "staff.hourlyRate",
    role: "staff.role",
    isActive: "staff.isActive",
  },
  shiftSwapRequests: {
    id: "swaps.id",
    shiftId: "swaps.shiftId",
    requesterId: "swaps.requesterId",
    targetStaffId: "swaps.targetStaffId",
    status: "swaps.status",
    reason: "swaps.reason",
    respondedAt: "swaps.respondedAt",
    createdAt: "swaps.createdAt",
  },
};

let currentStaff: { staffId: number; branchId: number; role: "staff" | "manager" | "owner"; displayName: string } | null = null;
const selectResults: unknown[][] = [];
const insertValues = vi.fn().mockResolvedValue([{ insertId: 901 }]);
const updateWhere = vi.fn().mockResolvedValue(undefined);
const deleteWhere = vi.fn().mockResolvedValue(undefined);

function nextSelectRows(): unknown[] {
  return selectResults.shift() ?? [];
}

function selectQuery(rows: unknown[]) {
  const query: {
    from: ReturnType<typeof vi.fn>;
    where: ReturnType<typeof vi.fn>;
    orderBy: ReturnType<typeof vi.fn>;
    limit: ReturnType<typeof vi.fn>;
    then: (resolve: (value: unknown[]) => unknown, reject?: (reason: unknown) => unknown) => Promise<unknown>;
  } = {
    from: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(async () => rows),
    then: (resolve, reject) => Promise.resolve(rows).then(resolve, reject),
  };
  query.from.mockReturnValue(query);
  query.where.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);
  return query;
}

const mockDb = {
  select: vi.fn(() => selectQuery(nextSelectRows())),
  insert: vi.fn(() => ({ values: insertValues })),
  update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
  delete: vi.fn(() => ({ where: deleteWhere })),
};

const storagePut = vi.fn(async (key: string) => ({ key, url: `/manus-storage/${key}` }));

vi.mock("./db", () => ({ getDb: vi.fn(async () => mockDb) }));
vi.mock("./storage", () => ({ storagePut }));
vi.mock("./routers/staffAuth", () => ({ getStaffFromContext: vi.fn(async () => currentStaff) }));
vi.mock("../drizzle/schema", () => tables);
vi.mock("drizzle-orm", () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  gte: vi.fn((...args: unknown[]) => args),
  lte: vi.fn((...args: unknown[]) => args),
  desc: vi.fn((value: unknown) => value),
}));

const { shiftsRouter } = await import("./routers/shifts");

const HAWTHORN = { id: 1, name: "Hawthorn" };
const activeHawthornStaff = { id: 41, displayName: "Ava", role: "staff", hourlyRate: "29.50" };
const call = () => shiftsRouter.createCaller({} as any);

function queue(...rows: unknown[][]): void {
  selectResults.push(...rows);
}

describe("secure staff schedule procedures", () => {
  beforeEach(() => {
    currentStaff = null;
    selectResults.length = 0;
    vi.clearAllMocks();
    insertValues.mockResolvedValue([{ insertId: 901 }]);
    storagePut.mockResolvedValue({ key: "saved.xlsx", url: "/manus-storage/saved.xlsx" });
  });

  it("allows shared schedule reads but prevents a manager from editing another branch", async () => {
    currentStaff = { staffId: 11, branchId: 1, role: "manager", displayName: "Hawthorn manager" };

    await expect(call().create({
      branchId: 2,
      staffId: 41,
      date: "2026-10-26",
      startTime: "09:00",
      endTime: "17:00",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });

    queue([HAWTHORN], [{ id: 7, branchId: 1, staffId: 41, date: "2026-10-26", startTime: "09:00", endTime: "17:00", status: "scheduled", notes: null }], [activeHawthornStaff]);
    await expect(call().listByBranch({ branchId: 1, startDate: "2026-10-26", endDate: "2026-10-26" })).resolves.toHaveLength(1);
  });

  it("masks hourly rates for manager/staff responses and returns them only to an owner", async () => {
    currentStaff = { staffId: 11, branchId: 1, role: "manager", displayName: "Manager" };
    queue([HAWTHORN], [activeHawthornStaff]);
    await expect(call().listStaff({ branchId: 1 })).resolves.toEqual([{
      id: 41,
      displayName: "Ava",
      role: "staff",
      hourlyRate: null,
    }]);

    currentStaff = { staffId: 1, branchId: 1, role: "owner", displayName: "Owner" };
    queue([HAWTHORN], [activeHawthornStaff]);
    await expect(call().listStaff({ branchId: 1 })).resolves.toEqual([{
      id: 41,
      displayName: "Ava",
      role: "staff",
      hourlyRate: "29.50",
    }]);
  });

  it("rejects invalid dates, equal times, and overlong read ranges before database access", async () => {
    currentStaff = { staffId: 11, branchId: 1, role: "manager", displayName: "Manager" };

    await expect(call().create({
      branchId: 1,
      staffId: 41,
      date: "2026-02-30",
      startTime: "09:00",
      endTime: "17:00",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await expect(call().create({
      branchId: 1,
      staffId: 41,
      date: "2026-10-26",
      startTime: "09:00",
      endTime: "09:00",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await expect(call().listByBranch({
      branchId: 1,
      startDate: "2026-01-01",
      endDate: "2027-01-02",
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("rejects a daytime shift that overlaps the previous day's active overnight shift", async () => {
    currentStaff = { staffId: 11, branchId: 1, role: "manager", displayName: "Manager" };
    queue(
      [HAWTHORN],
      [{ id: 41 }],
      [{ id: 72, branchId: 1, staffId: 41, date: "2026-10-26", startTime: "22:00", endTime: "06:00", status: "confirmed", notes: null }],
    );

    await expect(call().create({
      branchId: 1,
      staffId: 41,
      date: "2026-10-27",
      startTime: "05:30",
      endTime: "12:00",
    })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Assigned staff already has an overlapping active shift" });
    expect(insertValues).not.toHaveBeenCalled();
  });

  it("permits owner schedule creation and returns a real saved owner workbook link", async () => {
    currentStaff = { staffId: 1, branchId: 1, role: "owner", displayName: "Owner" };
    // Branch, assigned active staff, conflict search, then both workbook variants.
    queue(
      [HAWTHORN], [{ id: 41 }], [],
      [HAWTHORN], [], [],
      [HAWTHORN], [], [],
    );

    const result = await call().create({
      branchId: 1,
      staffId: 41,
      date: "2026-10-26",
      startTime: "09:00",
      endTime: "17:00",
    });

    expect(result).toMatchObject({ success: true, id: 901, workbook: { url: "/manus-storage/saved.xlsx" } });
    expect(storagePut).toHaveBeenCalledTimes(2);
    expect(storagePut.mock.calls.map(([key]) => key)).toEqual(expect.arrayContaining([
      expect.stringContaining("schedule-no-wages"),
      expect.stringContaining("owner-wages"),
    ]));
  });
});

describe("shift workbook", () => {
  it("creates a readable XLSX with numeric overnight totals and excluded cancelled hours", async () => {
    const bytes = await buildShiftWorkbook({
      branch: HAWTHORN,
      includeWages: true,
      shifts: [
        { id: 1, branchId: 1, staffId: 41, staffName: "Ava", hourlyRate: "30.00", date: "2026-10-26", startTime: "09:00", endTime: "17:00", status: "scheduled", notes: "Opening" },
        { id: 2, branchId: 1, staffId: 41, staffName: "Ava", hourlyRate: "30.00", date: "2026-10-27", startTime: "22:00", endTime: "06:00", status: "confirmed", notes: null },
        { id: 3, branchId: 1, staffId: 41, staffName: "Ava", hourlyRate: "30.00", date: "2026-10-28", startTime: "10:00", endTime: "12:00", status: "cancelled", notes: null },
      ],
    });

    const parsed = new ExcelJS.Workbook();
    await parsed.xlsx.load(bytes);
    expect(parsed.worksheets.map((sheet) => sheet.name)).toEqual(expect.arrayContaining(["Summary", "Shift details"]));

    const summary = parsed.getWorksheet("Summary")!;
    expect(summary.getRow(2).getCell(1).value).toBe(41);
    expect(summary.getRow(2).getCell(6).value).toBe(16);
    expect(summary.getRow(2).getCell(7).value).toBe(480);

    const details = parsed.getWorksheet("Shift details")!;
    expect(details.getRow(3).getCell(9).value).toBe(8);
    expect(details.getRow(4).getCell(9).value).toBe(0);
  });
});
