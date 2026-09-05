import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import type {
  ResourceInput,
  Frequency,
  Currency,
} from "../../shared/backoffice";

export const projects = sqliteTable("projects", {
  id: text().primaryKey(),
  name: text().notNull(),
  contact: text().notNull(),
  description: text().notNull(),
  url: text().notNull(),
  portfolioSlug: text().notNull(),
  archived: integer({ mode: "boolean" }).notNull().default(false),
});
export const resources = sqliteTable("resources", {
  id: text().primaryKey(),
  ownerProjectId: text()
    .notNull()
    .references(() => projects.id),
  name: text().notNull(),
  type: text().$type<ResourceInput["type"]>().notNull(),
  provider: text().notNull(),
  panelUrl: text().notNull(),
  notes: text().notNull(),
  active: integer({ mode: "boolean" }).notNull(),
  domain: text().notNull(),
  expiresOn: text(),
  autoRenew: integer({ mode: "boolean" }).notNull(),
  hostname: text().notNull(),
  region: text().notNull(),
  capacity: text().notNull(),
  addresses: text({ mode: "json" }).$type<string[]>().notNull(),
  customType: text().notNull(),
});
export const projectResources = sqliteTable(
  "projectResources",
  {
    projectId: text()
      .notNull()
      .references(() => projects.id),
    resourceId: text()
      .notNull()
      .references(() => resources.id),
  },
  (t) => [uniqueIndex("project_resource").on(t.projectId, t.resourceId)],
);
export const billingPlans = sqliteTable(
  "billingPlans",
  {
    id: text().primaryKey(),
    projectId: text()
      .notNull()
      .references(() => projects.id),
    resourceId: text().references(() => resources.id),
    name: text().notNull(),
    direction: text().$type<"expense" | "income">().notNull(),
    amount: integer().notNull(),
    currency: text().$type<Currency>().notNull(),
    frequency: text().$type<Frequency>().notNull(),
    anchor: text().notNull(),
    nextIndex: integer().notNull().default(0),
    active: integer({ mode: "boolean" }).notNull().default(true),
    pendingAmount: integer(),
    pendingFrequency: text().$type<Frequency>(),
    pendingFrom: text(),
  },
  (t) => [uniqueIndex("one_plan_per_resource").on(t.resourceId)],
);
export const payments = sqliteTable(
  "payments",
  {
    id: text().primaryKey(),
    planId: text()
      .notNull()
      .references(() => billingPlans.id),
    projectId: text()
      .notNull()
      .references(() => projects.id),
    resourceId: text().references(() => resources.id),
    name: text().notNull(),
    direction: text().$type<"expense" | "income">().notNull(),
    amount: integer().notNull(),
    currency: text().$type<Currency>().notNull(),
    dueOn: text().notNull(),
    status: text()
      .$type<"pending" | "paid" | "cancelled">()
      .notNull()
      .default("pending"),
    paidAt: text(),
  },
  (t) => [
    uniqueIndex("payment_period").on(t.planId, t.dueOn),
    index("payment_due").on(t.status, t.dueOn),
  ],
);
export const monitors = sqliteTable("monitors", {
  id: text().primaryKey(),
  projectId: text()
    .notNull()
    .references(() => projects.id),
  resourceId: text().references(() => resources.id),
  name: text().notNull(),
  url: text().notNull(),
  method: text().$type<"GET" | "HEAD">().notNull(),
  active: integer({ mode: "boolean" }).notNull(),
  statusMin: integer().notNull(),
  statusMax: integer().notNull(),
  failures: integer().notNull().default(0),
  lastCheckedAt: text(),
  lastSuccessAt: text(),
  lastError: text(),
  lastStatus: integer(),
  lastLatency: integer(),
  nextCheckAt: text().notNull(),
});
export const checks = sqliteTable(
  "checks",
  {
    id: text().primaryKey(),
    monitorId: text()
      .notNull()
      .references(() => monitors.id),
    checkedAt: text().notNull(),
    ok: integer({ mode: "boolean" }).notNull(),
    status: integer(),
    latency: integer().notNull(),
    error: text(),
  },
  (t) => [
    index("monitor_checks").on(t.monitorId, t.checkedAt),
    index("check_retention").on(t.checkedAt),
  ],
);
export const incidents = sqliteTable("incidents", {
  id: text().primaryKey(),
  monitorId: text()
    .notNull()
    .references(() => monitors.id),
  openedAt: text().notNull(),
  resolvedAt: text(),
});
export const notifications = sqliteTable("notifications", {
  id: text().primaryKey(),
  key: text().notNull().unique(),
  projectId: text().references(() => projects.id),
  title: text().notNull(),
  body: text().notNull(),
  kind: text().$type<"reminder" | "down" | "recovery">().notNull(),
  createdAt: text().notNull(),
  readAt: text(),
  deliveryId: text(),
});
export const deliveries = sqliteTable("deliveries", {
  id: text().primaryKey(),
  subject: text().notNull(),
  body: text().notNull(),
  createdAt: text().notNull(),
  attempts: integer().notNull().default(0),
  nextAttemptAt: text().notNull(),
  sentAt: text(),
  lastError: text(),
});
