import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { openDatabase } from "./database";
import { createApp } from "../app";
import { overtimeAmount, overtimeHourly, sessionMinutes } from "./work";

test("Session length: remote work wraps midnight, early office exit counts as zero", () => {
  assert.equal(sessionMinutes("remote", "20:00", "22:00"), 120);
  assert.equal(sessionMinutes("remote", "23:30", "01:15"), 105);
  assert.equal(sessionMinutes("office", "18:00", "19:45"), 105);
  assert.equal(sessionMinutes("office", "18:00", "18:00"), 0);
  assert.equal(sessionMinutes("office", "18:00", "17:30"), 0);
});

test("Overtime pay matches the August 2026 payslip (65.000 net, 26,5 h = 11.483,33)", () => {
  assert.equal(overtimeHourly(6_500_000), 43_333);
  assert.equal(overtimeAmount(6_500_000, 26.5 * 60), 1_148_333);
});

test("Work log API: ranges or durations, payment status, unpaid total and employer-format CSV", async () => {
  const store = openDatabase(":memory:");
  try {
    const app = createApp(
      store,
      null,
      async () => true,
      async () => ({ name: "Admin", allowed: true }),
    );
    const send = (
      method: "post" | "put" | "patch",
      path: string,
      body: object,
    ) => {
      const agent = request(app);
      return agent[method](`/api/backoffice/work${path}`)
        .set("Origin", "http://localhost:5173")
        .send(body);
    };
    const office = (
      await send("post", "", {
        date: "2026-10-20",
        kind: "office",
        start: "18:00",
        end: "20:00",
      }).expect(201)
    ).body.data;
    await send("post", "", {
      date: "2026-10-20",
      kind: "remote",
      start: "21:00",
      end: "22:00",
      note: "Canlı ortam; hata",
    }).expect(201);
    const travel = (
      await send("post", "", {
        date: "2026-10-02",
        kind: "remote",
        duration: 360,
        note: "İlknak (İzmir) Dönüş Yolculuğu",
      }).expect(201)
    ).body.data;
    await send("post", "", {
      date: "2026-10-03",
      kind: "remote",
      duration: 240,
      note: '=HYPERLINK("x")',
    }).expect(201);
    await send("post", "", {
      date: "2026-10-04",
      kind: "remote",
      start: "10:00",
      end: "11:00",
      duration: 60,
    }).expect(400);
    await send("post", "", { date: "2026-10-04", kind: "remote" }).expect(400);
    await send("post", "", {
      date: "2026-10-22",
      kind: "remote",
      start: "25:00",
      end: "26:00",
    }).expect(400);

    let data = (
      await request(app).get("/api/backoffice/work?month=2026-10").expect(200)
    ).body.data;
    assert.equal(data.salary, null);
    assert.equal(data.unpaid.amount, null, "no salary, no money estimate");
    assert.deepEqual(
      data.sessions.map((w: { minutes: number }) => w.minutes),
      [360, 240, 120, 60],
    );

    await send("put", "/salary", { netSalary: 6_500_000 }).expect(200);
    await send("post", "/pay", {
      ids: [travel.id, office.id],
      paidPeriod: "2026-10",
    }).expect(200);
    await send("post", "/pay", {
      ids: ["missing"],
      paidPeriod: "2026-10",
    }).expect(404);
    data = (
      await request(app).get("/api/backoffice/work?month=2026-10").expect(200)
    ).body.data;
    assert.equal(data.hourly, 43_333);
    assert.deepEqual(data.totals, {
      office: 120,
      remote: 660,
      all: 780,
      amount: overtimeAmount(6_500_000, 780),
      days: 3,
    });
    assert.deepEqual(data.unpaid, {
      minutes: 300,
      amount: overtimeAmount(6_500_000, 300),
    });

    // Switching an entry from a clock range to a declared duration.
    await send("patch", `/${office.id}`, {
      start: null,
      end: null,
      duration: 90,
    }).expect(200);
    await send("post", "/pay", { ids: [office.id], paidPeriod: null }).expect(
      200,
    );

    const csv = await request(app)
      .get("/api/backoffice/work/export?month=2026-10")
      .expect(200);
    assert.match(
      String(csv.headers["content-disposition"]),
      /mesai-2026-10\.csv/,
    );
    const lines = csv.text.replace(/^\uFEFF/, "").trim().split("\r\n");
    assert.deepEqual(lines, [
      "Ekim Ayı Ekstra Süreler",
      "Tarih;Gün;Fazla Mesai Süresi;Birim;Nedeni;Saat Aralığı",
      "02.10.2026;Cuma;06:00;SAAT;İlknak (İzmir) Dönüş Yolculuğu;",
      `03.10.2026;Cumartesi;04:00;SAAT;"'=HYPERLINK(""x"")";`,
      "20.10.2026;Salı;01:30;SAAT;Ofiste fazla mesai;",
      '20.10.2026;Salı;01:00;SAAT;"Canlı ortam; hata";21:00–22:00',
      "Toplam;;12:30;SAAT;;",
    ]);

    await request(
      createApp(
        store,
        null,
        async () => true,
        async () => null,
      ),
    )
      .get("/api/backoffice/work/export")
      .expect(401);
  } finally {
    store.sqlite.close();
  }
});
