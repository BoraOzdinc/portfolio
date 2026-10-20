import { Router } from "express";
import { randomUUID } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "./database";
import * as s from "./schema";
import { workSessionInput } from "../../shared/backoffice";
import { today } from "./dates";
import { HttpError } from "./errors";

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

const month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
  .optional();

export function workSnapshot(db: DB, query: Record<string, unknown> = {}) {
  const day = today();
  const selected = month.parse(query.month || undefined) ?? day.slice(0, 7);
  const sessions = db
    .select()
    .from(s.workSessions)
    .where(like(s.workSessions.date, `${selected}-%`))
    .orderBy(s.workSessions.date, s.workSessions.start)
    .all()
    .map((w) => ({ ...w, minutes: sessionMinutes(w.kind, w.start, w.end) }));
  const total = (kind?: Session["kind"]) =>
    sessions
      .filter((w) => !kind || w.kind === kind)
      .reduce((a, w) => a + w.minutes, 0);
  return {
    today: day,
    month: selected,
    sessions,
    totals: {
      office: total("office"),
      remote: total("remote"),
      all: total(),
      days: new Set(sessions.filter((w) => w.minutes > 0).map((w) => w.date))
        .size,
    },
  };
}
export type WorkSnapshot = ReturnType<typeof workSnapshot>;

const kinds = { office: "Ofiste fazla mesai", remote: "Ofis dışı çalışma" };
const hours = (m: number) => (m / 60).toFixed(2).replace(".", ",");
const clock = (m: number) =>
  `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
function cell(value: string) {
  // Neutralise spreadsheet formulas, then quote for ; " and line breaks.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Semicolon CSV with BOM: opens in Turkish-locale Excel as columns. */
export function workCsv(data: WorkSnapshot) {
  const rows = [
    [
      "Tarih",
      "Tür",
      "Başlangıç",
      "Bitiş",
      "Süre (saat)",
      "Süre (s:dk)",
      "Açıklama",
    ],
    ...data.sessions.map((w) => [
      w.date.split("-").reverse().join("."),
      kinds[w.kind],
      w.start,
      w.end,
      hours(w.minutes),
      clock(w.minutes),
      w.note,
    ]),
    ["Toplam", "", "", "", hours(data.totals.all), clock(data.totals.all), ""],
  ];
  return (
    "\uFEFF" + rows.map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n"
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
    res
      .type("text/csv; charset=utf-8")
      .attachment(`mesai-${data.month}.csv`)
      .send(workCsv(data));
  });
  router.post("/", (req, res) => {
    const row = db
      .insert(s.workSessions)
      .values({ id: randomUUID(), ...workSessionInput.parse(req.body) })
      .returning()
      .get();
    res.status(201).json({ data: row });
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
