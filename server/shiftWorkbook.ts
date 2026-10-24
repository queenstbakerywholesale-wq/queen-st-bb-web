import ExcelJS from "exceljs";

export const EXCLUDED_FROM_SCHEDULED_HOURS = new Set(["cancelled", "no_show"]);

export type WorkbookShiftStatus =
  | "scheduled"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

export interface WorkbookBranch {
  id: number;
  name: string;
}

export interface WorkbookShift {
  id: number;
  branchId: number;
  staffId: number;
  date: string;
  startTime: string;
  endTime: string;
  status: WorkbookShiftStatus;
  notes: string | null;
  staffName: string;
  hourlyRate: string | null;
}

export interface ShiftWorkbookInput {
  branch: WorkbookBranch;
  shifts: WorkbookShift[];
  includeWages: boolean;
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateParts(date: string): { year: number; month: number; day: number } {
  const match = DATE_RE.exec(date);
  if (!match) throw new Error(`Invalid calendar date: ${date}`);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${date}`);
  }

  return { year, month, day };
}

function dateFromCalendarString(date: string): Date {
  const { year, month, day } = parseDateParts(date);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatCalendarDate(date: Date): string {
  return [
    date.getUTCFullYear().toString().padStart(4, "0"),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

function timeToMinutes(time: string): number {
  if (!TIME_RE.test(time)) throw new Error(`Invalid shift time: ${time}`);
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Returns the scheduled duration in hours. A strictly earlier end time is an
 * overnight end on the following calendar day; equal times are a zero-length
 * interval and are invalid at the router boundary.
 */
export function shiftDurationHours(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const durationMinutes = end < start ? end + 24 * 60 - start : end - start;
  return durationMinutes / 60;
}

export function scheduledHoursForShift(shift: Pick<WorkbookShift, "startTime" | "endTime" | "status">): number {
  if (EXCLUDED_FROM_SCHEDULED_HOURS.has(shift.status)) return 0;
  return shiftDurationHours(shift.startTime, shift.endTime);
}

/** Calendar-week boundaries for a YYYY-MM-DD Melbourne business-date string. */
export function mondayToSundayForCalendarDate(date: string): { startDate: string; endDate: string } {
  const monday = dateFromCalendarString(date);
  // JS Sunday = 0, while this schedule's week begins on Monday.
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { startDate: formatCalendarDate(monday), endDate: formatCalendarDate(sunday) };
}

export function weekdayForCalendarDate(date: string): string {
  const weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return weekday[dateFromCalendarString(date).getUTCDay()]!;
}

function safeFilenamePart(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "branch";
}

export function shiftWorkbookFilename(branchName: string, startDate: string, endDate: string): string {
  // Validate date strings before they become part of a storage filename.
  parseDateParts(startDate);
  parseDateParts(endDate);
  return `${safeFilenamePart(branchName)}-staff-schedule-${startDate}-to-${endDate}.xlsx`;
}

function toHourlyRate(value: string | null): number | null {
  if (value === null) return null;
  const rate = Number(value);
  return Number.isFinite(rate) ? rate : null;
}

function worksheetColumns(worksheet: ExcelJS.Worksheet, widths: number[]): void {
  worksheet.columns = widths.map((width) => ({ width }));
  const header = worksheet.getRow(1);
  header.font = { bold: true };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EDF0" } };
  header.alignment = { vertical: "middle" };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
}

function staffWorksheetName(staffName: string, staffId: number, usedNames: Set<string>): string {
  const base = `Staff ${staffId} ${staffName}`
    .replace(/[\\/*?:\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim() || `Staff ${staffId}`;
  const maxBaseLength = 31;
  let name = base.slice(0, maxBaseLength);
  let counter = 2;
  while (usedNames.has(name.toLowerCase())) {
    const suffix = ` (${counter})`;
    name = `${base.slice(0, maxBaseLength - suffix.length)}${suffix}`;
    counter += 1;
  }
  usedNames.add(name.toLowerCase());
  return name;
}

/**
 * Builds an XLSX buffer from schedule data already loaded from the database.
 * The caller decides whether wages are included, so non-owners never receive
 * wage columns in a workbook generated for their request.
 */
export async function buildShiftWorkbook({ branch, shifts, includeWages }: ShiftWorkbookInput): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Queen St BB";
  workbook.created = new Date();
  workbook.modified = new Date();
  // Sheet names and contents provide the schedule label; this ExcelJS version
  // does not expose a typed core-document title property.

  const sortedShifts = [...shifts].sort((left, right) =>
    left.date.localeCompare(right.date) ||
    left.startTime.localeCompare(right.startTime) ||
    left.staffName.localeCompare(right.staffName) ||
    left.id - right.id,
  );
  const dates = Array.from(new Set(sortedShifts.map((shift) => shift.date))).sort();
  const staff = Array.from(
    new Map(
      sortedShifts.map((shift) => [
        shift.staffId,
        { id: shift.staffId, name: shift.staffName, hourlyRate: shift.hourlyRate },
      ]),
    ).values(),
  ).sort((left, right) => left.name.localeCompare(right.name) || left.id - right.id);

  const summary = workbook.addWorksheet("Summary");
  const summaryHeaders = ["Staff ID", "Staff name", ...dates, "Total scheduled hours"];
  if (includeWages) summaryHeaders.push("Estimated wages");
  summary.addRow(summaryHeaders);
  worksheetColumns(summary, [12, 26, ...dates.map(() => 14), 22, ...(includeWages ? [18] : [])]);

  for (const member of staff) {
    const memberShifts = sortedShifts.filter((shift) => shift.staffId === member.id);
    const hourlyRate = toHourlyRate(member.hourlyRate);
    const perDay = dates.map((date) =>
      memberShifts
        .filter((shift) => shift.date === date)
        .reduce((total, shift) => total + scheduledHoursForShift(shift), 0),
    );
    const totalHours = perDay.reduce((total, hours) => total + hours, 0);
    const row: (string | number | null)[] = [member.id, member.name, ...perDay, totalHours];
    if (includeWages) row.push(hourlyRate === null ? null : totalHours * hourlyRate);
    summary.addRow(row);
  }
  for (let col = 3; col <= 2 + dates.length + 1; col += 1) {
    summary.getColumn(col).numFmt = "0.00";
  }
  if (includeWages) summary.getColumn(summary.columnCount).numFmt = "$#,##0.00";

  const details = workbook.addWorksheet("Shift details");
  const detailHeaders = [
    "Shift ID",
    "Branch",
    "Date",
    "Weekday",
    "Staff ID",
    "Staff name",
    "Start",
    "End",
    "Scheduled hours",
    "Status",
    "Notes",
  ];
  if (includeWages) detailHeaders.push("Hourly rate", "Estimated wage");
  details.addRow(detailHeaders);
  worksheetColumns(details, [10, 20, 14, 13, 11, 24, 10, 10, 18, 14, 32, ...(includeWages ? [14, 17] : [])]);

  for (const shift of sortedShifts) {
    const scheduledHours = scheduledHoursForShift(shift);
    const hourlyRate = toHourlyRate(shift.hourlyRate);
    const row: (string | number | null)[] = [
      shift.id,
      branch.name,
      shift.date,
      weekdayForCalendarDate(shift.date),
      shift.staffId,
      shift.staffName,
      shift.startTime,
      shift.endTime,
      scheduledHours,
      shift.status,
      shift.notes,
    ];
    if (includeWages) row.push(hourlyRate, hourlyRate === null ? null : scheduledHours * hourlyRate);
    details.addRow(row);
  }
  details.getColumn(9).numFmt = "0.00";
  if (includeWages) {
    details.getColumn(12).numFmt = "$#,##0.00";
    details.getColumn(13).numFmt = "$#,##0.00";
  }

  const usedSheetNames = new Set(["summary", "shift details"]);
  // Per-staff views are useful for an ordinary small branch roster. Keep the
  // workbook practical for exceptional large exports by capping at 50 sheets.
  for (const member of staff.slice(0, 50)) {
    const sheet = workbook.addWorksheet(staffWorksheetName(member.name, member.id, usedSheetNames));
    const headers = ["Shift ID", "Branch", "Date", "Weekday", "Start", "End", "Scheduled hours", "Status", "Notes"];
    if (includeWages) headers.push("Hourly rate", "Estimated wage");
    sheet.addRow(headers);
    worksheetColumns(sheet, [10, 20, 14, 13, 10, 10, 18, 14, 32, ...(includeWages ? [14, 17] : [])]);

    for (const shift of sortedShifts.filter((item) => item.staffId === member.id)) {
      const scheduledHours = scheduledHoursForShift(shift);
      const hourlyRate = toHourlyRate(shift.hourlyRate);
      const row: (string | number | null)[] = [
        shift.id,
        branch.name,
        shift.date,
        weekdayForCalendarDate(shift.date),
        shift.startTime,
        shift.endTime,
        scheduledHours,
        shift.status,
        shift.notes,
      ];
      if (includeWages) row.push(hourlyRate, hourlyRate === null ? null : scheduledHours * hourlyRate);
      sheet.addRow(row);
    }
    sheet.getColumn(7).numFmt = "0.00";
    if (includeWages) {
      sheet.getColumn(10).numFmt = "$#,##0.00";
      sheet.getColumn(11).numFmt = "$#,##0.00";
    }
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
