export const DEPT_START_MINUTES = 8 * 60; // 08:00 AM = 480 mins
export const DEPT_END_MINUTES = 17 * 60;  // 05:00 PM = 1020 mins
export const TOTAL_OPERATING_MINUTES = DEPT_END_MINUTES - DEPT_START_MINUTES; // 540 mins (9 hours)

// Mandatory Department Lunch Break: 10:30 AM (630m) to 11:45 AM (705m)
export const LUNCH_BREAK_START_MINUTES = 10 * 60 + 30; // 630 mins
export const LUNCH_BREAK_END_MINUTES = 11 * 60 + 45;   // 705 mins
export const LUNCH_BREAK_LABEL = '10:30 AM – 11:45 AM';

/**
 * Returns true if the interval [startMinutes, endMinutes] strictly overlaps with
 * the department lunch break [10:30 AM, 11:45 AM].
 */
export function overlapsLunchBreak(startMinutes: number, endMinutes: number): boolean {
  return Math.max(startMinutes, LUNCH_BREAK_START_MINUTES) < Math.min(endMinutes, LUNCH_BREAK_END_MINUTES);
}

/**
 * Converts a time token like "0800 AM", "800 AM", "08:00 AM", or "1:30 PM" into minutes from midnight.
 */
export function parseSingleTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();

  // 1. Standard colon format: "8:00 AM", "08:30 PM", "12:00 PM"
  const colonMatch = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (colonMatch) {
    let hour = parseInt(colonMatch[1], 10);
    const minute = parseInt(colonMatch[2], 10);
    const meridiem = colonMatch[3];
    if (minute < 0 || minute >= 60 || hour < 1 || hour > 12) return null;
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  // 2. Unpunctuated 3 or 4 digits: "800 AM", "0800 AM", "130 PM", "0130 PM"
  const unpunctMatch = clean.match(/^(\d{1,2})(\d{2})\s*(AM|PM)$/);
  if (unpunctMatch) {
    let hour = parseInt(unpunctMatch[1], 10);
    const minute = parseInt(unpunctMatch[2], 10);
    const meridiem = unpunctMatch[3];
    if (minute < 0 || minute >= 60 || hour < 1 || hour > 12) return null;
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    return hour * 60 + minute;
  }

  // 3. Whole hours: "8 AM", "12 PM"
  const hourOnlyMatch = clean.match(/^(\d{1,2})\s*(AM|PM)$/);
  if (hourOnlyMatch) {
    let hour = parseInt(hourOnlyMatch[1], 10);
    const meridiem = hourOnlyMatch[2];
    if (hour < 1 || hour > 12) return null;
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    return hour * 60;
  }

  return null;
}

/**
 * Parses full range string: "08:00 AM to 09:30 AM", "08:00 AM – 09:30 AM", "0800 AM to 0900 AM", or "8:00 AM -> 9:30 AM"
 */
export function parseTimeRange(timeRange: string): { startMinutes: number; endMinutes: number } | null {
  if (!timeRange) return null;
  const parts = timeRange.split(/\s+to\s+|\s*[-–—→]\s*|\s*->\s*/i);
  if (parts.length !== 2) return null;

  const startMinutes = parseSingleTimeToMinutes(parts[0].trim());
  const endMinutes = parseSingleTimeToMinutes(parts[1].trim());

  if (startMinutes === null || endMinutes === null) return null;
  if (endMinutes <= startMinutes) return null;

  return { startMinutes, endMinutes };
}

/**
 * Converts minutes from midnight to "HHMM AM/PM" (standard CSV format)
 * e.g., 480 -> "0800 AM", 810 -> "0130 PM"
 */
export function minutesToHHMM(minutes: number): string {
  let hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const meridiem = hour >= 12 ? 'PM' : 'AM';

  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  const hh = hour.toString().padStart(2, '0');
  const mm = minute.toString().padStart(2, '0');
  return `${hh}${mm} ${meridiem}`;
}

/**
 * Converts minutes from midnight to readable "HH:MM AM/PM"
 * e.g., 480 -> "08:00 AM", 810 -> "01:30 PM"
 */
export function minutesToReadable(minutes: number): string {
  let hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const meridiem = hour >= 12 ? 'PM' : 'AM';

  if (hour > 12) hour -= 12;
  if (hour === 0) hour = 12;

  const hh = hour.toString().padStart(2, '0');
  const mm = minute.toString().padStart(2, '0');
  return `${hh}:${mm} ${meridiem}`;
}

/**
 * Converts minutes range to standard CSV string "0800 AM to 0930 AM"
 */
export function formatTimeRangeToCSV(startMinutes: number, endMinutes: number): string {
  return `${minutesToReadable(startMinutes)} to ${minutesToReadable(endMinutes)}`;
}

/**
 * Human friendly duration: e.g., 90 -> "1h 30m" or "1.5 hrs"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours}h ${mins}m`;
}

/**
 * Validates DD-MM-YYYY format
 */
export function isValidDateDDMMYYYY(dateStr: string): boolean {
  if (!dateStr) return false;
  const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = dateStr.trim().match(regex);
  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 2000 || year > 2100) return false;

  return true;
}

/**
 * Converts HTML date input (YYYY-MM-DD) to DD-MM-YYYY
 */
export function htmlDateToDDMMYYYY(htmlDate: string): string {
  if (!htmlDate) return '';
  const parts = htmlDate.split('-');
  if (parts.length !== 3) return htmlDate;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Converts DD-MM-YYYY to HTML date input (YYYY-MM-DD)
 */
export function ddmmYYYYToHtmlDate(ddmmyyyy: string): string {
  if (!ddmmyyyy) return '';
  const parts = ddmmyyyy.split('-');
  if (parts.length !== 3) return ddmmyyyy;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

/**
 * Parses DD-MM-YYYY into a JavaScript Date object.
 */
export function parseDDMMYYYYToDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

/**
 * Formats a Date object into DD-MM-YYYY.
 */
export function dateToDDMMYYYY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

/**
 * Adds N weeks to a DD-MM-YYYY date.
 */
export function addWeeksToDDMMYYYY(dateStr: string, weeks: number): string {
  const d = parseDDMMYYYYToDate(dateStr);
  if (!d) return dateStr;
  d.setDate(d.getDate() + weeks * 7);
  return dateToDDMMYYYY(d);
}

/**
 * Returns the full weekday name (e.g. "Tuesday") from DD-MM-YYYY.
 */
export function getDayOfWeek(dateStr: string): string {
  const d = parseDDMMYYYYToDate(dateStr);
  if (!d) return '';
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * Returns formatted friendly date string (e.g. "Tue, 22 Sep 2026").
 */
export function formatFriendlyDate(dateStr: string): string {
  const d = parseDDMMYYYYToDate(dateStr);
  if (!d) return dateStr;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export interface WeekDayInfo {
  date: string;
  dayName: string;
  shortDay: string;
  dayNumber: number;
  isTarget: boolean;
}

/**
 * Returns Monday through Saturday (6 departmental working days) for the week containing targetDateStr.
 */
export function getAcademicWeekDates(targetDateStr: string): WeekDayInfo[] {
  const targetDate = parseDDMMYYYYToDate(targetDateStr) || new Date();
  const day = targetDate.getDay(); // 0 is Sunday, 1 is Monday, ... 6 is Saturday
  
  // Calculate distance to Monday (if Sunday (0), go to next day Monday, or previous Monday)
  const diffToMonday = day === 0 ? 1 : 1 - day;
  const monday = new Date(targetDate);
  monday.setDate(targetDate.getDate() + diffToMonday);

  const weekDays: WeekDayInfo[] = [];
  for (let i = 0; i < 6; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const dateStr = dateToDDMMYYYY(current);
    weekDays.push({
      date: dateStr,
      dayName: current.toLocaleDateString('en-US', { weekday: 'long' }),
      shortDay: current.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: current.getDate(),
      isTarget: dateStr === targetDateStr,
    });
  }

  return weekDays;
}

