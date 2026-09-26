import type { Categoria } from "../types/auth";
import type { Linea, Tabulador, Tramo } from "../types/paquete";

// Fórmula de la sección 7. Cuando Juan suba /shared/tarifa.js, esto se reemplaza por ese módulo:
// backend y recolector deben calcular IGUAL.

// Mérida (UTC-4, sin horario de verano): el día se decide en hora local, no UTC.
const OFFSET_VE_MS = -4 * 3600 * 1000;

export function esDomingoOFeriado(ocurridoEn: Date, feriados: string[]): boolean {
  const local = new Date(ocurridoEn.getTime() + OFFSET_VE_MS);
  const dia = local.toISOString().slice(0, 10);
  return local.getUTCDay() === 0 || feriados.includes(dia);
}

/** Tabulador vigente en `ocurridoEn`: el próximo si ya entró en vigor, si no el actual. */
export function tabuladorVigente(t: Tabulador, proximo: Tabulador | null, ocurridoEn: Date): Tabulador {
  return proximo && new Date(proximo.vigenteDesde) <= ocurridoEn ? proximo : t;
}

export function tarifaCompleta(linea: Pick<Linea, "tipo">, tramo: Tramo, tab: Tabulador): number {
  if (tramo.tarifaManual != null) return tramo.tarifaManual;
  if (linea.tipo === "urbana") return tab.urbanoMinimo;
  const rangos = [...tab.suburbano].sort((a, b) => a.hastaKm - b.hastaKm);
  const rango = rangos.find((r) => tramo.km <= r.hastaKm) ?? rangos[rangos.length - 1];
  return rango.monto;
}

export function calcularMonto(p: {
  linea: Pick<Linea, "tipo">;
  tramo: Tramo;
  tabulador: Tabulador;
  categoria: Categoria;
  ocurridoEn: Date;
  feriados: string[];
}): number {
  const recargo = esDomingoOFeriado(p.ocurridoEn, p.feriados) ? p.tabulador.recargoDomingoFeriado : 0;
  const base = tarifaCompleta(p.linea, p.tramo, p.tabulador);
  return Math.round(base * (1 + recargo) * (1 - p.tabulador.descuentos[p.categoria]));
}
