/**
 * Serbian (Latin, Serbia) date formatting.
 * Use for all user-visible dates in the app.
 */

const LOCALE = "sr-Latn-RS";

export type SerbianDateFormat = "short" | "long" | "numeric";

const SHORT_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "short",
  year: "numeric",
};

const LONG_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

const NUMERIC_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

export function formatSerbianDate(
  value: Date | string | number,
  format: SerbianDateFormat = "long"
): string {
  const date = typeof value === "object" && value instanceof Date
    ? value
    : new Date(typeof value === "string" && !value.includes("T") ? `${value}T00:00:00` : value);
  const options =
    format === "short"
      ? SHORT_OPTIONS
      : format === "numeric"
        ? NUMERIC_OPTIONS
        : LONG_OPTIONS;
  return date.toLocaleDateString(LOCALE, options);
}

/** Locale for use in calendar and other Intl APIs */
export const SERBIAN_LOCALE = LOCALE;
