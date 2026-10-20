import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { openDatabase } from "./database";
import { createApp } from "../app";
import { sessionMinutes } from "./work";

test("Session length: remote work wraps midnight, early office exit counts as zero", () => {
  assert.equal(sessionMinutes("remote", "20:00", "22:00"), 120);
  assert.equal(sessionMinutes("remote", "23:30", "01:15"), 105);
  assert.equal(sessionMinutes("office", "18:00", "19:45"), 105);
  assert.equal(sessionMinutes("office", "18:00", "18:00"), 0);
  assert.equal(sessionMinutes("office", "18:00", "17:30"), 0);
});

test("Work log API totals a month and exports Excel-ready CSV", async () => {
  const store = openDatabase(":memory:");
  try {
    const app = createApp(
      store,
      null,
      async () => true,
      async () => ({ name: "Admin", allowed: true }),
    );
    const post = (body: object) =>
      request(app)
        .post("/api/backoffice/work")
        .set("Origin", "http://localhost:5173")
        .send(body);
    await post({
      date: "2026-10-20",
      kind: "office",
      start: "18:00",
      end: "18:00",
    }).expect(201);
    await post({
      date: "2026-10-20",
      kind: "remote",
      start: "20:00",
      end: "22:00",
      note: "Canlı ortam; hata",
    }).expect(201);
    await post({
      date: "2026-10-21",
      kind: "remote",
      start: "23:30",
      end: "01:00",
      note: '=HYPERLINK("x")',
    }).expect(201);
    await post({
      date: "2026-11-01",
      kind: "remote",
      start: "10:00",
      end: "11:00",
    }).expect(201);
    await post({
      date: "2026-10-22",
      kind: "remote",
      start: "25:00",
      end: "26:00",
    }).expect(400);

    const data = (
      await request(app).get("/api/backoffice/work?month=2026-10").expect(200)
    ).body.data;
    assert.equal(data.sessions.length, 3);
    assert.deepEqual(data.totals, {
      office: 0,
      remote: 210,
      all: 210,
      days: 2,
    });

    const csv = await request(app)
      .get("/api/backoffice/work/export?month=2026-10")
      .expect(200);
    assert.match(String(csv.headers["content-type"]), /text\/csv/);
    assert.match(
      String(csv.headers["content-disposition"]),
      /mesai-2026-10\.csv/,
    );
    const lines = csv.text.replace(/^\uFEFF/, "").trim().split("\r\n");
    assert.equal(
      lines[0],
      "Tarih;Tür;Başlangıç;Bitiş;Süre (saat);Süre (s:dk);Açıklama",
    );
    assert.equal(
      lines[2],
      '20.10.2026;Ofis dışı çalışma;20:00;22:00;2,00;2:00;"Canlı ortam; hata"',
    );
    assert.equal(
      lines[3],
      `21.10.2026;Ofis dışı çalışma;23:30;01:00;1,50;1:30;"'=HYPERLINK(""x"")"`,
    );
    assert.equal(lines[4], "Toplam;;;;3,50;3:30;");

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
