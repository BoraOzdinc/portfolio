import { randomUUID } from "node:crypto";
import { and, eq, isNull, lte } from "drizzle-orm";
import { Resend } from "resend";
import type { DB } from "./database";
import { deliveries, notifications, resources, projects } from "./schema";
import { today, daysBetween } from "./dates";
import { upcomingPayments } from "./billing";

export function prepareNotifications(db: DB, now = new Date()) {
  const day = today(now),
    at = now.toISOString();
  db.transaction((tx) => {
    const names = new Map(
      tx
        .select()
        .from(projects)
        .all()
        .map((p) => [p.id, p.name]),
    );
    for (const row of upcomingPayments(tx, day)) {
      const days = daysBetween(day, row.dueOn);
      if (![30, 14, 7, 1].includes(days)) continue;
      const title = `${names.get(row.projectId)}: ${row.name}`;
      tx.insert(notifications)
        .values({
          id: randomUUID(),
          key: `payment:${row.id}:${row.dueOn}:${days}`,
          projectId: row.projectId,
          title,
          body: `${row.direction === "expense" ? "Ödeme" : "Tahsilat"} ${days} gün sonra: ${(row.amount / 100).toFixed(2)} ${row.currency}. Vade: ${row.dueOn}.`,
          kind: "reminder",
          createdAt: at,
        })
        .onConflictDoNothing()
        .run();
    }
    for (const row of tx
      .select()
      .from(resources)
      .where(eq(resources.active, true))
      .all()) {
      if (row.type !== "domain" || !row.expiresOn) continue;
      const days = daysBetween(day, row.expiresOn);
      if (![30, 14, 7, 1].includes(days)) continue;
      tx.insert(notifications)
        .values({
          id: randomUUID(),
          key: `domain:${row.id}:${row.expiresOn}:${days}`,
          projectId: row.ownerProjectId,
          title: `${names.get(row.ownerProjectId)}: domain yenileme`,
          body: `${row.domain || row.name} için ${days} gün kaldı. Bitiş: ${row.expiresOn}.`,
          kind: "reminder",
          createdAt: at,
        })
        .onConflictDoNothing()
        .run();
    }
    const pending = tx
      .select()
      .from(notifications)
      .where(isNull(notifications.deliveryId))
      .all();
    const hour = Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Istanbul",
        hour: "2-digit",
        hourCycle: "h23",
      }).format(now),
    );
    const digestId = `digest:${day}`;
    const digestExists = tx
      .select()
      .from(deliveries)
      .where(eq(deliveries.id, digestId))
      .get();
    const reminderRows = pending.filter((n) => n.kind === "reminder");
    const groups = pending
      .filter((n) => n.kind !== "reminder")
      .map((n) => ({ id: `event:${n.id}`, subject: n.title, rows: [n] }));
    if (hour >= 9 && !digestExists && reminderRows.length)
      groups.push({
        id: digestId,
        subject: `Backoffice · ${day} hatırlatmaları`,
        rows: reminderRows,
      });
    for (const group of groups) {
      tx.insert(deliveries)
        .values({
          id: group.id,
          subject: group.subject,
          body: group.rows.map((n) => `${n.title}\n${n.body}`).join("\n\n"),
          createdAt: at,
          nextAttemptAt: at,
        })
        .onConflictDoNothing()
        .run();
      for (const row of group.rows)
        tx.update(notifications)
          .set({ deliveryId: group.id })
          .where(eq(notifications.id, row.id))
          .run();
    }
  });
}

export type MailSender = (
  delivery: typeof deliveries.$inferSelect,
) => Promise<void>;
export const sendMail: MailSender = async (delivery) => {
  const { RESEND_API_KEY, RESEND_FROM_EMAIL, BACKOFFICE_TO_EMAIL } =
    process.env;
  if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !BACKOFFICE_TO_EMAIL)
    throw new Error("E-posta ayarları tamamlanmadı.");
  const result = await new Resend(RESEND_API_KEY).emails.send(
    {
      from: RESEND_FROM_EMAIL,
      to: BACKOFFICE_TO_EMAIL,
      subject: delivery.subject,
      text: delivery.body,
    },
    { idempotencyKey: delivery.id },
  );
  if (result.error)
    throw new Error("E-posta sağlayıcısı gönderimi kabul etmedi.");
};
export async function deliverNotifications(
  db: DB,
  sender: MailSender = sendMail,
  now = new Date(),
) {
  const rows = db
    .select()
    .from(deliveries)
    .where(
      and(
        isNull(deliveries.sentAt),
        lte(deliveries.nextAttemptAt, now.toISOString()),
      ),
    )
    .limit(10)
    .all();
  for (const row of rows) {
    try {
      await sender(row);
      db.update(deliveries)
        .set({
          sentAt: now.toISOString(),
          attempts: row.attempts + 1,
          lastError: null,
        })
        .where(eq(deliveries.id, row.id))
        .run();
    } catch (error) {
      db.update(deliveries)
        .set({
          attempts: row.attempts + 1,
          lastError:
            error instanceof Error
              ? error.message.slice(0, 200)
              : "Gönderilemedi.",
          nextAttemptAt: new Date(
            now.getTime() +
              Math.min(360, 2 ** Math.min(row.attempts, 9)) * 60_000,
          ).toISOString(),
        })
        .where(eq(deliveries.id, row.id))
        .run();
    }
  }
}
