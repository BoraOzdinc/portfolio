import { Router, type Request, type ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, isNull, lte, count, like } from "drizzle-orm";
import { z } from "zod";
import type { DB } from "./database";
import * as s from "./schema";
import {
  projectInput,
  resourceInput,
  planInput,
  planChangeInput,
  monitorInput,
  date,
} from "../../shared/backoffice";
import { createPlan, changePlan, financeSummary, nextDue } from "./billing";
import { monitorView } from "./monitoring";
import { addDays, today } from "./dates";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
export type Identity = { name: string; allowed: boolean } | null;
export type Identify = (req: Request) => Promise<Identity>;
function found<T>(value: T | undefined): T {
  if (!value) throw new HttpError(404, "Kayıt bulunamadı.");
  return value;
}

export function snapshot(db: DB, query: Record<string, unknown> = {}) {
  const projectId = z
    .string()
    .optional()
    .parse(query.projectId || undefined);
  const page = z.coerce.number().int().min(1).default(1).parse(query.page);
  const status = z
    .enum(["all", "pending", "paid", "cancelled", "overdue"])
    .default("all")
    .parse(query.status);
  const search = z.string().max(160).default("").parse(query.q);
  const allProjects = db.select().from(s.projects).limit(1000).all();
  const links = db.select().from(s.projectResources).limit(5000).all();
  const allResources = db
    .select()
    .from(s.resources)
    .limit(2000)
    .all()
    .map((r) => ({
      ...r,
      sharedProjectIds: links
        .filter((l) => l.resourceId === r.id)
        .map((l) => l.projectId),
    }));
  const projectResources = allResources.filter(
    (r) =>
      !projectId ||
      r.ownerProjectId === projectId ||
      r.sharedProjectIds.includes(projectId),
  );
  const projectMonitors = db
    .select()
    .from(s.monitors)
    .limit(500)
    .all()
    .filter(
      (m) =>
        !projectId ||
        m.projectId === projectId ||
        projectResources.some((r) => r.id === m.resourceId),
    );
  const predicate = and(
    projectId ? eq(s.payments.projectId, projectId) : undefined,
    status === "all"
      ? undefined
      : eq(s.payments.status, status === "overdue" ? "pending" : status),
    status === "overdue"
      ? lte(s.payments.dueOn, addDays(today(), -1))
      : undefined,
    search ? like(s.payments.name, `%${search}%`) : undefined,
  );
  const paymentRows = db
    .select()
    .from(s.payments)
    .where(predicate)
    .orderBy(s.payments.dueOn)
    .limit(50)
    .offset((page - 1) * 50)
    .all();
  const upcoming = db
    .select()
    .from(s.payments)
    .where(
      and(
        projectId ? eq(s.payments.projectId, projectId) : undefined,
        eq(s.payments.status, "pending"),
        lte(s.payments.dueOn, addDays(today(), 30)),
      ),
    )
    .orderBy(s.payments.dueOn)
    .limit(12)
    .all();
  const monitorIds = projectMonitors.map((m) => m.id);
  return {
    projects: allProjects,
    resources: projectResources,
    plans: db
      .select()
      .from(s.billingPlans)
      .where(projectId ? eq(s.billingPlans.projectId, projectId) : undefined)
      .limit(2000)
      .all()
      .map((p) => ({ ...p, nextDue: p.active ? nextDue(p) : null })),
    payments: paymentRows,
    upcoming,
    paymentTotal: db
      .select({ value: count() })
      .from(s.payments)
      .where(predicate)
      .get()!.value,
    page,
    finance: financeSummary(db, projectId),
    monitors: projectMonitors.map((m) => monitorView(db, m)),
    incidents: monitorIds.length
      ? db
          .select()
          .from(s.incidents)
          .where(inArray(s.incidents.monitorId, monitorIds))
          .orderBy(desc(s.incidents.openedAt))
          .limit(100)
          .all()
      : [],
    notifications: db
      .select()
      .from(s.notifications)
      .where(projectId ? eq(s.notifications.projectId, projectId) : undefined)
      .orderBy(desc(s.notifications.createdAt))
      .limit(100)
      .all(),
    deliveries: db
      .select({
        id: s.deliveries.id,
        subject: s.deliveries.subject,
        createdAt: s.deliveries.createdAt,
        sentAt: s.deliveries.sentAt,
        attempts: s.deliveries.attempts,
        lastError: s.deliveries.lastError,
      })
      .from(s.deliveries)
      .orderBy(desc(s.deliveries.createdAt))
      .limit(100)
      .all(),
    today: today(),
    emailEnabled: process.env.BACKOFFICE_EMAIL_ENABLED === "true",
  };
}
export type Snapshot = ReturnType<typeof snapshot>;

export function backofficeRouter(
  db: DB,
  identify: Identify,
  runMonitor: (id: string) => Promise<boolean>,
  origin: string,
) {
  const router = Router();
  router.use(async (req, res, next) => {
    res.set("Cache-Control", "no-store");
    const identity = await identify(req);
    if (!identity)
      throw new HttpError(401, "Devam etmek için GitHub ile giriş yapın.");
    if (!identity.allowed)
      throw new HttpError(403, "Bu GitHub hesabının erişim yetkisi yok.");
    if (!["GET", "HEAD"].includes(req.method) && req.headers.origin !== origin)
      throw new HttpError(403, "İstek kaynağı doğrulanamadı.");
    res.locals.identity = identity;
    next();
  });
  router.get("/session", (_req, res) =>
    res.json({ data: res.locals.identity as Identity }),
  );
  router.get("/snapshot", (req, res) =>
    res.json({ data: snapshot(db, req.query) }),
  );
  const requireProject = (id: string) =>
    found(db.select().from(s.projects).where(eq(s.projects.id, id)).get());
  const requireResource = (id: string) =>
    found(db.select().from(s.resources).where(eq(s.resources.id, id)).get());
  router.post("/projects", (req, res) => {
    const input = projectInput.parse(req.body);
    const row = db
      .insert(s.projects)
      .values({ id: randomUUID(), ...input })
      .returning()
      .get();
    res.status(201).json({ data: row });
  });
  router.patch("/projects/:id", (req, res) => {
    const id = String(req.params.id);
    requireProject(id);
    res.json({
      data: db
        .update(s.projects)
        .set(projectInput.partial().parse(req.body))
        .where(eq(s.projects.id, id))
        .returning()
        .get(),
    });
  });
  router.post("/resources", (req, res) => {
    const { sharedProjectIds, ...input } = resourceInput.parse(req.body);
    requireProject(input.ownerProjectId);
    sharedProjectIds.forEach(requireProject);
    const row = db.transaction((tx) => {
      const row = tx
        .insert(s.resources)
        .values({ ...input, id: randomUUID() })
        .returning()
        .get();
      for (const projectId of new Set(
        sharedProjectIds.filter((id) => id !== row.ownerProjectId),
      ))
        tx.insert(s.projectResources)
          .values({ resourceId: row.id, projectId })
          .run();
      return row;
    });
    res.status(201).json({ data: row });
  });
  router.patch("/resources/:id", (req, res) => {
    const id = String(req.params.id),
      existing = requireResource(id);
    const links = db
      .select()
      .from(s.projectResources)
      .where(eq(s.projectResources.resourceId, id))
      .all()
      .map((l) => l.projectId);
    const { sharedProjectIds, ...input } = resourceInput.parse({
      ...existing,
      sharedProjectIds: links,
      ...resourceInput.partial().parse(req.body),
    });
    requireProject(input.ownerProjectId);
    sharedProjectIds.forEach(requireProject);
    if (
      input.ownerProjectId !== existing.ownerProjectId &&
      db
        .select()
        .from(s.billingPlans)
        .where(eq(s.billingPlans.resourceId, id))
        .get()
    )
      throw new HttpError(
        409,
        "Ödeme planı bulunan hizmetin masraf sahibi değiştirilemez.",
      );
    db.transaction((tx) => {
      tx.update(s.resources).set(input).where(eq(s.resources.id, id)).run();
      tx.delete(s.projectResources)
        .where(eq(s.projectResources.resourceId, id))
        .run();
      for (const projectId of new Set(
        sharedProjectIds.filter((p) => p !== input.ownerProjectId),
      ))
        tx.insert(s.projectResources)
          .values({ resourceId: id, projectId })
          .run();
      if (!input.active)
        tx.update(s.billingPlans)
          .set({ active: false })
          .where(eq(s.billingPlans.resourceId, id))
          .run();
    });
    res.json({ data: { id } });
  });
  router.post("/resources/:id/renew", (req, res) => {
    const id = String(req.params.id),
      resource = requireResource(id);
    const { expiresOn } = z.object({ expiresOn: date }).parse(req.body);
    if (
      resource.type !== "domain" ||
      (resource.expiresOn && expiresOn <= resource.expiresOn)
    )
      throw new HttpError(
        400,
        "Yeni domain bitişi mevcut tarihten sonra olmalı.",
      );
    db.update(s.resources)
      .set({ expiresOn })
      .where(eq(s.resources.id, id))
      .run();
    res.json({ data: { id, expiresOn } });
  });
  router.post("/plans", (req, res) => {
    const input = planInput.parse(req.body);
    requireProject(input.projectId);
    if (input.resourceId) {
      const resource = requireResource(input.resourceId);
      if (
        !resource.active ||
        resource.ownerProjectId !== input.projectId ||
        input.direction !== "expense"
      )
        throw new HttpError(
          400,
          "Hizmet gideri aktif hizmetin masraf sahibine ait olmalı.",
        );
      if (
        db
          .select()
          .from(s.billingPlans)
          .where(eq(s.billingPlans.resourceId, input.resourceId))
          .get()
      )
        throw new HttpError(409, "Bu hizmetin zaten bir ödeme planı var.");
    }
    res.status(201).json({ data: createPlan(db, input) });
  });
  router.patch("/plans/:id", (req, res) => {
    const id = String(req.params.id),
      input = planChangeInput.parse(req.body);
    const plan = found(
      db.select().from(s.billingPlans).where(eq(s.billingPlans.id, id)).get(),
    );
    if (!plan.active) throw new HttpError(409, "Plan aktif değil.");
    res.json({ data: changePlan(db, id, input.amount, input.frequency) });
  });
  router.post("/plans/:id/cancel", (req, res) => {
    const id = String(req.params.id);
    found(
      db.select().from(s.billingPlans).where(eq(s.billingPlans.id, id)).get(),
    );
    db.update(s.billingPlans)
      .set({ active: false })
      .where(eq(s.billingPlans.id, id))
      .run();
    res.json({ data: { id } });
  });
  router.patch("/payments/:id", (req, res) => {
    const id = String(req.params.id),
      input = z
        .object({ status: z.enum(["paid", "cancelled"]) })
        .parse(req.body);
    const row = found(
      db.select().from(s.payments).where(eq(s.payments.id, id)).get(),
    );
    if (row.status !== "pending")
      throw new HttpError(409, "Yalnız bekleyen hareketler güncellenebilir.");
    db.update(s.payments)
      .set({
        status: input.status,
        paidAt: input.status === "paid" ? new Date().toISOString() : null,
      })
      .where(eq(s.payments.id, id))
      .run();
    res.json({ data: { id } });
  });
  const checkMonitorLink = (input: z.infer<typeof monitorInput>) => {
    requireProject(input.projectId);
    if (input.resourceId) {
      const resource = requireResource(input.resourceId);
      const link = db
        .select()
        .from(s.projectResources)
        .where(
          and(
            eq(s.projectResources.resourceId, input.resourceId),
            eq(s.projectResources.projectId, input.projectId),
          ),
        )
        .get();
      if (resource.ownerProjectId !== input.projectId && !link)
        throw new HttpError(400, "Hizmet bu projeye bağlı değil.");
    }
  };
  router.post("/monitors", (req, res) => {
    const input = monitorInput.parse(req.body);
    checkMonitorLink(input);
    res.status(201).json({
      data: db
        .insert(s.monitors)
        .values({
          ...input,
          id: randomUUID(),
          nextCheckAt: new Date().toISOString(),
        })
        .returning()
        .get(),
    });
  });
  router.patch("/monitors/:id", (req, res) => {
    const id = String(req.params.id),
      existing = found(
        db.select().from(s.monitors).where(eq(s.monitors.id, id)).get(),
      );
    const input = monitorInput.parse(req.body);
    checkMonitorLink(input);
    if (
      input.url !== existing.url ||
      input.method !== existing.method ||
      input.statusMin !== existing.statusMin ||
      input.statusMax !== existing.statusMax
    )
      throw new HttpError(
        409,
        "Geçmişi korumak için farklı hedef veya başarı kuralını yeni kontrol olarak ekleyin.",
      );
    db.update(s.monitors)
      .set({ ...input, nextCheckAt: new Date().toISOString() })
      .where(eq(s.monitors.id, id))
      .run();
    res.json({ data: { id } });
  });
  router.post("/monitors/:id/run", async (req, res) => {
    const id = String(req.params.id),
      row = found(
        db.select().from(s.monitors).where(eq(s.monitors.id, id)).get(),
      );
    if (
      row.lastCheckedAt &&
      Date.now() - Date.parse(row.lastCheckedAt) < 60_000
    )
      throw new HttpError(429, "Yeniden kontrol için bir dakika bekleyin.");
    if (!(await runMonitor(id)))
      throw new HttpError(
        409,
        "Kontrol duraklatılmış veya başka kontroller çalışıyor.",
      );
    res.json({ data: { id } });
  });
  router.get("/monitors/:id/history", (req, res) => {
    const id = String(req.params.id);
    found(db.select().from(s.monitors).where(eq(s.monitors.id, id)).get());
    res.json({
      data: db
        .select()
        .from(s.checks)
        .where(eq(s.checks.monitorId, id))
        .orderBy(desc(s.checks.checkedAt))
        .limit(100)
        .all(),
    });
  });
  router.post("/notifications/:id/read", (req, res) => {
    const id = String(req.params.id);
    found(
      db.select().from(s.notifications).where(eq(s.notifications.id, id)).get(),
    );
    db.update(s.notifications)
      .set({ readAt: new Date().toISOString() })
      .where(eq(s.notifications.id, id))
      .run();
    res.json({ data: { id } });
  });
  router.post("/deliveries/:id/retry", (req, res) => {
    const id = String(req.params.id);
    found(
      db
        .select()
        .from(s.deliveries)
        .where(and(eq(s.deliveries.id, id), isNull(s.deliveries.sentAt)))
        .get(),
    );
    db.update(s.deliveries)
      .set({ nextAttemptAt: new Date().toISOString() })
      .where(eq(s.deliveries.id, id))
      .run();
    res.json({ data: { id } });
  });
  return router;
}
export const apiErrors: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  void _next;
  if (error instanceof z.ZodError) {
    res
      .status(400)
      .json({
        error: {
          code: "VALIDATION",
          message: "Alanları kontrol edin.",
          details: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
        },
      });
    return;
  }
  const status = error instanceof HttpError ? error.status : 500;
  if (status === 500)
    console.error(
      "Backoffice API hatası:",
      error instanceof Error ? error.message : "Bilinmeyen hata",
    );
  res
    .status(status)
    .json({
      error: {
        code: `HTTP_${status}`,
        message:
          error instanceof HttpError ? error.message : "İşlem tamamlanamadı.",
      },
    });
};
