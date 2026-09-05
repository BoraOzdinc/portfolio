export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/backoffice${path}`, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    data: T;
    error?: { message: string; details?: string[] };
  };
  if (!response.ok)
    throw new ApiError(
      response.status,
      [
        payload.error?.message || "İşlem tamamlanamadı.",
        ...(payload.error?.details || []),
      ].join(" "),
    );
  return payload.data;
}
export function money(amount: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(
    amount / 100,
  );
}
export function dateLabel(date: string | null) {
  return date
    ? new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "medium",
        timeZone: "Europe/Istanbul",
      }).format(new Date(date.length === 10 ? `${date}T12:00:00Z` : date))
    : "—";
}
export function timeLabel(date: string | null) {
  return date
    ? new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Europe/Istanbul",
      }).format(new Date(date))
    : "Henüz kontrol edilmedi";
}
