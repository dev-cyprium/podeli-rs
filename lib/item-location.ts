export function normalizeLocation(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("sr-Latn");
}

export function locationError(
  city: string,
  municipality: string,
): string | null {
  if (!city.trim()) return "Unesite grad.";
  if (!municipality.trim()) return "Unesite opštinu.";
  if (city.length > 100 || municipality.length > 100)
    return "Grad i opština mogu imati najviše 100 znakova.";
  return null;
}

export function formatLocation(item: {
  city?: string;
  municipality?: string;
}): string {
  return (
    [item.city, item.municipality].filter(Boolean).join(", ") ||
    "Lokacija nije navedena"
  );
}
