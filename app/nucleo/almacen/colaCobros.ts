import { getDb } from "@nucleo/db";
import type { CobroPersistir } from "@nucleo/nfc/ejecutarCobro";

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
