"use client";

import {
  formatSerbianDate,
  type SerbianDateFormat,
} from "@/lib/serbian-date";
import { cn } from "@/lib/utils";

export interface DateDisplayProps {
  /** Date as Date, ISO string, or timestamp (ms) */
  value: Date | string | number;
  /** short = "15. jan 2024.", long = "15. januar 2024.", numeric = "15.01.2024." */
  format?: SerbianDateFormat;
  className?: string;
}

/**
 * Renders a date in Serbian (Latin) format. Use everywhere a date is shown to users.
 */
export function DateDisplay({
  value,
  format = "long",
  className,
}: DateDisplayProps) {
  return (
    <time dateTime={toIsoString(value)} className={cn(className)}>
      {formatSerbianDate(value, format)}
    </time>
  );
}

function toIsoString(value: Date | string | number): string {
  if (typeof value === "object" && value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }
  return value.includes("T") ? value : `${value}T00:00:00`;
}
