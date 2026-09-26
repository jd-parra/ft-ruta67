import type { Linea, Tramo } from "../types/paquete";

export type ModoTramo = { tipo: "automatico" } | { tipo: "fijo"; tramoCodigo: number };

/**
 * Fijo: ese tramo. Automático: el sugerido por el pasajero si es de esta línea; si no
 * (00 00 o de otra línea), el más frecuente de la línea (el paquete los trae ordenados por frecuencia).
 */
export function elegirTramo(linea: Linea, modo: ModoTramo, tramoSugerido: number): Tramo | null {
  if (modo.tipo === "fijo") return linea.tramos.find((t) => t.codigo === modo.tramoCodigo) ?? null;
  const sugerido = tramoSugerido ? linea.tramos.find((t) => t.codigo === tramoSugerido) : undefined;
  if (sugerido) return sugerido;
  return [...linea.tramos].sort((a, b) => b.frecuencia - a.frecuencia)[0] ?? null;
}
