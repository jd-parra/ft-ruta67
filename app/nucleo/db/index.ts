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
  // Paquete del recolector (una sola fila). Sección 10.
  `CREATE TABLE IF NOT EXISTS paquete (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     json TEXT NOT NULL,
     guardado_en TEXT NOT NULL
   );`,
  // Cobros pendientes de subir y bid ya cobrados. Sección 10.
  `CREATE TABLE IF NOT EXISTS cola_cobros (
     bid TEXT PRIMARY KEY NOT NULL,
     raw TEXT NOT NULL,
     tramo_codigo INTEGER NOT NULL,
     monto INTEGER NOT NULL,
     metodo TEXT NOT NULL,
     ocurrido_en TEXT NOT NULL,
     categoria TEXT NOT NULL,
     sincronizado INTEGER NOT NULL DEFAULT 0
   );`,
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
