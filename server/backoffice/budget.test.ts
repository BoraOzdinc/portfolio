import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { openDatabase } from "./database";
import { createApp } from "../app";
import {
  minimumDue,
  monthTable,
  occursIn,
  refreshRates,
  budgetSnapshot,
} from "./budget";

const TL = 100;
const item = (
  over: Partial<Parameters<typeof occursIn>[0]>,
): Parameters<typeof occursIn>[0] => ({
  id: "i",
  name: "Kalem",
  direction: "expense",
  amount: 1000 * TL,
  frequency: "monthly",
  startOn: "2026-01-15",
  endOn: null,
  ...over,
});

test("Minimum payment follows the 100.000 TL BDDK threshold unless the card overrides it", () => {
  assert.equal(minimumDue(10_000 * TL, 100_000 * TL, null), 2_000 * TL);
  assert.equal(minimumDue(10_000 * TL, 100_001 * TL, null), 4_000 * TL);
  assert.equal(minimumDue(10_000 * TL, 50_000 * TL, 25), 2_500 * TL);
  assert.equal(minimumDue(1, 0, null), 1, "rounds up to the kuruş");
});

test("Recurring items respect frequency, start and end months", () => {
  assert.equal(occursIn(item({}), "2025-12"), false);
  assert.equal(occursIn(item({}), "2026-01"), true);
  assert.equal(occursIn(item({ endOn: "2026-03-31" }), "2026-04"), false);
  assert.equal(occursIn(item({ frequency: "yearly" }), "2027-01"), true);
  assert.equal(occursIn(item({ frequency: "yearly" }), "2027-02"), false);
  assert.equal(occursIn(item({ frequency: "once" }), "2026-02"), false);
});

test("Projection starts from today's balances and only adds cash that has not moved yet", () => {
  const items = [
    item({
      id: "salary",
      direction: "income",
      amount: 50_000 * TL,
      startOn: "2026-01-01",
    }),
    item({ id: "rent", amount: 20_000 * TL, startOn: "2026-01-25" }),
  ];
  const statement = (
    period: string,
    balance: number,
    minimum: number,
    paidAmount = 0,
  ) => ({
    id: period,
    cardId: "c",
    cardName: "Kart",
    period,
    dueOn: `${period}-28`,
    balance,
    minimum,
    paidAmount,
    paidAt: null,
  });
  const october = statement("2026-10", 10_000 * TL, 2_000 * TL);
  const [oct, nov] = monthTable(
    items,
    [october],
    [],
    100_000 * TL,
    "2026-10",
    "2026-10-20",
    2,
  );
  // Salary on the 1st already landed; rent on the 25th and the card are still ahead.
  assert.equal(oct.projectedMin, 78_000 * TL);
  assert.equal(oct.projectedFull, 70_000 * TL);
  assert.equal(oct.netMin, 28_000 * TL);
  assert.equal(nov.projectedMin, 108_000 * TL);

  const paid = monthTable(
    items,
    [{ ...october, paidAmount: 2_000 * TL }],
    [],
    100_000 * TL,
    "2026-10",
    "2026-10-20",
    1,
  )[0];
  assert.equal(
    paid.projectedMin,
    80_000 * TL,
    "a paid minimum is already out of the balance",
  );
  assert.equal(paid.projectedFull, 72_000 * TL);
  assert.equal(paid.cardMin, 2_000 * TL);

  const overdue = monthTable(
    items,
    [statement("2026-09", 5_000 * TL, 1_000 * TL)],
    [],
    100_000 * TL,
    "2026-10",
    "2026-10-20",
    1,
  )[0];
  assert.equal(
    overdue.projectedMin,
    79_000 * TL,
    "unpaid past statements still have to be paid",
  );

  const [sep, octFromSep] = monthTable(
    items,
    [],
    [],
    100_000 * TL,
    "2026-09",
    "2026-10-20",
    2,
  );
  assert.equal(
    sep.projectedMin,
    null,
    "past months have actuals, not projections",
  );
  assert.equal(sep.netMin, 30_000 * TL);
  assert.equal(octFromSep.projectedMin, 80_000 * TL);

  const dec = monthTable(
    items,
    [],
    [],
    100_000 * TL,
    "2026-12",
    "2026-10-20",
    1,
  )[0];
  assert.equal(
    dec.projectedMin,
    140_000 * TL,
    "starting later still carries the months between",
  );
});

test("Recorded actuals replace their plan, extras add up and nothing is counted twice", () => {
  const items = [
    item({
      id: "salary",
      name: "Maaş",
      direction: "income",
      amount: 65_000 * TL,
      startOn: "2026-01-10",
    }),
    item({
      id: "rent",
      name: "Kira",
      amount: 27_500 * TL,
      startOn: "2026-01-25",
    }),
  ];
  const tx = (
    id: string,
    date: string,
    amount: number,
    itemId: string | null,
    direction: "income" | "expense" = "income",
  ) => ({
    id,
    itemId,
    name: id,
    direction,
    amount,
    date,
    note: "",
  });
  const entries = [
    tx("salary-oct", "2026-10-10", 68_000 * TL, "salary"),
    tx("overtime", "2026-10-15", 2_000 * TL, null),
    tx("dinner", "2026-10-18", 1_500 * TL, null, "expense"),
    tx("rent-early", "2026-10-22", 27_500 * TL, "rent", "expense"),
  ];
  const [oct, nov] = monthTable(
    items,
    [],
    entries,
    100_000 * TL,
    "2026-10",
    "2026-10-20",
    2,
  );
  const salary = oct.lines.find((l) => l.id === "salary")!;
  assert.equal(salary.planned, 65_000 * TL);
  assert.equal(salary.actual, 68_000 * TL);
  assert.equal(oct.income, 70_000 * TL);
  assert.equal(oct.expense, 29_000 * TL);
  assert.equal(oct.vsPlan, 3_000 * TL + 2_000 * TL - 1_500 * TL);
  assert.equal(oct.recorded, 4);
  // Only the future-dated rent entry is still ahead; past entries are in the balance.
  assert.equal(oct.projectedMin, 72_500 * TL);
  assert.equal(
    nov.lines.find((l) => l.id === "salary")!.actual,
    null,
    "next month is plan again",
  );
  assert.equal(nov.projectedMin, (72_500 + 65_000 - 27_500) * TL);

  const unrecorded = monthTable(
    items,
    [],
    [],
    100_000 * TL,
    "2026-10",
    "2026-10-20",
    1,
  )[0];
  assert.equal(
    unrecorded.projectedMin,
    72_500 * TL,
    "salary day passed, rent still planned",
  );
  assert.equal(unrecorded.vsPlan, 0);
});

test("Budget API: cards, statements, payments, accounts, holdings and prices", async () => {
  const store = openDatabase(":memory:");
  try {
    const app = createApp(
      store,
      null,
      async () => true,
      async () => ({ name: "Admin", allowed: true }),
    );
    const send = (
      method: "post" | "patch" | "put" | "delete",
      path: string,
      body?: object,
    ) => {
      const agent = request(app);
      return agent[method](`/api/backoffice/budget${path}`)
        .set("Origin", "http://localhost:5173")
        .send(body);
    };

    await request(
      createApp(
        store,
        null,
        async () => true,
        async () => null,
      ),
    )
      .get("/api/backoffice/budget")
      .expect(401);
    await send("post", "/items", {
      name: "Kira",
      direction: "expense",
      amount: 20_000 * TL,
      frequency: "monthly",
      startOn: "2026-05-01",
      endOn: "2026-04-01",
    }).expect(400);

    const card = (
      await send("post", "/cards", {
        name: "Bonus",
        creditLimit: 150_000 * TL,
        dueDay: 5,
      }).expect(201)
    ).body.data;
    const st = (
      await send("post", "/statements", {
        cardId: card.id,
        dueOn: "2026-11-05",
        balance: 30_000 * TL,
      }).expect(201)
    ).body.data;
    assert.equal(st.minimum, 12_000 * TL, "limit above 100.000 TL → %40");
    assert.equal(st.period, "2026-11");
    await send("post", "/statements", {
      cardId: card.id,
      dueOn: "2026-11-20",
      balance: 1,
    }).expect(409);
    await send("post", `/statements/${st.id}/pay`, {
      paidAmount: 30_001 * TL,
    }).expect(400);
    await send("post", `/statements/${st.id}/pay`, {
      paidAmount: 12_000 * TL,
    }).expect(200);
    await send("patch", `/statements/${st.id}`, {
      balance: 10_000 * TL,
    }).expect(400);
    await send("patch", `/statements/${st.id}`, {
      balance: 25_000 * TL,
    }).expect(200);

    await send("post", "/accounts", {
      name: "Vadesiz",
      balance: 40_000 * TL,
    }).expect(201);
    await send("post", "/holdings", {
      asset: "Gram altın",
      quantity: 2.5,
      buyPrice: 4_000 * TL,
      boughtOn: "2026-03-01",
    }).expect(201);
    await send("post", "/holdings", {
      asset: "Gram altın",
      quantity: 1.5,
      buyPrice: 5_000 * TL,
      boughtOn: "2026-08-01",
    }).expect(201);
    let data = budgetSnapshot(store.db);
    assert.deepEqual(data.totals.unpriced, ["Gram altın"]);
    await send("put", `/prices/${encodeURIComponent("Gram altın")}`, {
      price: 6_000 * TL,
    }).expect(200);

    data = budgetSnapshot(store.db);
    const gold = data.investments.assets[0];
    assert.equal(gold.quantity, 4);
    assert.equal(gold.cost, 17_500 * TL);
    assert.equal(gold.averagePrice, 4_375 * TL);
    assert.equal(gold.value, 24_000 * TL);
    assert.equal(gold.gain, 6_500 * TL);
    assert.equal(data.totals.cardDebt, 13_000 * TL);
    assert.equal(data.totals.netWorth, (40_000 + 24_000 - 13_000) * TL);

    const rent = (
      await send("post", "/items", {
        name: "Kira",
        direction: "expense",
        amount: 27_500 * TL,
        frequency: "monthly",
        startOn: "2026-01-25",
      }).expect(201)
    ).body.data;
    const paidRent = (
      await send("post", "/transactions", {
        itemId: rent.id,
        name: "Kira",
        direction: "income",
        amount: 28_000 * TL,
        date: "2026-10-25",
      }).expect(201)
    ).body.data;
    assert.equal(
      paidRent.direction,
      "expense",
      "linked entries follow their item",
    );
    await send("post", "/transactions", {
      itemId: "missing",
      name: "X",
      direction: "income",
      amount: 1,
      date: "2026-10-01",
    }).expect(404);
    await send("patch", `/transactions/${paidRent.id}`, {
      amount: 27_000 * TL,
    }).expect(200);
    await send("delete", `/items/${rent.id}`).expect(200);
    assert.equal(
      budgetSnapshot(store.db).transactions[0].itemId,
      null,
      "deleting an item keeps its history as unplanned entries",
    );
    await send("delete", `/transactions/${paidRent.id}`).expect(200);

    await send("delete", `/cards/${card.id}`).expect(200);
    assert.equal(
      budgetSnapshot(store.db).statements.length,
      0,
      "statements go with their card",
    );
    await send("delete", `/cards/${card.id}`).expect(404);
  } finally {
    store.sqlite.close();
  }
});

test("TCMB rates are parsed as kuruş buying prices and upserted", async () => {
  const store = openDatabase(":memory:");
  try {
    const xml = (usd: string) =>
      `<Tarih_Date><Currency CrossOrder="0" Kod="USD" CurrencyCode="USD"><Unit>1</Unit><ForexBuying>${usd}</ForexBuying><ForexSelling>99</ForexSelling></Currency><Currency CrossOrder="9" Kod="EUR" CurrencyCode="EUR"><Unit>1</Unit><ForexBuying>55.4677</ForexBuying></Currency></Tarih_Date>`;
    let body = xml("49.4632");
    const fetcher = (async () => new Response(body)) as typeof fetch;
    await refreshRates(store.db, fetcher);
    body = xml("50.1");
    await refreshRates(store.db, fetcher);
    const rows = store.sqlite
      .prepare("select asset, price, source from prices order by asset")
      .all();
    assert.deepEqual(rows, [
      { asset: "EUR", price: 5547, source: "tcmb" },
      { asset: "USD", price: 5010, source: "tcmb" },
    ]);
    await assert.rejects(
      refreshRates(
        store.db,
        (async () => new Response("", { status: 503 })) as typeof fetch,
      ),
    );
  } finally {
    store.sqlite.close();
  }
});
