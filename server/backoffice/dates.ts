import type { Frequency } from "../../shared/backoffice";
export function today(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function addDays(value: string, days: number) {
  const d = new Date(`${value}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(to) - Date.parse(from)) / 86400000);
}
export function dueDate(
  anchor: string,
  frequency: Frequency,
  index: number,
): string {
  if (frequency === "once") return anchor;
  const [year, month, day] = anchor.split("-").map(Number);
  const first = new Date(
    Date.UTC(year, month - 1 + index * (frequency === "monthly" ? 1 : 12), 1),
  );
  const lastDay = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  first.setUTCDate(Math.min(day, lastDay));
  return first.toISOString().slice(0, 10);
}
