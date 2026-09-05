import express from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import { toNodeHandler } from "better-auth/node";
import {
  backofficeRouter,
  apiErrors,
  type Identify,
} from "./backoffice/router";
import type { Store } from "./backoffice/database";
import type { configureAuth } from "./backoffice/auth";
import {
  InquiryError,
  parseInquiryPayload,
  sendInquiryEmail,
} from "./inquiry-service.mjs";

export function createApp(
  store: Store,
  authConfig: Awaited<ReturnType<typeof configureAuth>>,
  runMonitor: (id: string) => Promise<boolean>,
  identify?: Identify,
) {
  const app = express();
  app.disable("x-powered-by");
  app.use(["/backoffice", "/api/backoffice"], (_req, res, next) => {
    res.set("X-Robots-Tag", "noindex, nofollow");
    next();
  });
  if (authConfig) app.all("/api/auth/*splat", toNodeHandler(authConfig.auth));
  else
    app.use("/api/auth", (_req, res) =>
      res
        .status(503)
        .json({
          error: { message: "GitHub giriş ayarları henüz tamamlanmadı." },
        }),
    );
  app.use(express.json({ limit: "128kb" }));
  if (authConfig || identify)
    app.use(
      "/api/backoffice",
      backofficeRouter(
        store.db,
        identify ?? authConfig!.identify,
        runMonitor,
        new URL(process.env.BETTER_AUTH_URL || "http://localhost:5173").origin,
      ),
    );
  else
    app.use("/api/backoffice", (_req, res) =>
      res
        .status(503)
        .json({
          error: { message: "Backoffice giriş ayarları henüz tamamlanmadı." },
        }),
    );
  app.post("/api/inquiry", async (req, res) => {
    try {
      await sendInquiryEmail(parseInquiryPayload(req.body));
      res.json({ ok: true });
    } catch (error) {
      res
        .status(
          error instanceof InquiryError && error.status < 500
            ? error.status
            : 500,
        )
        .json({
          error:
            error instanceof InquiryError && error.status < 500
              ? error.message
              : "The inquiry could not be sent right now. Please try again later.",
        });
    }
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: { message: "API bulunamadı." } }),
  );
  const dist = path.resolve("dist");
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^(?!\/api\/).*/, (_req, res) =>
      res.sendFile(path.join(dist, "index.html")),
    );
  }
  app.use(apiErrors);
  return app;
}
