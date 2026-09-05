import { and, eq, lte, lt } from "drizzle-orm";
import type { Store } from "./database";
import { checks, monitors } from "./schema";
import { generatePayments } from "./billing";
import { prepareNotifications, deliverNotifications } from "./notifications";
import { backup } from "./backup";

export function startScheduler(
  store: Store,
  runMonitor: (id: string) => Promise<boolean>,
) {
  let busy = false;
  const tick = async () => {
    if (busy) return;
    busy = true;
    try {
      generatePayments(store.db);
      const due = store.db
        .select()
        .from(monitors)
        .where(
          and(
            eq(monitors.active, true),
            lte(monitors.nextCheckAt, new Date().toISOString()),
          ),
        )
        .orderBy(monitors.nextCheckAt)
        .limit(5)
        .all();
      await Promise.all(due.map((m) => runMonitor(m.id)));
      prepareNotifications(store.db);
      if (process.env.BACKOFFICE_EMAIL_ENABLED === "true")
        await deliverNotifications(store.db);
      store.db
        .delete(checks)
        .where(
          lt(
            checks.checkedAt,
            new Date(Date.now() - 90 * 86400000).toISOString(),
          ),
        )
        .run();
      await backup(store, process.env.BACKUP_PATH || "./backups");
    } catch (error) {
      console.error(
        "Backoffice zamanlayıcı hatası:",
        error instanceof Error ? error.message : "Bilinmeyen hata",
      );
    } finally {
      busy = false;
    }
  };
  const timer = setInterval(() => void tick(), 30_000);
  void tick();
  return async () => {
    clearInterval(timer);
    while (busy) await new Promise((resolve) => setTimeout(resolve, 100));
  };
}
