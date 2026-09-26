import { getDb } from "@nucleo/db";
import type { PaqueteRecolector } from "@nucleo/types/paquete";

export async function guardarPaquete(p: PaqueteRecolector) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO paquete (id, json, guardado_en) VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET json = excluded.json, guardado_en = excluded.guardado_en`,
    [JSON.stringify(p), new Date().toISOString()]
  );
}

export async function leerPaquete(): Promise<PaqueteRecolector | null> {
  const db = await getDb();
  const fila = await db.getFirstAsync<{ json: string }>("SELECT json FROM paquete WHERE id = 1");
  return fila ? (JSON.parse(fila.json) as PaqueteRecolector) : null;
}
