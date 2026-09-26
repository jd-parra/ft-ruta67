import { fallo, prepararCobro, type CobroPersistir, type Falla, type OpcionesPreparar, type CobroPreparado } from "../nfc/ejecutarCobro";
import type { FilaCobro } from "../types/cobros";

export interface DepsCorreccion {
  obtener: (bid: string) => Promise<FilaCobro | null>;
  cobrados: () => Promise<Set<string>>;
  /** DELETE /sync/cobros/:bid. Lanza con el mensaje del backend si no se puede (p. ej. pasaron 2 min). */
  anular: (bid: string) => Promise<void>;
  eliminar: (bid: string) => Promise<void>;
  persistir: (c: CobroPersistir) => Promise<void>;
  /** Espera a que termine cualquier subida en curso, para no anular un cobro que aún está viajando. */
  esperarSubida: () => Promise<unknown>;
}

export interface Cambios {
  tramoCodigo?: number;
  comoGeneral?: boolean;
}

/**
 * Botones «Corregir» y «Cobrar como general».
 *
 * El boleto ya se consumió en el teléfono del pasajero (RECIBO), así que NO se vuelve a leer por NFC:
 * se re-cobra el mismo boleto guardado en cola_cobros con el otro tramo / categoría.
 * Orden de seguridad: primero se PREPARA el nuevo cobro (puede fallar, p. ej. BOLETO_INSUFICIENTE);
 * solo si es válido se anula el viejo. Así nunca se pierde un cobro por una corrección fallida.
 */
export async function corregirCobro(
  d: DepsCorreccion,
  bid: string,
  cambios: Cambios,
  opciones: Omit<OpcionesPreparar, "modo" | "yaCobrado" | "categoriaForzada" | "ahora">
): Promise<CobroPreparado | Falla> {
  await d.esperarSubida();
  const previo = await d.obtener(bid);
  if (!previo) return fallo("CORRECCION_FALLIDA", "No se encontró el cobro a corregir");

  const yaCobrado = await d.cobrados();
  yaCobrado.delete(bid); // el mismo boleto se puede volver a cobrar: es la corrección
  const nuevo = prepararCobro(previo.raw, 0, {
    ...opciones,
    yaCobrado,
    modo: { tipo: "fijo", tramoCodigo: cambios.tramoCodigo ?? previo.tramoCodigo },
    // Se conserva la categoría ya aplicada: un cambio de tramo no debe "des-forzar" el general.
    categoriaForzada: cambios.comoGeneral || previo.categoria === "general" ? "general" : undefined,
    ahora: new Date(previo.ocurridoEn), // el momento del cobro no cambia
  });
  if (!nuevo.ok) return nuevo;

  if (previo.estado !== "pendiente") {
    try {
      await d.anular(bid);
    } catch (e) {
      return fallo("CORRECCION_FALLIDA", (e as Error).message || "No se pudo anular el cobro. Intenta con conexión.");
    }
  }
  await d.eliminar(bid);
  try {
    await d.persistir({ bid, cobro: nuevo.cobro, categoria: nuevo.categoriaAplicada });
  } catch {
    return fallo("ERROR_LOCAL");
  }
  return nuevo;
}
