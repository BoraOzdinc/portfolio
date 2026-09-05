import "dotenv/config";
import { openDatabase } from "./backoffice/database";
import { configureAuth } from "./backoffice/auth";
import { createRunner } from "./backoffice/monitoring";
import { startScheduler } from "./backoffice/scheduler";
import { createApp } from "./app";

process.umask(0o077);
const store = openDatabase(
  process.env.DATABASE_PATH || "./data/backoffice.sqlite",
);
const auth = await configureAuth(store);
if (!auth)
  console.warn("Backoffice kapalı: GitHub OAuth ortam ayarları eksik.");
const runner = createRunner(store.db);
const server = createApp(store, auth, runner).listen(
  Number(process.env.PORT || 3001),
  process.env.HOST || "127.0.0.1",
  () => console.log("Portfolio sunucusu hazır."),
);
const stopScheduler = startScheduler(store, runner);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await Promise.all([
    new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    ),
    stopScheduler(),
  ]);
  store.sqlite.close();
}
process.on("SIGTERM", () => void stop());
process.on("SIGINT", () => void stop());
