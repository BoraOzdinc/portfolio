import { lookup } from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import ipaddr from "ipaddr.js";
import { randomUUID } from "node:crypto";
import { and, desc, eq, isNull, gte } from "drizzle-orm";
import type { DB } from "./database";
import { monitors, checks, incidents, notifications } from "./schema";

export function isPublicAddress(address: string) {
  try {
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
}
export async function validateTarget(url: URL) {
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    !["", "80", "443"].includes(url.port)
  )
    throw new Error("Yalnız standart portlu HTTP/HTTPS adresleri desteklenir.");
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address)))
    throw new Error("Özel ağ ve yerel adresler izlenemez.");
  return addresses[0];
}
export type ProbeResult = {
  ok: boolean;
  status: number | null;
  latency: number;
  error: string | null;
};
export async function probe(
  target: typeof monitors.$inferSelect,
  transport: { validate?: typeof validateTarget; timeoutMs?: number } = {},
): Promise<ProbeResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timeoutMs = transport.timeoutMs ?? 10_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let url = new URL(target.url);
    for (let redirects = 0; redirects <= 5; redirects++) {
      const pinned = await Promise.race([
        (transport.validate ?? validateTarget)(url),
        new Promise<never>((_, reject) => {
          if (controller.signal.aborted)
            reject(new Error("Kontrol zaman aşımına uğradı."));
          controller.signal.addEventListener(
            "abort",
            () => reject(new Error("Kontrol zaman aşımına uğradı.")),
            { once: true },
          );
        }),
      ]);
      if (controller.signal.aborted)
        throw new Error("Kontrol zaman aşımına uğradı.");
      const response = await new Promise<{ status: number; location?: string }>(
        (resolve, reject) => {
          const request = (url.protocol === "https:" ? https : http).request(
            url,
            {
              method: target.method,
              signal: controller.signal,
              agent: false,
              family: pinned.family,
              headers: { "user-agent": "Portfolio-Monitor/1.0" },
              // Pin the validated address to this connection; prevent DNS rebinding.
              lookup: (_hostname, _options, callback) =>
                callback(null, pinned.address, pinned.family),
            },
            (res) => {
              resolve({
                status: res.statusCode ?? 0,
                location: res.headers.location,
              });
              res.destroy();
            },
          );
          request.on("error", reject);
          request.end();
        },
      );
      if (
        [301, 302, 303, 307, 308].includes(response.status) &&
        response.location
      ) {
        url = new URL(response.location, url);
        continue;
      }
      const ok =
        response.status >= target.statusMin &&
        response.status <= target.statusMax;
      return {
        ok,
        status: response.status,
        latency: Date.now() - start,
        error: ok ? null : `HTTP ${response.status}`,
      };
    }
    throw new Error("Çok fazla yönlendirme.");
  } catch (error) {
    return {
      ok: false,
      status: null,
      latency: Date.now() - start,
      error: controller.signal.aborted
        ? `${timeoutMs / 1000} saniyelik kontrol süresi aşıldı.`
        : error instanceof Error
          ? error.message.slice(0, 200)
          : "Bağlantı kurulamadı.",
    };
  } finally {
    clearTimeout(timer);
  }
}

export function recordCheck(
  db: DB,
  id: string,
  result: ProbeResult,
  now = new Date(),
) {
  const at = now.toISOString();
  db.transaction((tx) => {
    const monitor = tx.select().from(monitors).where(eq(monitors.id, id)).get();
    if (!monitor || !monitor.active) return;
    // A long sampling gap breaks consecutive-failure evidence.
    const consecutive =
      monitor.lastCheckedAt &&
      now.getTime() - Date.parse(monitor.lastCheckedAt) <= 20 * 60_000;
    const failures = result.ok ? 0 : (consecutive ? monitor.failures : 0) + 1;
    tx.insert(checks)
      .values({ id: randomUUID(), monitorId: id, checkedAt: at, ...result })
      .run();
    tx.update(monitors)
      .set({
        failures,
        lastCheckedAt: at,
        lastSuccessAt: result.ok ? at : monitor.lastSuccessAt,
        lastError: result.error,
        lastStatus: result.status,
        lastLatency: result.latency,
        nextCheckAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
      })
      .where(eq(monitors.id, id))
      .run();
    const incident = tx
      .select()
      .from(incidents)
      .where(and(eq(incidents.monitorId, id), isNull(incidents.resolvedAt)))
      .get();
    if (!result.ok && failures >= 2 && !incident) {
      const incidentId = randomUUID();
      tx.insert(incidents)
        .values({ id: incidentId, monitorId: id, openedAt: at })
        .run();
      tx.insert(notifications)
        .values({
          id: randomUUID(),
          key: `down:${incidentId}`,
          projectId: monitor.projectId,
          title: `${monitor.name}: kesinti`,
          body: `${monitor.name} iki ardışık kontrolde yanıt veremedi. ${result.error}`,
          kind: "down",
          createdAt: at,
        })
        .run();
    }
    if (result.ok && incident) {
      tx.update(incidents)
        .set({ resolvedAt: at })
        .where(eq(incidents.id, incident.id))
        .run();
      tx.insert(notifications)
        .values({
          id: randomUUID(),
          key: `recovery:${incident.id}`,
          projectId: monitor.projectId,
          title: `${monitor.name}: yeniden çalışıyor`,
          body: `${monitor.name} başarılı yanıt verdi. HTTP ${result.status}.`,
          kind: "recovery",
          createdAt: at,
        })
        .run();
    }
  });
}

export function monitorView(
  db: DB,
  monitor: typeof monitors.$inferSelect,
  now = new Date(),
) {
  const stale =
    !!monitor.lastCheckedAt &&
    now.getTime() - Date.parse(monitor.lastCheckedAt) > 20 * 60_000;
  const samples = db
    .select()
    .from(checks)
    .where(
      and(
        eq(checks.monitorId, monitor.id),
        gte(
          checks.checkedAt,
          new Date(now.getTime() - 30 * 86400000).toISOString(),
        ),
      ),
    )
    .orderBy(desc(checks.checkedAt))
    .all();
  const uptime = [1, 7, 30].map((days) => {
    const period = samples.filter(
      (c) => Date.parse(c.checkedAt) >= now.getTime() - days * 86400000,
    );
    return {
      days,
      samples: period.length,
      percent: period.length
        ? (period.filter((c) => c.ok).length / period.length) * 100
        : null,
    };
  });
  return {
    ...monitor,
    state: !monitor.active
      ? "paused"
      : !monitor.lastCheckedAt
        ? "unknown"
        : stale
          ? "stale"
          : monitor.failures >= 2
            ? "down"
            : monitor.failures
              ? "warning"
              : "up",
    uptime,
  };
}

export function createRunner(db: DB, runProbe = probe) {
  const running = new Set<string>();
  return async (id: string) => {
    if (running.has(id) || running.size >= 5) return false;
    const target = db.select().from(monitors).where(eq(monitors.id, id)).get();
    if (!target?.active) return false;
    running.add(id);
    try {
      recordCheck(db, id, await runProbe(target));
      return true;
    } finally {
      running.delete(id);
    }
  };
}
