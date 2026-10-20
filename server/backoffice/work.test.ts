import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { openDatabase } from "./database";
import { createApp } from "../app";
import { crc32 } from "node:zlib";
import { overtimeAmount, overtimeHourly, sessionMinutes } from "./work";
import { excelDate } from "./xlsx";

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

test("Work log API: ranges or durations, payment status, unpaid total and employer-format xlsx", async () => {
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

    await send("put", "/settings", {
      netSalary: 6_500_000,
      ownerName: "Bora Kaan Özdinç",
    }).expect(200);
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

    const file = await request(app)
      .get("/api/backoffice/work/export?month=2026-10")
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => done(null, Buffer.concat(chunks)));
      })
      .expect(200);
    assert.match(String(file.headers["content-type"]), /spreadsheetml\.sheet/);
    assert.match(
      String(file.headers["content-disposition"]),
      /mesai-2026-10\.xlsx/,
    );
    const zip: Buffer = file.body;
    assert.equal(zip.subarray(0, 4).toString("latin1"), "PK\x03\x04");
    // First entry is stored: its CRC must match its bytes.
    const nameLength = zip.readUInt16LE(26),
      size = zip.readUInt32LE(18);
    const first = zip.subarray(30 + nameLength, 30 + nameLength + size);
    assert.equal(zip.readUInt32LE(14), crc32(first));
    const sheet = zip.toString("utf8");
    for (const part of [
      '<sheet name="Ekim 2026"',
      '<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">Bora Kaan Özdinç</t>',
      '<c r="A2" s="1" t="inlineStr"><is><t xml:space="preserve">Ekim Ayı Ekstra Süreler</t>',
      ">Ekim Ayı Ekstra Süreler</t>",
      ">Fazla Mesai Süresi</t>",
      `<c r="A4" s="2"><v>${excelDate("2026-10-02")}</v></c>`,
      `<c r="C4" s="3"><v>${360 / 1440}</v></c>`,
      ">İlknak (İzmir) Dönüş Yolculuğu</t>",
      ">=HYPERLINK(&quot;x&quot;)</t>",
      ">21:00–22:00</t>",
      "<f>SUM(C4:C7)</f>",
    ])
      assert.ok(sheet.includes(part), part);

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
