import { Router } from "express";
import { randomUUID } from "node:crypto";
import { eq, inArray, isNull, like } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "./database";
import * as s from "./schema";
import { period, workSessionInput } from "../../shared/backoffice";
import { today } from "./dates";
import { HttpError } from "./errors";
import { Style, excelDate, xlsx } from "./xlsx";

type Session = typeof s.workSessions.$inferSelect;
const toMinutes = (clock: string) =>
  Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3));

/** Remote work may run past midnight; leaving the office early counts as 0. */
export function sessionMinutes(
  kind: Session["kind"],
  start: string,
  end: string,
) {
  const diff = toMinutes(end) - toMinutes(start);
  if (kind === "office") return Math.max(diff, 0);
  return diff < 0 ? diff + 1440 : diff;
}
const minutesOf = (w: Session) =>
  w.duration ?? sessionMinutes(w.kind, w.start!, w.end!);

// Turkish labour practice used on the payslip: monthly net ÷ 225 hours, ×1.5.
export const overtimeHourly = (netSalary: number) =>
  Math.round((netSalary / 225) * 1.5);
export const overtimeAmount = (netSalary: number, minutes: number) =>
  Math.round((netSalary * 1.5 * minutes) / (225 * 60));

function netSalary(db: DB) {
  const row = db
    .select()
    .from(s.settings)
    .where(eq(s.settings.key, "netSalary"))
    .get();
  return row ? Number(row.value) : null;
}

export function workSnapshot(db: DB, query: Record<string, unknown> = {}) {
  const day = today();
  const selected =
    period.optional().parse(query.month || undefined) ?? day.slice(0, 7);
  const salary = netSalary(db);
  const amount = (minutes: number) =>
    salary === null ? null : overtimeAmount(salary, minutes);
  const sessions = db
    .select()
    .from(s.workSessions)
    .where(like(s.workSessions.date, `${selected}-%`))
    .orderBy(s.workSessions.date, s.workSessions.start)
    .all()
    .map((w) => ({ ...w, minutes: minutesOf(w) }));
  const total = (kind?: Session["kind"]) =>
    sessions
      .filter((w) => !kind || w.kind === kind)
      .reduce((a, w) => a + w.minutes, 0);
  // Unpaid hours across every month: what the next payslips should cover.
  const unpaid = db
    .select()
    .from(s.workSessions)
    .where(isNull(s.workSessions.paidPeriod))
    .all()
    .reduce((a, w) => a + minutesOf(w), 0);
  return {
    today: day,
    month: selected,
    sessions,
    salary,
    hourly: salary === null ? null : overtimeHourly(salary),
    totals: {
      office: total("office"),
      remote: total("remote"),
      all: total(),
      amount: amount(total()),
      days: new Set(sessions.filter((w) => w.minutes > 0).map((w) => w.date))
        .size,
    },
    unpaid: { minutes: unpaid, amount: amount(unpaid) },
  };
}
export type WorkSnapshot = ReturnType<typeof workSnapshot>;

const monthName = (month: string) =>
  new Intl.DateTimeFormat("tr-TR", { month: "long", timeZone: "UTC" }).format(
    new Date(`${month}-01T12:00:00Z`),
  );
const weekday = (date: string) =>
  new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );

/**
 * Mirrors the declaration sheet handed to the employer (Tarih, Gün, Süre,
 * Birim, Nedeni) with real date/duration cells and a SUM total.
 */
export function workXlsx(data: WorkSnapshot) {
  const title = `${monthName(data.month)} Ayı Ekstra Süreler`;
  const first = 3,
    last = first + data.sessions.length - 1;
  const bold = (v: string) => ({ v, s: Style.Bold });
  return xlsx(
    `${monthName(data.month)} ${data.month.slice(0, 4)}`,
    [
      [bold(title)],
      [
        "Tarih",
        "Gün",
        "Fazla Mesai Süresi",
        "Birim",
        "Nedeni",
        "Saat Aralığı",
      ].map(bold),
      ...data.sessions.map((w) => [
        { v: excelDate(w.date), s: Style.Date },
        weekday(w.date),
        { v: w.minutes / 1440, s: Style.Duration },
        "SAAT",
        {
          v:
            w.note ||
            (w.kind === "office" ? "Ofiste fazla mesai" : "Ofis dışı çalışma"),
          s: Style.Wrap,
        },
        w.start && w.end ? `${w.start}–${w.end}` : null,
      ]),
      [
        bold("Toplam"),
        null,
        {
          v: data.totals.all / 1440,
          s: Style.BoldDuration,
          ...(data.sessions.length && { f: `SUM(C${first}:C${last})` }),
        },
        bold("SAAT"),
      ],
    ],
    [12, 12, 18, 8, 80, 14],
  );
}

export function workRouter(db: DB) {
  const router = Router();
  const one = (id: unknown) => {
    const row = db
      .select()
      .from(s.workSessions)
      .where(eq(s.workSessions.id, String(id)))
      .get();
    if (!row) throw new HttpError(404, "Kayıt bulunamadı.");
    return row;
  };
  router.get("/", (req, res) =>
    res.json({ data: workSnapshot(db, req.query) }),
  );
  router.get("/export", (req, res) => {
    const data = workSnapshot(db, req.query);
    res.attachment(`mesai-${data.month}.xlsx`).send(workXlsx(data));
  });
  router.post("/", (req, res) => {
    const row = db
      .insert(s.workSessions)
      .values({ id: randomUUID(), ...workSessionInput.parse(req.body) })
      .returning()
      .get();
    res.status(201).json({ data: row });
  });
  router.post("/pay", (req, res) => {
    const input = z
      .object({
        ids: z.array(z.string().min(1)).min(1).max(500),
        paidPeriod: period.nullable(),
      })
      .parse(req.body);
    const changed = db
      .update(s.workSessions)
      .set({ paidPeriod: input.paidPeriod })
      .where(inArray(s.workSessions.id, input.ids))
      .run().changes;
    if (changed !== new Set(input.ids).size)
      throw new HttpError(404, "Bazı kayıtlar bulunamadı.");
    res.json({ data: { changed } });
  });
  router.put("/salary", (req, res) => {
    const { netSalary } = z
      .object({ netSalary: z.number().int().min(1).max(100_000_000_000) })
      .parse(req.body);
    const row = { key: "netSalary", value: String(netSalary) };
    db.insert(s.settings)
      .values(row)
      .onConflictDoUpdate({ target: s.settings.key, set: row })
      .run();
    res.json({ data: { netSalary } });
  });
  router.patch("/:id", (req, res) => {
    const existing = one(req.params.id);
    db.update(s.workSessions)
      .set(workSessionInput.parse({ ...existing, ...req.body }))
      .where(eq(s.workSessions.id, existing.id))
      .run();
    res.json({ data: { id: existing.id } });
  });
  router.delete("/:id", (req, res) => {
    const existing = one(req.params.id);
    db.delete(s.workSessions).where(eq(s.workSessions.id, existing.id)).run();
    res.json({ data: { id: existing.id } });
  });
  return router;
}
