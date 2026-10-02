import type { Movimiento } from "../types/billetera";

// El libro del backend tiene 4 tipos (§19): recarga, reserva (boletos), cobro (monto 0) y liberación.
// Al pasajero solo le importa lo que cambia su saldo total (libre + apartado): las recargas y lo que
// costó cada viaje. Apartar boletos y devolver lo que sobró es contabilidad interna y confunde.

export type MovimientoVisible =
  | { tipo: "recarga"; id: string; monto: number; fecha: string }
  | {
      tipo: "viaje";
      id: string;
      /** null si el backend aún no manda el detalle: se sabe que pagó con boleto, no cuánto. */
      monto: number | null;
      lineaNombre: string | null;
      tramoNombre: string | null;
      unidadCodigo: number | null;
      fecha: string;
    };

export function movimientosVisibles(movimientos: Movimiento[]): MovimientoVisible[] {
  const out: MovimientoVisible[] = [];
  for (const m of movimientos) {
    if (m.tipo === "recarga") out.push({ tipo: "recarga", id: m.id, monto: m.monto, fecha: m.creadoEn });
    if (m.tipo === "cobro") {
      out.push({
        tipo: "viaje",
        id: m.id,
        monto: m.viaje?.monto ?? null,
        lineaNombre: m.viaje?.lineaNombre ?? null,
        tramoNombre: m.viaje?.tramoNombre ?? null,
        unidadCodigo: m.viaje?.unidadCodigo ?? null,
        fecha: m.creadoEn,
      });
    }
  }
  return out;
}
