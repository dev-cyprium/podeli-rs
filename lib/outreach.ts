export const statuses = {
  new: "Za poziv",
  contacted: "Kontaktirani",
  follow_up: "Ponovni poziv",
  interested: "Zainteresovani",
  not_interested: "Nisu zainteresovani",
  onboarded: "Uključeni",
} as const;
export type OutreachStatus = keyof typeof statuses;
export function belgradeToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Europe/Belgrade",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)!.value)
    .join("-");
}
export function validFollowUp(value: string) {
  if (!value) return true;
  const d = new Date(`${value}T00:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(d.getTime()) &&
    d.toISOString().slice(0, 10) === value
  );
}
export function prospectKey(name: string, phone: string) {
  return `${name.trim().toLocaleLowerCase("sr").replace(/\s+/g, " ")}|${phone
    .replace(/[^0-9]/g, "")
    .replace(/^00381/, "0")
    .replace(/^381/, "0")}`;
}
export const csvColumns = [
  "name",
  "category",
  "phone",
  "website",
  "contactPerson",
  "status",
  "nextAction",
  "followUpDate",
] as const;
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (quoted || cell === "") quoted = !quoted;
      else throw new Error("Neispravan CSV.");
    } else if (c === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (quoted) throw new Error("Nezatvoreni navodnici u CSV fajlu.");
  row.push(cell);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}
export function encodeCsv(rows: string[][]) {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row.map((cell) => '"' + cell.replace(/"/g, '""') + '"').join(","),
      )
      .join("\r\n")
  );
}

type FollowUpProspect = { status: OutreachStatus; followUpDate: string };
export function isActiveProspect(p: FollowUpProspect) {
  return p.status !== "not_interested" && p.status !== "onboarded";
}
export function isFollowUpDue(p: FollowUpProspect, today: string) {
  return (
    isActiveProspect(p) && Boolean(p.followUpDate) && p.followUpDate <= today
  );
}
export function isToCallToday(p: FollowUpProspect, today: string) {
  return (
    isFollowUpDue(p, today) ||
    (p.status === "new" && (!p.followUpDate || p.followUpDate <= today))
  );
}
