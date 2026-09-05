import Database from "better-sqlite3";
import { mkdir, readdir, stat, unlink, rename } from "node:fs/promises";
import { join } from "node:path";
import type { Store } from "./database";
import { today } from "./dates";

export async function backup(
  store: Store,
  directory: string,
  now = new Date(),
) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const destination = join(directory, `backoffice-${today(now)}.sqlite`);
  try {
    await stat(destination);
    return destination;
  } catch {
    /* no backup for today */
  }
  const temporary = `${destination}.partial`;
  await store.sqlite.backup(temporary);
  const check = new Database(temporary, { readonly: true });
  try {
    if (check.pragma("integrity_check", { simple: true }) !== "ok")
      throw new Error("Yedek doğrulanamadı.");
  } finally {
    check.close();
  }
  await rename(temporary, destination);
  for (const filename of await readdir(directory)) {
    if (!/^backoffice-\d{4}-\d{2}-\d{2}\.sqlite$/.test(filename)) continue;
    const file = join(directory, filename);
    if (now.getTime() - (await stat(file)).mtimeMs > 14 * 86400000)
      await unlink(file);
  }
  return destination;
}
