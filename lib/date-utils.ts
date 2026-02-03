/**
 * Parses a date string in YYYY-MM-DD format to a Date object at local midnight.
 *
 * The T00:00:00 suffix ensures the date is interpreted in local time, not UTC.
 * Without it, `new Date("2024-01-15")` would be parsed as UTC midnight,
 * which can shift to the previous day in timezones west of UTC.
 *
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object at local midnight
 */
export function parseDateString(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

/**
 * Formats a Date object to YYYY-MM-DD string.
 *
 * Uses local date methods to avoid UTC conversion issues.
 * toISOString() would shift dates by one day in timezones east of UTC.
 *
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
