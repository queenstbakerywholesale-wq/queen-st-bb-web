export const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
export interface CalendarShift {
  id: number; branchId: number; staffId: number; date: string; startTime: string; endTime: string;
  staffName: string; status: string; notes?: string | null; hourlyRate?: string | null;
}
export function melbourneToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function addCalendarDays(date: string, days: number) {
  const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
}
export function mondayOf(date: string) {
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay(); return addCalendarDays(date, -((weekday + 6) % 7));
}
export function timeMinutes(time: string) { const [h, m] = time.split(":").map(Number); return h * 60 + m; }
export function scheduledHours(start: string, end: string) {
  let minutes = timeMinutes(end) - timeMinutes(start); if (minutes < 0) minutes += 1440; return minutes / 60;
}
export function countedShift(shift: CalendarShift) { return !["cancelled", "no_show"].includes(shift.status); }
export function summarizeStaff(shifts: CalendarShift[], days: string[]) {
  const map = new Map<number, { id: number; name: string; days: number[]; hours: number; wage: number; rateMissing: boolean; shifts: number }>();
  for (const shift of shifts.filter(countedShift)) {
    let row = map.get(shift.staffId);
    if (!row) { row = { id: shift.staffId, name: shift.staffName, days: days.map(() => 0), hours: 0, wage: 0, rateMissing: false, shifts: 0 }; map.set(row.id, row); }
    const hours = scheduledHours(shift.startTime, shift.endTime); const day = days.indexOf(shift.date);
    if (day >= 0) { row.days[day] += hours; row.hours += hours; row.wage += hours * Number(shift.hourlyRate || 0); row.rateMissing ||= Number(shift.hourlyRate || 0) <= 0; row.shifts++; }
  }
  return Array.from(map.values()).filter(row => row.shifts > 0).sort((a, b) => a.name.localeCompare(b.name));
}
export interface ShiftBlock { shift: CalendarShift; start: number; end: number; overnight: boolean; lane: number; lanes: number; }
export function blocksForDay(shifts: CalendarShift[], date: string): ShiftBlock[] {
  const blocks: ShiftBlock[] = [];
  for (const shift of shifts.filter(countedShift)) {
    const start = timeMinutes(shift.startTime); const end = timeMinutes(shift.endTime); const overnight = end < start;
    if (shift.date === date) blocks.push({ shift, start, end: overnight ? 1440 : end, overnight, lane: 0, lanes: 1 });
    if (overnight && addCalendarDays(shift.date, 1) === date && end > 0) blocks.push({ shift, start: 0, end, overnight, lane: 0, lanes: 1 });
  }
  blocks.sort((a, b) => a.start - b.start || b.end - a.end);
  let group: ShiftBlock[] = []; let ends: number[] = []; let groupEnd = -1;
  const finish = () => { for (const block of group) block.lanes = ends.length; group = []; ends = []; };
  for (const block of blocks) {
    if (block.start >= groupEnd) { finish(); groupEnd = -1; }
    let lane = ends.findIndex(end => end <= block.start); if (lane < 0) lane = ends.length;
    ends[lane] = block.end; block.lane = lane; group.push(block); groupEnd = Math.max(groupEnd, block.end);
  }
  finish(); return blocks;
}
export const STAFF_COLORS = ["#2563eb", "#7c3aed", "#0f766e", "#b45309", "#be185d", "#0369a1", "#4d7c0f"];
export function staffColor(id: number) { return STAFF_COLORS[Math.abs(id) % STAFF_COLORS.length]; }
export function branchLabel(name: string) {
  if (/CBD|City/i.test(name)) return "시티 (CBD)";
  if (/Hawthorn/i.test(name)) return "호손 (Hawthorn)";
  if (/Windsor/i.test(name)) return "윈저 (Windsor)";
  return name;
}
export function safeCsvCell(value: unknown) {
  let text = String(value ?? ""); if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"', '""')}"`;
}
