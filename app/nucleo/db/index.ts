import * as SQLite from "expo-sqlite";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Cada entrada es idempotente (IF NOT EXISTS).
const migraciones = [
  // Recibos del pasajero (contrato sección 10). Son la base de "frecuentes por línea".
  `CREATE TABLE IF NOT EXISTS recibos (
     bid TEXT PRIMARY KEY NOT NULL,
     linea_codigo INTEGER NOT NULL,
     unidad_codigo INTEGER NOT NULL,
     tramo_codigo INTEGER NOT NULL,
     monto INTEGER NOT NULL,
     ocurrido_en TEXT NOT NULL,
     sincronizado INTEGER NOT NULL DEFAULT 0
   );`,
  `CREATE INDEX IF NOT EXISTS idx_recibos_linea ON recibos (linea_codigo, tramo_codigo);`,
];

export function getDb() {
  dbPromise ??= (async () => {
    const db = await SQLite.openDatabaseAsync("pasaje.db");
    await db.execAsync("PRAGMA journal_mode = WAL;");
    for (const sql of migraciones) await db.execAsync(sql);
    return db;
  })();
  return dbPromise;
}
