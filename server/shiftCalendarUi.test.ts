import { describe, expect, it } from 'vitest';
import { mondayOf, melbourneToday, addCalendarDays, scheduledHours, summarizeStaff, blocksForDay, safeCsvCell, type CalendarShift } from '../client/src/lib/shiftCalendar';
const days = Array.from({ length: 7 }, (_, i) => addCalendarDays('2026-10-19', i));
const shift = (overrides: Partial<CalendarShift> = {}): CalendarShift => ({ id: 1, staffId: 10, branchId: 3, staffName: 'Alex', date: days[0], startTime: '12:00', endTime: '20:00', status: 'scheduled', hourlyRate: '30', ...overrides });
describe('staff calendar UI calculations', () => {
  it('uses Melbourne business date instead of UTC/browser date', () => expect(melbourneToday(new Date('2026-10-18T14:00:00Z'))).toBe('2026-10-19'));
  it('puts a Sunday in the preceding Monday week', () => expect(mondayOf('2026-10-25')).toBe('2026-10-19'));
  it('handles DST with plain calendar date arithmetic', () => { expect(addCalendarDays('2026-10-03', 1)).toBe('2026-10-04'); expect(addCalendarDays('2026-12-31', 1)).toBe('2027-01-01'); });
  it('calculates hours with minutes and overnight continuation', () => { expect(scheduledHours('12:15','20:45')).toBe(8.5); expect(scheduledHours('22:30','02:00')).toBe(3.5); });
  it('separates employees with identical names and excludes cancelled/no show', () => {
    const summary = summarizeStaff([shift(), shift({ id: 2, staffId: 11, startTime: '14:00', endTime: '18:30' }), shift({ id: 3, status: 'cancelled' }), shift({ id: 4, status: 'no_show' })], days);
    expect(summary).toHaveLength(2); expect(summary[0].hours).toBe(8); expect(summary[1].hours).toBe(4.5); expect(summary[0].wage).toBe(240);
  });
  it('keeps previous Sunday overnight blocks on Monday without counting previous-week hours', () => {
    const overnight = shift({ date: '2026-10-18', startTime: '22:00', endTime: '02:00' });
    expect(blocksForDay([overnight], '2026-10-19')[0]).toMatchObject({ start: 0, end: 120, overnight: true });
    expect(summarizeStaff([overnight], days)).toHaveLength(0);
  });
  it('assigns distinct lanes to simultaneous shifts', () => {
    const blocks = blocksForDay([shift(), shift({ id: 2, staffId: 11, startTime: '13:00', endTime: '17:00' }), shift({ id: 3, staffId: 12, startTime: '20:00', endTime: '22:00' })], days[0]);
    expect(blocks[0].lanes).toBe(2); expect(blocks[1].lane).toBe(1); expect(blocks[2].lanes).toBe(1);
  });
  it('escapes CSV strings including formula injection', () => { expect(safeCsvCell('=SUM(1,2)')).toBe('"\'=SUM(1,2)"'); expect(safeCsvCell('A"B')).toBe('"A""B"'); });
});
