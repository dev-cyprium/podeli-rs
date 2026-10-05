export type RentalDateRange = { startDate: string; endDate: string };

const DAY_MS = 24 * 60 * 60 * 1000;

export function isValidRentalDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function getBelgradeDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function rentalDays(startDate: string, endDate: string): number {
  return (
    (Date.parse(`${endDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
      DAY_MS +
    1
  );
}

export function rentalDatesOverlap(
  a: RentalDateRange,
  b: RentalDateRange,
): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

export function isRangeAvailable(
  range: RentalDateRange,
  slots: RentalDateRange[],
): boolean {
  if (!isValidRentalDate(range.startDate) || !isValidRentalDate(range.endDate))
    return false;
  let nextDay = Date.parse(`${range.startDate}T00:00:00Z`);
  const lastDay = Date.parse(`${range.endDate}T00:00:00Z`);
  if (
    !Number.isFinite(nextDay) ||
    !Number.isFinite(lastDay) ||
    nextDay > lastDay
  )
    return false;
  for (const slot of [...slots].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  )) {
    if (!isValidRentalDate(slot.startDate) || !isValidRentalDate(slot.endDate))
      continue;
    const start = Date.parse(`${slot.startDate}T00:00:00Z`);
    const end = Date.parse(`${slot.endDate}T00:00:00Z`);
    if (end < nextDay) continue;
    if (start > nextDay) return false;
    nextDay = end + DAY_MS;
    if (nextDay > lastDay) return true;
  }
  return false;
}

export function rentalRangeError(
  range: RentalDateRange,
  slots: RentalDateRange[],
  today = getBelgradeDate(),
): string | null {
  if (!isValidRentalDate(range.startDate) || !isValidRentalDate(range.endDate))
    return "Unesite važeće datume.";
  if (range.startDate > range.endDate)
    return "Krajnji datum ne može biti pre početnog.";
  if (range.startDate < today)
    return "Ne možete rezervisati datume u prošlosti.";
  if (!isRangeAvailable(range, slots))
    return "Predmet nije dostupan tokom celog izabranog perioda.";
  return null;
}

export function availabilityError(slots: RentalDateRange[]): string | null {
  if (slots.length === 0) return "Dodajte bar jedan termin dostupnosti.";
  if (slots.length > 100) return "Maksimalno 100 termina dostupnosti.";
  for (const slot of slots) {
    if (!isValidRentalDate(slot.startDate) || !isValidRentalDate(slot.endDate))
      return "Unesite važeće datume dostupnosti.";
    if (slot.startDate > slot.endDate)
      return "Krajnji datum dostupnosti ne može biti pre početnog.";
  }
  return null;
}
