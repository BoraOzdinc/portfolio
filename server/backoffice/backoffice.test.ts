import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import request from "supertest";
import { openDatabase } from "./database";
import * as s from "./schema";
import {
  projectInput,
  resourceInput,
  planInput,
  monitorInput,
} from "../../shared/backoffice";
import { dueDate, today } from "./dates";
import {
  changePlan,
  createPlan,
  financeSummary,
  generatePayments,
} from "./billing";
import {
  createRunner,
  isPublicAddress,
  monitorView,
  recordCheck,
  validateTarget,
  probe,
} from "./monitoring";
import { prepareNotifications, deliverNotifications } from "./notifications";
import { backup } from "./backup";
import { configureAuth, isAllowedAccount } from "./auth";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createApp } from "../app";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

function fixture() {
  const store = openDatabase(":memory:");
  store.db
    .insert(s.projects)
    .values([
      { id: "melsa", ...projectInput.parse({ name: "MelsaShopp" }) },
      { id: "other", ...projectInput.parse({ name: "Diğer proje" }) },
    ])
    .run();
  return store;
}
test("WWW requests redirect to the configured auth origin without losing paths or accepting foreign hosts", async () => {
  const previous = process.env.BETTER_AUTH_URL;
  const store = fixture();
  try {
    process.env.BETTER_AUTH_URL = "https://ozdinc.dev";
    const app = createApp(store, null, async () => true);
    await request(app)
      .get("/backoffice?tab=finance")
      .set("Host", "www.ozdinc.dev")
      .expect(308)
      .expect("Location", "https://ozdinc.dev/backoffice?tab=finance");
    await request(app)
      .get("//example.org/path")
      .set("Host", "www.ozdinc.dev")
      .expect(308)
      .expect("Location", "https://ozdinc.dev//example.org/path");
    await request(app)
      .get("/api/missing")
      .set("Host", "ozdinc.dev")
      .expect(404);
    await request(app)
      .get("/api/missing")
      .set("Host", "www.attacker.test")
      .expect(404);
  } finally {
    store.sqlite.close();
    if (previous === undefined) delete process.env.BETTER_AUTH_URL;
    else process.env.BETTER_AUTH_URL = previous;
  }
});
function expense(firstDue = "2026-01-31") {
  return planInput.parse({
    projectId: "melsa",
    name: "VPS",
    direction: "expense",
    amount: 12000,
    currency: "TRY",
    frequency: "monthly",
    firstDue,
  });
}
function monitor(db: ReturnType<typeof fixture>["db"]) {
  return db
    .insert(s.monitors)
    .values({
      id: "site",
      ...monitorInput.parse({
        projectId: "melsa",
        name: "Site",
        url: "https://example.com",
      }),
      nextCheckAt: "2026-01-01T00:00:00.000Z",
    })
    .returning()
    .get();
}

test("Calendar anchors survive short months, leap years and Istanbul midnight", () => {
  assert.equal(dueDate("2026-01-31", "monthly", 1), "2026-02-28");
  assert.equal(dueDate("2026-01-31", "monthly", 2), "2026-03-31");
  assert.equal(dueDate("2024-02-29", "yearly", 1), "2025-02-28");
  assert.equal(dueDate("2024-02-29", "yearly", 4), "2028-02-29");
  assert.equal(today(new Date("2026-09-05T21:30:00Z")), "2026-09-06");
});
test("Overdue bills never block future periods; ticks and payment completion cannot duplicate periods", () => {
  const store = fixture();
  try {
    const plan = createPlan(store.db, expense(), "2026-01-01");
    generatePayments(store.db, "2026-03-01");
    generatePayments(store.db, "2026-03-01");
    const rows = store.db.select().from(s.payments).all();
    assert.deepEqual(
      rows.map((r) => r.dueOn),
      ["2026-01-31", "2026-02-28", "2026-03-31"],
    );
    assert.ok(rows.every((r) => r.status === "pending"));
    store.db
      .update(s.payments)
      .set({ status: "paid" })
      .where(eq(s.payments.id, rows[0].id))
      .run();
    generatePayments(store.db, "2026-03-01", plan.id);
    assert.equal(store.db.select().from(s.payments).all().length, 3);
  } finally {
    store.sqlite.close();
  }
});
test("Price and frequency revision applies to the first ungenerated period, retaining historical snapshots", () => {
  const store = fixture();
  try {
    const p = createPlan(store.db, expense(), "2026-01-01");
    assert.deepEqual(changePlan(store.db, p.id, 24000, "yearly"), {
      effectiveFrom: "2026-02-28",
    });
    generatePayments(store.db, "2026-02-01");
    const rows = store.db.select().from(s.payments).all();
    assert.deepEqual(
      rows.map((r) => [r.dueOn, r.amount]),
      [
        ["2026-01-31", 12000],
        ["2026-02-28", 24000],
      ],
    );
    assert.equal(
      store.db.select().from(s.billingPlans).get()!.frequency,
      "yearly",
    );
    store.db
      .update(s.billingPlans)
      .set({ active: false })
      .where(eq(s.billingPlans.id, p.id))
      .run();
    generatePayments(store.db, "2028-01-01");
    assert.equal(store.db.select().from(s.payments).all().length, 2);
  } finally {
    store.sqlite.close();
  }
});
test("A price-only revision preserves the original day-of-month anchor", () => {
  const store = fixture();
  try {
    const p = createPlan(store.db, expense(), "2026-01-01");
    changePlan(store.db, p.id, 24000, "monthly");
    generatePayments(store.db, "2026-03-01");
    assert.deepEqual(
      store.db
        .select()
        .from(s.payments)
        .all()
        .map((r) => [r.dueOn, r.amount]),
      [
        ["2026-01-31", 12000],
        ["2026-02-28", 24000],
        ["2026-03-31", 24000],
      ],
    );
  } finally {
    store.sqlite.close();
  }
});
test("Annual mail package is charged once and shared VPS belongs only to its cost owner", () => {
  const store = fixture();
  try {
    const resource = resourceInput.parse({
      name: "Mail paketi",
      type: "email",
      ownerProjectId: "melsa",
      addresses: ["info@example.com", "destek@example.com"],
    });
    store.db
      .insert(s.resources)
      .values({ ...resource, id: "mail" })
      .run();
    store.db
      .insert(s.projectResources)
      .values({ resourceId: "mail", projectId: "other" })
      .run();
    createPlan(
      store.db,
      {
        ...expense("2026-01-01"),
        resourceId: "mail",
        frequency: "yearly",
        amount: 120000,
      },
      "2026-01-01",
    );
    assert.equal(financeSummary(store.db)[0].monthly, 10000);
    assert.equal(financeSummary(store.db, "melsa")[0].yearly, 120000);
    assert.equal(financeSummary(store.db, "other")[0].monthly, 0);
    assert.equal(store.db.select().from(s.payments).all().length, 1);
    createPlan(
      store.db,
      { ...expense(), currency: "USD", amount: 2500 },
      "2026-01-01",
    );
    assert.equal(financeSummary(store.db)[1].monthly, 2500);
    assert.equal(financeSummary(store.db)[0].monthly, 10000);
  } finally {
    store.sqlite.close();
  }
});
test("Reminder thresholds aggregate once daily; failed delivery is retried without duplicate alerts", async () => {
  const store = fixture();
  try {
    createPlan(store.db, expense("2026-01-31"), "2026-01-01");
    const at = new Date("2026-01-01T07:00:00Z");
    prepareNotifications(store.db, at);
    prepareNotifications(store.db, at);
    assert.equal(store.db.select().from(s.notifications).all().length, 1);
    assert.equal(store.db.select().from(s.deliveries).all().length, 1);
    await deliverNotifications(
      store.db,
      async () => {
        throw new Error("temporary");
      },
      at,
    );
    assert.equal(store.db.select().from(s.deliveries).get()!.attempts, 1);
    let count = 0;
    await deliverNotifications(
      store.db,
      async () => {
        count++;
      },
      new Date("2026-01-01T07:02:00Z"),
    );
    await deliverNotifications(
      store.db,
      async () => {
        count++;
      },
      new Date("2026-01-01T07:03:00Z"),
    );
    assert.equal(count, 1);
    for (const day of ["2026-01-17", "2026-01-24", "2026-01-30"])
      prepareNotifications(store.db, new Date(`${day}T07:00:00Z`));
    assert.equal(store.db.select().from(s.notifications).all().length, 4);
  } finally {
    store.sqlite.close();
  }
});
test("Two failures create a single incident, recovery closes it; missing checks are stale, not success", () => {
  const store = fixture();
  try {
    const m = monitor(store.db);
    assert.equal(monitorView(store.db, m).uptime[0].percent, null);
    const failure = { ok: false, status: 500, latency: 120, error: "HTTP 500" };
    recordCheck(store.db, m.id, failure, new Date("2026-01-01T10:00:00Z"));
    assert.equal(store.db.select().from(s.incidents).all().length, 0);
    recordCheck(store.db, m.id, failure, new Date("2026-01-01T10:15:00Z"));
    recordCheck(store.db, m.id, failure, new Date("2026-01-01T10:30:00Z"));
    assert.equal(store.db.select().from(s.incidents).all().length, 1);
    recordCheck(
      store.db,
      m.id,
      { ok: true, status: 200, latency: 100, error: null },
      new Date("2026-01-01T10:45:00Z"),
    );
    assert.ok(store.db.select().from(s.incidents).get()!.resolvedAt);
    const view = monitorView(
      store.db,
      store.db.select().from(s.monitors).get()!,
      new Date("2026-01-01T11:10:00Z"),
    );
    assert.equal(view.state, "stale");
    assert.equal(view.uptime[0].percent, 25);
    assert.deepEqual(
      store.db
        .select()
        .from(s.notifications)
        .all()
        .map((n) => n.kind),
      ["down", "recovery"],
    );
  } finally {
    store.sqlite.close();
  }
});
test("Monitor runner prevents concurrent duplicate probes and accepts timeout failures", async () => {
  const store = fixture();
  try {
    monitor(store.db);
    let release!: () => void;
    const runner = createRunner(store.db, async () => {
      await new Promise<void>((r) => {
        release = r;
      });
      return { ok: false, status: null, latency: 10000, error: "Timeout" };
    });
    const first = runner("site");
    assert.equal(await runner("site"), false);
    release();
    await first;
    assert.equal(store.db.select().from(s.checks).all().length, 1);
  } finally {
    store.sqlite.close();
  }
});
test("Private, mapped, reserved and localhost addresses are blocked", async () => {
  for (const ip of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.1",
    "100.64.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "fc00::1",
    "fe80::1",
    "0.0.0.0",
    "224.0.0.1",
  ])
    assert.equal(isPublicAddress(ip), false, ip);
  assert.equal(isPublicAddress("1.1.1.1"), true);
  await assert.rejects(validateTarget(new URL("http://127.0.0.1")));
  await assert.rejects(
    validateTarget(new URL("https://user:pass@example.com")),
  );
  await assert.rejects(validateTarget(new URL("http://example.com:8080")));
});
test("HTTP transport follows validated redirects, preserves HEAD, rejects private redirects and times out", async () => {
  const store = fixture();
  const methods: string[] = [];
  const server = createServer((req, res) => {
    methods.push(req.method || "");
    if (req.url === "/slow") return;
    if (req.url === "/redirect") {
      res.writeHead(302, { location: "/ok" });
      res.end();
      return;
    }
    if (req.url === "/private") {
      res.writeHead(302, { location: "http://127.0.0.1/private" });
      res.end();
      return;
    }
    res.writeHead(req.url === "/error" ? 500 : 200);
    res.end();
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const port = (server.address() as AddressInfo).port;
    const checked: string[] = [];
    // Only the test hostname is pinned to this ephemeral fixture server.
    // Every redirected hostname still passes the production validator.
    const validate = async (url: URL) => {
      checked.push(url.href);
      if (url.hostname !== "fixture.example") return validateTarget(url);
      return { address: "127.0.0.1", family: 4 };
    };
    const m = {
      ...monitor(store.db),
      method: "HEAD" as const,
      url: `http://fixture.example:${port}/redirect`,
    };
    const result = await probe(m, { validate });
    assert.equal(result.ok, true);
    assert.equal(result.status, 200);
    assert.equal(checked.length, 2);
    assert.deepEqual(methods, ["HEAD", "HEAD"]);
    const blocked = await probe(
      { ...m, url: `http://fixture.example:${port}/private` },
      { validate },
    );
    assert.equal(blocked.ok, false);
    assert.match(blocked.error!, /Özel ağ/);
    const failure = await probe(
      { ...m, url: `http://fixture.example:${port}/error` },
      { validate },
    );
    assert.equal(failure.status, 500);
    assert.equal(failure.ok, false);
    const timeout = await probe(
      { ...m, url: `http://fixture.example:${port}/slow` },
      { validate, timeoutMs: 50 },
    );
    assert.equal(timeout.ok, false);
    assert.match(timeout.error!, /süresi aşıldı/);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    store.sqlite.close();
  }
});
test("Immutable GitHub ID gate and authenticated API enforce access, origin and domain renewal separation", async () => {
  assert.equal(
    isAllowedAccount({ providerId: "github", accountId: "123" }, "123"),
    true,
  );
  assert.equal(
    isAllowedAccount({ providerId: "github", accountId: "456" }, "123"),
    false,
  );
  assert.equal(
    isAllowedAccount({ providerId: "google", accountId: "123" }, "123"),
    false,
  );
  const store = fixture();
  try {
    const denied = createApp(
      store,
      null,
      async () => true,
      async () => null,
    );
    await request(denied).get("/api/backoffice/snapshot").expect(401);
    const foreign = createApp(
      store,
      null,
      async () => true,
      async () => ({ name: "Foreign", allowed: false }),
    );
    await request(foreign).get("/api/backoffice/snapshot").expect(403);
    const app = createApp(
      store,
      null,
      async () => true,
      async () => ({ name: "Admin", allowed: true }),
    );
    await request(app)
      .post("/api/backoffice/projects")
      .send({ name: "Invalid origin" })
      .expect(403);
    await request(app)
      .post("/api/backoffice/projects")
      .set("Origin", "http://localhost:5173")
      .send({ name: "" })
      .expect(400);
    const res = await request(app)
      .post("/api/backoffice/resources")
      .set("Origin", "http://localhost:5173")
      .send({
        name: "Domain",
        type: "domain",
        ownerProjectId: "melsa",
        domain: "example.com",
        expiresOn: "2026-01-31",
      })
      .expect(201);
    const resourceId = res.body.data.id as string;
    const plan = await request(app)
      .post("/api/backoffice/plans")
      .set("Origin", "http://localhost:5173")
      .send({ ...expense(), frequency: "yearly", resourceId })
      .expect(201);
    const p = store.db
      .select()
      .from(s.payments)
      .where(eq(s.payments.planId, plan.body.data.id as string))
      .get()!;
    await request(app)
      .patch(`/api/backoffice/payments/${p.id}`)
      .set("Origin", "http://localhost:5173")
      .send({ status: "paid" })
      .expect(200);
    assert.equal(
      store.db.select().from(s.resources).get()!.expiresOn,
      "2026-01-31",
    );
    await request(app)
      .post(`/api/backoffice/resources/${resourceId}/renew`)
      .set("Origin", "http://localhost:5173")
      .send({ expiresOn: "2027-01-31" })
      .expect(200);
    assert.equal(
      store.db.select().from(s.resources).get()!.expiresOn,
      "2027-01-31",
    );
    await request(app)
      .get("/api/backoffice/snapshot")
      .expect("Cache-Control", "no-store")
      .expect(200);
    await request(app).post("/api/inquiry").send({}).expect(400);
    await request(app).get("/api/missing").expect(404);
  } finally {
    store.sqlite.close();
  }
});
test("SQLite survives reopen; backup integrity and restoring to new database preserve balances", async () => {
  const dir = await mkdtemp(join(tmpdir(), "portfolio-backoffice-test-"));
  let store = openDatabase(join(dir, "live.sqlite"));
  try {
    store.db
      .insert(s.projects)
      .values({ id: "melsa", ...projectInput.parse({ name: "MelsaShopp" }) })
      .run();
    createPlan(store.db, expense(), "2026-01-01");
    const file = await backup(store, join(dir, "backups"));
    store.sqlite.close();
    store = openDatabase(join(dir, "live.sqlite"));
    assert.equal(store.db.select().from(s.payments).all().length, 1);
    const target = join(dir, "restored.sqlite");
    await promisify(execFile)(process.execPath, [
      "--import",
      "tsx",
      "server/backoffice/maintenance.ts",
      "restore",
      file,
      target,
    ]);
    await assert.rejects(
      promisify(execFile)(process.execPath, [
        "--import",
        "tsx",
        "server/backoffice/maintenance.ts",
        "restore",
        file,
        target,
      ]),
    );
    const restored = openDatabase(target);
    try {
      assert.deepEqual(financeSummary(restored.db), financeSummary(store.db));
    } finally {
      restored.sqlite.close();
    }
  } finally {
    store.sqlite.close();
    await rm(dir, { recursive: true, force: true });
  }
});
test("Better Auth creates its real SQLite schema and rejects an unauthenticated request", async () => {
  const keys = [
    "BETTER_AUTH_URL",
    "BETTER_AUTH_SECRET",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "ADMIN_GITHUB_ID",
  ] as const;
  const before = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  const store = fixture();
  try {
    Object.assign(process.env, {
      BETTER_AUTH_URL: "http://localhost:5173",
      BETTER_AUTH_SECRET: "test-secret-not-for-production-1234567890",
      GITHUB_CLIENT_ID: "test",
      GITHUB_CLIENT_SECRET: "test",
      ADMIN_GITHUB_ID: "123",
    });
    const auth = await configureAuth(store);
    assert.ok(auth);
    const app = createApp(store, auth, async () => true);
    await request(app).get("/api/auth/ok").expect(200);
    await request(app).get("/api/backoffice/snapshot").expect(401);
    assert.ok(
      store.sqlite
        .prepare("SELECT name FROM sqlite_master WHERE name = 'account'")
        .get(),
    );
  } finally {
    store.sqlite.close();
    for (const k of keys) {
      if (before[k] === undefined) delete process.env[k];
      else process.env[k] = before[k];
    }
  }
});
