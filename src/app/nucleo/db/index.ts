import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Base local (offline). Las tablas concretas las define cada feature vía `migraciones`.
const migraciones: string[] = [];

export function getDb() {
  dbPromise ??= (async () => {
    const db = await SQLite.openDatabaseAsync("ruta67.db");
    await db.execAsync("PRAGMA journal_mode = WAL;");
    for (const sql of migraciones) await db.execAsync(sql);
    return db;
  })();
  return dbPromise;
}
