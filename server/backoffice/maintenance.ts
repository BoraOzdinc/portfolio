import "dotenv/config";
import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { openDatabase } from "./database";
import { backup } from "./backup";

const [command, source, target] = process.argv.slice(2);
if (command === "backup") {
  const store = openDatabase(
    process.env.DATABASE_PATH || "./data/backoffice.sqlite",
  );
  try {
    console.log(await backup(store, process.env.BACKUP_PATH || "./backups"));
  } finally {
    store.sqlite.close();
  }
} else if (command === "restore" && source && target) {
  if (existsSync(target))
    throw new Error(
      "Hedef zaten var. Geri yükleme için yeni bir dosya adı seçin.",
    );
  const input = new Database(resolve(source), {
    readonly: true,
    fileMustExist: true,
  });
  try {
    if (input.pragma("integrity_check", { simple: true }) !== "ok")
      throw new Error("Kaynak yedek geçersiz.");
    mkdirSync(dirname(resolve(target)), { recursive: true, mode: 0o700 });
    await input.backup(resolve(target));
    console.log(`Geri yüklendi: ${resolve(target)}`);
  } finally {
    input.close();
  }
} else
  throw new Error(
    "Kullanım: pnpm db:backup veya pnpm db:restore <yedek.sqlite> <yeni-hedef.sqlite>",
  );
