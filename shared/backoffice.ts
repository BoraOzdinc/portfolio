import { z } from "zod";

export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => {
    const d = new Date(`${v}T00:00:00Z`);
    return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === v;
  }, "Geçerli bir tarih girin.");
const text = z.string().trim().max(4000);
const name = z.string().trim().min(1).max(160);
const link = z.union([
  z.literal(""),
  z.url().refine((v) => /^https?:\/\//.test(v), "HTTP/HTTPS bağlantısı girin."),
]);
export const projectInput = z.object({
  name,
  contact: text.default(""),
  description: text.default(""),
  url: link.default(""),
  portfolioSlug: text.default(""),
  archived: z.boolean().default(false),
});
export const resourceInput = z.object({
  name,
  type: z.enum(["domain", "vps", "email", "api", "custom"]),
  ownerProjectId: z.string().min(1),
  sharedProjectIds: z.array(z.string()).max(100).default([]),
  provider: text.default(""),
  panelUrl: link.default(""),
  notes: text.default(""),
  active: z.boolean().default(true),
  domain: text.default(""),
  expiresOn: date.nullable().default(null),
  autoRenew: z.boolean().default(false),
  hostname: text.default(""),
  region: text.default(""),
  capacity: text.default(""),
  addresses: z.array(z.email()).max(100).default([]),
  customType: text.default(""),
});
export const planInput = z.object({
  projectId: z.string().min(1),
  resourceId: z.string().nullable().default(null),
  name,
  direction: z.enum(["expense", "income"]),
  amount: z.number().int().min(1).max(100_000_000_000),
  currency: z.enum(["TRY", "USD", "EUR"]),
  frequency: z.enum(["once", "monthly", "yearly"]),
  firstDue: date,
});
export const planChangeInput = planInput.pick({
  amount: true,
  frequency: true,
});
export const monitorInput = z
  .object({
    projectId: z.string().min(1),
    resourceId: z.string().nullable().default(null),
    name,
    url: z.url().refine((v) => /^https?:\/\//.test(v)),
    method: z.enum(["GET", "HEAD"]).default("GET"),
    active: z.boolean().default(true),
    statusMin: z.number().int().min(100).max(599).default(200),
    statusMax: z.number().int().min(100).max(599).default(399),
  })
  .refine((v) => v.statusMax >= v.statusMin, "Durum kodu aralığı geçersiz.");
export type ProjectInput = z.infer<typeof projectInput>;
export type ResourceInput = z.infer<typeof resourceInput>;
export type PlanInput = z.infer<typeof planInput>;
export type MonitorInput = z.infer<typeof monitorInput>;
export type Frequency = PlanInput["frequency"];
export type Currency = PlanInput["currency"];

// Personal budget. Amounts are kuruş (TRY × 100); quantities may be fractional.
const kurus = z.number().int().min(0).max(100_000_000_000);
export const budgetItemInput = z
  .object({
    name,
    direction: z.enum(["expense", "income"]),
    amount: kurus.min(1),
    frequency: z.enum(["once", "monthly", "yearly"]),
    startOn: date,
    endOn: date.nullable().default(null),
  })
  .refine(
    (v) => !v.endOn || v.endOn >= v.startOn,
    "Bitiş tarihi başlangıçtan önce olamaz.",
  );
export const cardInput = z.object({
  name,
  bank: text.default(""),
  creditLimit: kurus,
  dueDay: z.number().int().min(1).max(31),
  minRate: z.number().int().min(1).max(100).nullable().default(null),
});
export const statementInput = z.object({
  cardId: z.string().min(1),
  dueOn: date,
  balance: kurus,
  minimum: kurus.nullable().default(null),
});
export const accountInput = z.object({
  name,
  balance: z.number().int().min(-100_000_000_000).max(100_000_000_000),
});
export const holdingInput = z.object({
  asset: z.string().trim().min(1).max(40),
  quantity: z.number().positive().max(1_000_000_000),
  buyPrice: kurus,
  boughtOn: date,
  note: text.default(""),
});
export type BudgetItemInput = z.infer<typeof budgetItemInput>;
export const transactionInput = z.object({
  itemId: z.string().min(1).nullable().default(null),
  name,
  direction: z.enum(["expense", "income"]),
  amount: kurus.min(1),
  date,
  note: text.default(""),
});
const clock = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Saat SS:DD biçiminde olmalı.");
export const workSessionInput = z.object({
  date,
  kind: z.enum(["office", "remote"]),
  start: clock,
  end: clock,
  note: text.default(""),
});
