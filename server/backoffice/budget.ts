import { Router } from "express";
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "./database";
import * as s from "./schema";
import {
  accountInput,
  budgetItemInput,
  cardInput,
  holdingInput,
  statementInput,
  transactionInput,
  type BudgetItemInput,
} from "../../shared/backoffice";
import { today } from "./dates";
import { HttpError } from "./errors";

type Item = BudgetItemInput & { id: string };
type Statement = typeof s.cardStatements.$inferSelect;
type Transaction = typeof s.transactions.$inferSelect;

// BDDK 1 Ekim 2026: limit ≤ 100.000 TL → %20, üzeri → %40. A card's own
// minRate overrides this, so a future rule change needs no deploy.
export const MIN_RATE_THRESHOLD = 10_000_000;
export const minRateOf = (creditLimit: number, minRate: number | null) =>
  minRate ?? (creditLimit > MIN_RATE_THRESHOLD ? 40 : 20);
export function minimumDue(
  balance: number,
  creditLimit: number,
  minRate: number | null,
) {
  return Math.ceil((balance * minRateOf(creditLimit, minRate)) / 100);
}

export function addMonths(month: string, n: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export function occursIn(item: Item, month: string) {
  const start = item.startOn.slice(0, 7);
  if (item.frequency === "once") return start === month;
  if (month < start || (item.endOn && month > item.endOn.slice(0, 7)))
    return false;
  return item.frequency === "monthly" || month.slice(5) === start.slice(5);
}

/** Day of month an item lands on, clamped like billing anchors. */
function itemDay(item: Item, month: string) {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Math.min(Number(item.startOn.slice(8)), last);
}

export function monthTable(
  items: Item[],
  statements: (Statement & { cardName: string })[],
  transactions: Transaction[],
  opening: number,
  from: string,
  day = today(),
  months = 12,
) {
  const current = day.slice(0, 7),
    todayNum = Number(day.slice(8));
  // Projection starts from today's account balances, so only cash movements
  // that have not happened yet are added: later days this month, future months,
  // future-dated entries and unpaid card balances. Recorded actuals replace
  // their item's plan and, being in the past, are never added again.
  const overdue = (key: "minimum" | "balance") =>
    statements
      .filter((st) => st.period < current)
      .reduce((a, st) => a + Math.max(st[key] - st.paidAmount, 0), 0);
  const overdueMin = overdue("minimum"),
    overdueFull = overdue("balance");
  let runMin = opening,
    runFull = opening;
  for (let m = current; m < from; m = addMonths(m, 1)) {
    const r = row(m);
    runMin += r.pendingMin;
    runFull += r.pendingFull;
  }
  function row(month: string) {
    const entries = transactions.filter((t) => t.date.slice(0, 7) === month);
    const later = (list: Transaction[]) =>
      list.filter((t) => t.date > day).reduce((a, t) => a + t.amount, 0);
    const itemLines = items
      .filter(
        (i) => occursIn(i, month) || entries.some((t) => t.itemId === i.id),
      )
      .map((i) => {
        const linked = entries.filter((t) => t.itemId === i.id);
        const planned = occursIn(i, month) ? i.amount : 0;
        const actual = linked.length
          ? linked.reduce((a, t) => a + t.amount, 0)
          : null;
        const due =
          month > current ||
          (month === current && itemDay(i, month) > todayNum);
        return {
          id: i.id,
          name: i.name,
          direction: i.direction,
          planned,
          actual,
          amount: actual ?? planned,
          date: `${month}-${String(itemDay(i, month)).padStart(2, "0")}`,
          pending: actual === null ? (due ? planned : 0) : later(linked),
        };
      });
    const extraLines = entries
      .filter((t) => !t.itemId)
      .map((t) => ({
        id: t.id,
        name: t.name,
        direction: t.direction,
        planned: 0,
        actual: t.amount,
        amount: t.amount,
        date: t.date,
        pending: later([t]),
      }));
    const lines = [...itemLines, ...extraLines];
    const cardLines = statements
      .filter((st) => st.period === month)
      .map((st) => ({
        id: st.id,
        name: st.cardName,
        dueOn: st.dueOn,
        balance: st.balance,
        minimum: st.minimum,
        paid: st.paidAmount,
        // Cash still to leave the account under each scenario.
        leftMin: Math.max(st.minimum - st.paidAmount, 0),
        leftFull: Math.max(st.balance - st.paidAmount, 0),
      }));
    const sum = (
      dir: "income" | "expense",
      key: "amount" | "planned" | "pending",
    ) =>
      lines.filter((l) => l.direction === dir).reduce((a, l) => a + l[key], 0);
    const income = sum("income", "amount"),
      expense = sum("expense", "amount");
    const paid = cardLines.reduce((a, c) => a + c.paid, 0);
    const leftMin = cardLines.reduce((a, c) => a + c.leftMin, 0);
    const leftFull = cardLines.reduce((a, c) => a + c.leftFull, 0);
    const open = month >= current;
    const base = sum("income", "pending") - sum("expense", "pending");
    return {
      month,
      lines,
      cards: cardLines,
      income,
      expense,
      // Actual vs plan, before card payments. Positive is good.
      vsPlan:
        income -
        expense -
        (sum("income", "planned") - sum("expense", "planned")),
      recorded: entries.length,
      cardMin: paid + leftMin,
      cardFull: paid + leftFull,
      netMin: income - expense - paid - leftMin,
      netFull: income - expense - paid - leftFull,
      pendingMin: open
        ? base - leftMin - (month === current ? overdueMin : 0)
        : 0,
      pendingFull: open
        ? base - leftFull - (month === current ? overdueFull : 0)
        : 0,
    };
  }
  return Array.from({ length: months }, (_, n) => {
    const r = row(addMonths(from, n));
    const open = r.month >= current;
    runMin += r.pendingMin;
    runFull += r.pendingFull;
    return {
      ...r,
      projectedMin: open ? runMin : null,
      projectedFull: open ? runFull : null,
    };
  });
}

export function holdingView(
  rows: (typeof s.holdings.$inferSelect)[],
  priceRows: (typeof s.prices.$inferSelect)[],
) {
  const priceOf = new Map(priceRows.map((p) => [p.asset, p]));
  const lots = rows.map((h) => {
    const price = priceOf.get(h.asset)?.price ?? null;
    const cost = Math.round(h.quantity * h.buyPrice);
    const value = price === null ? null : Math.round(h.quantity * price);
    return { ...h, cost, value, gain: value === null ? null : value - cost };
  });
  const assets = [...new Set(lots.map((l) => l.asset))].map((asset) => {
    const of = lots.filter((l) => l.asset === asset);
    const quantity = of.reduce((a, l) => a + l.quantity, 0);
    const cost = of.reduce((a, l) => a + l.cost, 0);
    const price = priceOf.get(asset) ?? null;
    const value = price ? Math.round(quantity * price.price) : null;
    return {
      asset,
      quantity,
      cost,
      averagePrice: Math.round(cost / quantity),
      price,
      value,
      gain: value === null ? null : value - cost,
    };
  });
  return { lots, assets };
}

export function budgetSnapshot(db: DB, query: Record<string, unknown> = {}) {
  const day = today();
  const from = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .default(day.slice(0, 7))
    .parse(query.from || undefined);
  const items = db
    .select()
    .from(s.budgetItems)
    .orderBy(s.budgetItems.startOn)
    .all();
  const cards = db
    .select()
    .from(s.cards)
    .orderBy(s.cards.name)
    .all()
    .map((c) => ({ ...c, rate: minRateOf(c.creditLimit, c.minRate) }));
  const cardName = new Map(cards.map((c) => [c.id, c.name]));
  const statements = db
    .select()
    .from(s.cardStatements)
    .orderBy(s.cardStatements.dueOn)
    .all()
    .map((st) => ({ ...st, cardName: cardName.get(st.cardId) ?? "Kart" }));
  const accounts = db.select().from(s.accounts).orderBy(s.accounts.name).all();
  // ponytail: every entry ships to the client; page by month past ~10k rows.
  const transactions = db
    .select()
    .from(s.transactions)
    .orderBy(desc(s.transactions.date))
    .all();
  const cash = accounts.reduce((a, x) => a + x.balance, 0);
  const investments = holdingView(
    db.select().from(s.holdings).orderBy(s.holdings.boughtOn).all(),
    db.select().from(s.prices).all(),
  );
  const invested = investments.assets.reduce((a, x) => a + (x.value ?? 0), 0);
  const cardDebt = statements.reduce(
    (a, st) => a + Math.max(st.balance - st.paidAmount, 0),
    0,
  );
  return {
    today: day,
    from,
    items,
    cards,
    statements,
    accounts,
    investments,
    transactions,
    table: monthTable(items, statements, transactions, cash, from, day),
    totals: {
      cash,
      invested,
      cardDebt,
      netWorth: cash + invested - cardDebt,
      unpriced: investments.assets.filter((a) => !a.price).map((a) => a.asset),
    },
  };
}
export type BudgetSnapshot = ReturnType<typeof budgetSnapshot>;

/** TCMB döviz alış kuru; holdings are valued at what a bank would pay. */
export async function refreshRates(db: DB, fetcher: typeof fetch = fetch) {
  const res = await fetcher("https://www.tcmb.gov.tr/kurlar/today.xml", {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`TCMB ${res.status}`);
  const xml = await res.text();
  for (const code of ["USD", "EUR"]) {
    const match = xml.match(
      new RegExp(
        `CurrencyCode="${code}"[\\s\\S]*?<ForexBuying>([\\d.]+)</ForexBuying>`,
      ),
    );
    if (!match) continue;
    const row = {
      asset: code,
      price: Math.round(Number(match[1]) * 100),
      source: "tcmb" as const,
      updatedAt: new Date().toISOString(),
    };
    db.insert(s.prices)
      .values(row)
      .onConflictDoUpdate({ target: s.prices.asset, set: row })
      .run();
  }
}

export function budgetRouter(db: DB) {
  const router = Router();
  const one = <T>(row: T | undefined): T => {
    if (!row) throw new HttpError(404, "Kayıt bulunamadı.");
    return row;
  };
  const id = (v: unknown) => String(v);
  router.get("/", (req, res) =>
    res.json({ data: budgetSnapshot(db, req.query) }),
  );

  router.post("/items", (req, res) => {
    const row = db
      .insert(s.budgetItems)
      .values({ id: randomUUID(), ...budgetItemInput.parse(req.body) })
      .returning()
      .get();
    res.status(201).json({ data: row });
  });
  router.patch("/items/:id", (req, res) => {
    const existing = one(
      db
        .select()
        .from(s.budgetItems)
        .where(eq(s.budgetItems.id, id(req.params.id)))
        .get(),
    );
    const input = budgetItemInput.parse({ ...existing, ...req.body });
    db.update(s.budgetItems)
      .set(input)
      .where(eq(s.budgetItems.id, existing.id))
      .run();
    res.json({ data: { id: existing.id } });
  });
  router.delete("/items/:id", (req, res) => {
    one(
      db
        .delete(s.budgetItems)
        .where(eq(s.budgetItems.id, id(req.params.id)))
        .returning()
        .get(),
    );
    res.json({ data: { id: req.params.id } });
  });

  router.post("/cards", (req, res) => {
    const row = db
      .insert(s.cards)
      .values({ id: randomUUID(), ...cardInput.parse(req.body) })
      .returning()
      .get();
    res.status(201).json({ data: row });
  });
  router.patch("/cards/:id", (req, res) => {
    const existing = one(
      db
        .select()
        .from(s.cards)
        .where(eq(s.cards.id, id(req.params.id)))
        .get(),
    );
    const input = cardInput.parse({ ...existing, ...req.body });
    db.update(s.cards).set(input).where(eq(s.cards.id, existing.id)).run();
    res.json({ data: { id: existing.id } });
  });
  router.delete("/cards/:id", (req, res) => {
    // Statements go with the card (ON DELETE CASCADE).
    one(
      db
        .delete(s.cards)
        .where(eq(s.cards.id, id(req.params.id)))
        .returning()
        .get(),
    );
    res.json({ data: { id: req.params.id } });
  });

  const statementValues = (body: unknown) => {
    const input = statementInput.parse(body);
    const card = one(
      db.select().from(s.cards).where(eq(s.cards.id, input.cardId)).get(),
    );
    return {
      cardId: card.id,
      dueOn: input.dueOn,
      period: input.dueOn.slice(0, 7),
      balance: input.balance,
      minimum:
        input.minimum ??
        minimumDue(input.balance, card.creditLimit, card.minRate),
    };
  };
  const duplicatePeriod = (error: unknown) => {
    if (error instanceof Error && /UNIQUE/.test(error.message))
      throw new HttpError(409, "Bu kartın o ay için zaten ekstresi var.");
    throw error;
  };
  router.post("/statements", (req, res) => {
    try {
      const row = db
        .insert(s.cardStatements)
        .values({ id: randomUUID(), ...statementValues(req.body) })
        .returning()
        .get();
      res.status(201).json({ data: row });
    } catch (error) {
      duplicatePeriod(error);
    }
  });
  router.patch("/statements/:id", (req, res) => {
    const existing = one(
      db
        .select()
        .from(s.cardStatements)
        .where(eq(s.cardStatements.id, id(req.params.id)))
        .get(),
    );
    const values = statementValues({
      dueOn: existing.dueOn,
      balance: existing.balance,
      ...req.body,
      cardId: existing.cardId,
    });
    if (existing.paidAmount > values.balance)
      throw new HttpError(400, "Ekstre borcu ödenen tutardan az olamaz.");
    try {
      db.update(s.cardStatements)
        .set(values)
        .where(eq(s.cardStatements.id, existing.id))
        .run();
    } catch (error) {
      duplicatePeriod(error);
    }
    res.json({ data: { id: existing.id } });
  });
  router.post("/statements/:id/pay", (req, res) => {
    const existing = one(
      db
        .select()
        .from(s.cardStatements)
        .where(eq(s.cardStatements.id, id(req.params.id)))
        .get(),
    );
    const { paidAmount } = z
      .object({ paidAmount: z.number().int().min(0).max(existing.balance) })
      .parse(req.body);
    db.update(s.cardStatements)
      .set({ paidAmount, paidAt: paidAmount ? new Date().toISOString() : null })
      .where(eq(s.cardStatements.id, existing.id))
      .run();
    res.json({ data: { id: existing.id } });
  });
  router.delete("/statements/:id", (req, res) => {
    one(
      db
        .delete(s.cardStatements)
        .where(eq(s.cardStatements.id, id(req.params.id)))
        .returning()
        .get(),
    );
    res.json({ data: { id: req.params.id } });
  });

  router.post("/accounts", (req, res) => {
    const row = db
      .insert(s.accounts)
      .values({
        id: randomUUID(),
        ...accountInput.parse(req.body),
        updatedAt: new Date().toISOString(),
      })
      .returning()
      .get();
    res.status(201).json({ data: row });
  });
  router.patch("/accounts/:id", (req, res) => {
    const existing = one(
      db
        .select()
        .from(s.accounts)
        .where(eq(s.accounts.id, id(req.params.id)))
        .get(),
    );
    const input = accountInput.parse({ ...existing, ...req.body });
    db.update(s.accounts)
      .set({ ...input, updatedAt: new Date().toISOString() })
      .where(eq(s.accounts.id, existing.id))
      .run();
    res.json({ data: { id: existing.id } });
  });
  router.delete("/accounts/:id", (req, res) => {
    one(
      db
        .delete(s.accounts)
        .where(eq(s.accounts.id, id(req.params.id)))
        .returning()
        .get(),
    );
    res.json({ data: { id: req.params.id } });
  });

  router.post("/holdings", (req, res) => {
    const row = db
      .insert(s.holdings)
      .values({ id: randomUUID(), ...holdingInput.parse(req.body) })
      .returning()
      .get();
    res.status(201).json({ data: row });
  });
  router.patch("/holdings/:id", (req, res) => {
    const existing = one(
      db
        .select()
        .from(s.holdings)
        .where(eq(s.holdings.id, id(req.params.id)))
        .get(),
    );
    const input = holdingInput.parse({ ...existing, ...req.body });
    db.update(s.holdings)
      .set(input)
      .where(eq(s.holdings.id, existing.id))
      .run();
    res.json({ data: { id: existing.id } });
  });
  router.delete("/holdings/:id", (req, res) => {
    one(
      db
        .delete(s.holdings)
        .where(eq(s.holdings.id, id(req.params.id)))
        .returning()
        .get(),
    );
    res.json({ data: { id: req.params.id } });
  });

  const transactionValues = (body: unknown) => {
    const input = transactionInput.parse(body);
    if (!input.itemId) return input;
    const item = one(
      db
        .select()
        .from(s.budgetItems)
        .where(eq(s.budgetItems.id, input.itemId))
        .get(),
    );
    return { ...input, direction: item.direction };
  };
  router.post("/transactions", (req, res) => {
    const row = db
      .insert(s.transactions)
      .values({ id: randomUUID(), ...transactionValues(req.body) })
      .returning()
      .get();
    res.status(201).json({ data: row });
  });
  router.patch("/transactions/:id", (req, res) => {
    const existing = one(
      db
        .select()
        .from(s.transactions)
        .where(eq(s.transactions.id, id(req.params.id)))
        .get(),
    );
    db.update(s.transactions)
      .set(transactionValues({ ...existing, ...req.body }))
      .where(eq(s.transactions.id, existing.id))
      .run();
    res.json({ data: { id: existing.id } });
  });
  router.delete("/transactions/:id", (req, res) => {
    one(
      db
        .delete(s.transactions)
        .where(eq(s.transactions.id, id(req.params.id)))
        .returning()
        .get(),
    );
    res.json({ data: { id: req.params.id } });
  });

  router.put("/prices/:asset", (req, res) => {
    const row = {
      asset: z.string().trim().min(1).max(40).parse(req.params.asset),
      price: z
        .object({ price: z.number().int().min(1).max(100_000_000_000) })
        .parse(req.body).price,
      source: "manual" as const,
      updatedAt: new Date().toISOString(),
    };
    db.insert(s.prices)
      .values(row)
      .onConflictDoUpdate({ target: s.prices.asset, set: row })
      .run();
    res.json({ data: row });
  });
  return router;
}
