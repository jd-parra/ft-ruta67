import { getDb } from "@nucleo/db";
import type { ReciboNativo } from "@nucleo/hce/PasajeHce";

export interface ReciboLocal {
  bid: string;
  lineaCodigo: number;
  unidadCodigo: number;
  tramoCodigo: number;
  monto: number;
  ocurridoEn: string; // ISO 8601 UTC
}

function base64urlAUuid(b64url: string): string {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const hex = Array.from(bin, (c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function aReciboLocal(r: ReciboNativo): ReciboLocal {
  return {
    bid: base64urlAUuid(r.bid),
    lineaCodigo: r.lineaCodigo,
    unidadCodigo: r.unidadCodigo,
    tramoCodigo: r.tramoCodigo,
    monto: r.monto,
    ocurridoEn: new Date(r.ocurridoEn * 1000).toISOString(),
  };
}

// INSERT OR IGNORE: si el mismo recibo se drena dos veces no se duplica.
export async function guardarRecibos(recibos: ReciboLocal[]) {
  const db = await getDb();
  for (const r of recibos) {
    await db.runAsync(
      `INSERT OR IGNORE INTO recibos (bid, linea_codigo, unidad_codigo, tramo_codigo, monto, ocurrido_en)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [r.bid, r.lineaCodigo, r.unidadCodigo, r.tramoCodigo, r.monto, r.ocurridoEn]
    );
  }
}

// Tramo más frecuente por línea: { [lineaCodigo]: tramoCodigo }
export async function frecuentesPorLinea(): Promise<Record<string, number>> {
  const db = await getDb();
  const filas = await db.getAllAsync<{ linea_codigo: number; tramo_codigo: number; n: number }>(
    `SELECT linea_codigo, tramo_codigo, COUNT(*) AS n
       FROM recibos GROUP BY linea_codigo, tramo_codigo
      ORDER BY n DESC, MAX(ocurrido_en) DESC`
  );
  const out: Record<string, number> = {};
  for (const f of filas) out[String(f.linea_codigo)] ??= f.tramo_codigo;
  return out;
}

export async function listarRecibos(limite = 50): Promise<ReciboLocal[]> {
  const db = await getDb();
  const filas = await db.getAllAsync<Record<string, string | number>>(
    `SELECT * FROM recibos ORDER BY ocurrido_en DESC LIMIT ?`,
    [limite]
  );
  return filas.map((f) => ({
    bid: f.bid as string,
    lineaCodigo: f.linea_codigo as number,
    unidadCodigo: f.unidad_codigo as number,
    tramoCodigo: f.tramo_codigo as number,
    monto: f.monto as number,
    ocurridoEn: f.ocurrido_en as string,
  }));
}

/** bid de los boletos ya entregados por NFC: no se vuelven a guardar aunque el backend aún no sepa del cobro. */
export async function bidsConRecibo(): Promise<Set<string>> {
  const db = await getDb();
  const filas = await db.getAllAsync<{ bid: string }>(`SELECT bid FROM recibos`);
  return new Set(filas.map((f) => f.bid));
}

/** Recibos que aún no llegaron al backend, del más viejo al más nuevo. */
export async function recibosPendientes(limite: number): Promise<ReciboLocal[]> {
  const db = await getDb();
  const filas = await db.getAllAsync<Record<string, string | number>>(
    `SELECT * FROM recibos WHERE sincronizado = 0 ORDER BY ocurrido_en LIMIT ?`,
    [limite]
  );
  return filas.map((f) => ({
    bid: f.bid as string,
    lineaCodigo: f.linea_codigo as number,
    unidadCodigo: f.unidad_codigo as number,
    tramoCodigo: f.tramo_codigo as number,
    monto: f.monto as number,
    ocurridoEn: f.ocurrido_en as string,
  }));
}

export async function marcarRecibosSincronizados(bids: string[]) {
  const db = await getDb();
  for (const bid of bids) await db.runAsync(`UPDATE recibos SET sincronizado = 1 WHERE bid = ?`, [bid]);
}
