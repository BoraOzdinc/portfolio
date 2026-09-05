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
