import { randomUUID } from "node:crypto";
import { and, eq, lte } from "drizzle-orm";
import type { DB } from "./database";
import { billingPlans, payments } from "./schema";
import { addDays, dueDate, today } from "./dates";
import type { PlanInput, Frequency } from "../../shared/backoffice";

export function nextDue(plan: typeof billingPlans.$inferSelect) {
  return dueDate(plan.anchor, plan.frequency, plan.nextIndex);
}

export function generatePayments(db: DB, day = today(), onlyPlan?: string) {
  db.transaction((tx) => {
    const plans = tx
      .select()
      .from(billingPlans)
      .where(
        onlyPlan
          ? and(eq(billingPlans.active, true), eq(billingPlans.id, onlyPlan))
          : eq(billingPlans.active, true),
      )
      .all();
    for (const original of plans) {
      let plan = original;
      // Bound catch-up work per tick. Old unpaid periods never prevent new ones.
      for (let n = 0; n < 100; n++) {
        let due = nextDue(plan);
        if (plan.nextIndex > 0 && due > addDays(day, 30)) break;
        if (plan.pendingFrom && due >= plan.pendingFrom) {
          const changedFrequency = plan.frequency !== plan.pendingFrequency;
          plan = {
            ...plan,
            amount: plan.pendingAmount!,
            frequency: plan.pendingFrequency!,
            anchor: changedFrequency ? plan.pendingFrom : plan.anchor,
            nextIndex: changedFrequency ? 0 : plan.nextIndex,
            pendingAmount: null,
            pendingFrequency: null,
            pendingFrom: null,
          };
          due = nextDue(plan);
        }
        tx.insert(payments)
          .values({
            id: randomUUID(),
            planId: plan.id,
            projectId: plan.projectId,
            resourceId: plan.resourceId,
            name: plan.name,
            direction: plan.direction,
            amount: plan.amount,
            currency: plan.currency,
            dueOn: due,
          })
          .onConflictDoNothing()
          .run();
        plan = {
          ...plan,
          nextIndex: plan.nextIndex + 1,
          active: plan.frequency !== "once",
        };
        tx.update(billingPlans)
          .set({
            amount: plan.amount,
            frequency: plan.frequency,
            anchor: plan.anchor,
            nextIndex: plan.nextIndex,
            active: plan.active,
            pendingAmount: plan.pendingAmount,
            pendingFrequency: plan.pendingFrequency,
            pendingFrom: plan.pendingFrom,
          })
          .where(eq(billingPlans.id, plan.id))
          .run();
        if (!plan.active) break;
      }
    }
  });
}

export function createPlan(db: DB, input: PlanInput, day = today()) {
  return db.transaction((tx) => {
    const { firstDue, ...rest } = input;
    const plan = tx
      .insert(billingPlans)
      .values({ ...rest, id: randomUUID(), anchor: firstDue })
      .returning()
      .get();
    generatePayments(tx, day, plan.id);
    return tx
      .select()
      .from(billingPlans)
      .where(eq(billingPlans.id, plan.id))
      .get()!;
  });
}

export function changePlan(
  db: DB,
  id: string,
  amount: number,
  frequency: Frequency,
) {
  const plan = db
    .select()
    .from(billingPlans)
    .where(eq(billingPlans.id, id))
    .get();
  if (!plan?.active) throw new Error("Yalnız aktif planlar değiştirilebilir.");
  const effectiveFrom = nextDue(plan);
  db.update(billingPlans)
    .set({
      pendingAmount: amount,
      pendingFrequency: frequency,
      pendingFrom: effectiveFrom,
    })
    .where(eq(billingPlans.id, id))
    .run();
  return { effectiveFrom };
}

export function financeSummary(db: DB, projectId?: string, day = today()) {
  const plans = db
    .select()
    .from(billingPlans)
    .where(projectId ? eq(billingPlans.projectId, projectId) : undefined)
    .all();
  const rows = db
    .select()
    .from(payments)
    .where(projectId ? eq(payments.projectId, projectId) : undefined)
    .all();
  return (["TRY", "USD", "EUR"] as const).map((currency) => {
    const active = plans.filter(
      (p) => p.active && p.currency === currency && p.direction === "expense",
    );
    const monthly = active.reduce(
      (sum, p) =>
        sum +
        (p.frequency === "monthly"
          ? p.amount
          : p.frequency === "yearly"
            ? p.amount / 12
            : 0),
      0,
    );
    const of = rows.filter((p) => p.currency === currency);
    return {
      currency,
      monthly: Math.round(monthly),
      yearly: Math.round(monthly * 12),
      upcomingExpense: of
        .filter(
          (p) =>
            p.status === "pending" &&
            p.direction === "expense" &&
            p.dueOn >= day &&
            p.dueOn <= addDays(day, 30),
        )
        .reduce((s, p) => s + p.amount, 0),
      overdueExpense: of
        .filter(
          (p) =>
            p.status === "pending" &&
            p.direction === "expense" &&
            p.dueOn < day,
        )
        .reduce((s, p) => s + p.amount, 0),
      receivable: of
        .filter((p) => p.status === "pending" && p.direction === "income")
        .reduce((s, p) => s + p.amount, 0),
      paidExpense: of
        .filter((p) => p.status === "paid" && p.direction === "expense")
        .reduce((s, p) => s + p.amount, 0),
      received: of
        .filter((p) => p.status === "paid" && p.direction === "income")
        .reduce((s, p) => s + p.amount, 0),
    };
  });
}

export function upcomingPayments(db: DB, day = today()) {
  return db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.status, "pending"),
        lte(payments.dueOn, addDays(day, 30)),
      ),
    )
    .all();
}
