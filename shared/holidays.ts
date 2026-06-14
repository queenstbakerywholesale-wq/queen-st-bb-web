/**
 * Victorian (Australia) Public Holidays 2026
 * Used for auto-applying 15% holiday surcharge
 * Format: YYYY-MM-DD
 */
export const VIC_PUBLIC_HOLIDAYS_2026: string[] = [
  "2026-01-01", // New Year's Day
  "2026-01-26", // Australia Day
  "2026-03-09", // Labour Day (VIC)
  "2026-04-03", // Good Friday
  "2026-04-04", // Saturday before Easter Sunday
  "2026-04-06", // Easter Monday
  "2026-04-25", // ANZAC Day
  "2026-06-08", // Queen's Birthday (VIC)
  "2026-09-25", // Friday before AFL Grand Final (VIC)
  "2026-11-03", // Melbourne Cup Day (Metro Melbourne)
  "2026-12-25", // Christmas Day
  "2026-12-26", // Boxing Day
  "2026-12-28", // Additional day (Boxing Day falls on Saturday)
];

/**
 * Check if a given date is a VIC public holiday
 * @param date - Date to check (defaults to today in AEST)
 */
export function isPublicHoliday(date?: Date): boolean {
  const d = date || new Date();
  // Convert to AEST (UTC+10) for accurate date comparison
  const aest = new Date(d.getTime() + (10 * 60 * 60 * 1000));
  const dateStr = aest.toISOString().slice(0, 10);
  return VIC_PUBLIC_HOLIDAYS_2026.includes(dateStr);
}

/**
 * Check if a given date is a weekend (Saturday or Sunday)
 * @param date - Date to check (defaults to today in AEST)
 */
export function isWeekend(date?: Date): boolean {
  const d = date || new Date();
  // Convert to AEST (UTC+10)
  const aest = new Date(d.getTime() + (10 * 60 * 60 * 1000));
  const day = aest.getUTCDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

/**
 * Get the auto-surcharge type based on current date
 * Holiday takes priority over weekend
 */
export function getAutoSurchargeType(): "none" | "weekend" | "holiday" {
  if (isPublicHoliday()) return "holiday";
  if (isWeekend()) return "weekend";
  return "none";
}

/** Categories exempt from surcharge (goods/merchandise) */
export const SURCHARGE_EXEMPT_CATEGORIES = ["BB Goods", "Etc"];
