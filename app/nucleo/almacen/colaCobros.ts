import { getDb } from "@nucleo/db";
import type { CobroPersistir } from "@nucleo/nfc/ejecutarCobro";
import { inicioDelDia } from "@nucleo/tarifas/zonaHoraria";
import type { EstadoCobro, FilaCobro } from "@nucleo/types/cobros";

interface Fila {
  bid: string; raw: string; tramo_codigo: number; monto: number; metodo: "nfc" | "qr";
  ocurrido_en: string; categoria: FilaCobro["categoria"]; estado: EstadoCobro;
  codigo: string | null; pasajero_nombre: string | null;
}

const aFila = (f: Fila): FilaCobro => ({
  bid: f.bid, raw: f.raw, tramoCodigo: f.tramo_codigo, monto: f.monto, metodo: f.metodo,
  ocurridoEn: f.ocurrido_en, categoria: f.categoria, estado: f.estado, codigo: f.codigo,
  pasajeroNombre: f.pasajero_nombre,
});

// El bid queda en la tabla aunque ya se haya sincronizado: es la lista de "ya cobrados" (regla 3 de 8.3).
export async function bidsCobrados(): Promise<Set<string>> {
  const db = await getDb();
  const filas = await db.getAllAsync<{ bid: string }>("SELECT bid FROM cola_cobros");
  return new Set(filas.map((f) => f.bid));
}

// INSERT sin OR IGNORE: un bid repetido lanza error y el cobro no sigue adelante.
export async function encolarCobro({ bid, cobro, categoria }: CobroPersistir) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO cola_cobros (bid, raw, tramo_codigo, monto, metodo, ocurrido_en, categoria)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [bid, cobro.raw, cobro.tramoCodigo, cobro.monto, cobro.metodo, cobro.ocurridoEn, categoria]
  );
}

export async function obtenerCobro(bid: string): Promise<FilaCobro | null> {
  const db = await getDb();
  const f = await db.getFirstAsync<Fila>("SELECT * FROM cola_cobros WHERE bid = ?", [bid]);
  return f ? aFila(f) : null;
}

export async function cobrosPendientes(): Promise<FilaCobro[]> {
  const db = await getDb();
  const fs = await db.getAllAsync<Fila>("SELECT * FROM cola_cobros WHERE estado = 'pendiente' ORDER BY ocurrido_en");
  return fs.map(aFila);
}

export async function marcarCobro(bid: string, estado: EstadoCobro, extra: { codigo?: string; nombre?: string } = {}) {
  const db = await getDb();
  await db.runAsync(
    "UPDATE cola_cobros SET estado = ?, codigo = ?, pasajero_nombre = COALESCE(?, pasajero_nombre) WHERE bid = ?",
    [estado, extra.codigo ?? null, extra.nombre ?? null, bid]
  );
}

export async function eliminarCobro(bid: string) {
  const db = await getDb();
  await db.runAsync("DELETE FROM cola_cobros WHERE bid = ?", [bid]);
}

/** Contador del día (hora de Mérida). Incluye lo aún no subido; excluye rechazados y conflictos. */
export async function resumenDelDia(ahora = new Date()): Promise<{ cantidad: number; total: number }> {
  const db = await getDb();
  const r = await db.getFirstAsync<{ n: number; total: number | null }>(
    `SELECT COUNT(*) AS n, SUM(monto) AS total FROM cola_cobros
      WHERE ocurrido_en >= ? AND estado IN ('pendiente', 'ok', 'duplicado')`,
    [inicioDelDia(ahora)]
  );
  return { cantidad: r?.n ?? 0, total: r?.total ?? 0 };
}
