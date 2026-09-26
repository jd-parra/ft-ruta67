import type { EstadoCobro, FilaCobro, ResultadoSync } from "../types/cobros";
import type { CobroLocal } from "../types/paquete";

export interface DepsSubida {
  pendientes: () => Promise<FilaCobro[]>;
  subir: (cobros: CobroLocal[]) => Promise<ResultadoSync[]>;
  marcar: (bid: string, estado: EstadoCobro, extra: { codigo?: string; nombre?: string }) => Promise<void>;
}

/**
 * Sube los cobros pendientes (fase 1: normalmente uno, el del toque que acaba de pasar).
 * Idempotente por bid. Devuelve el resultado por bid, o null si no hubo red: en ese caso
 * todo se queda como `pendiente` en cola_cobros y se reintenta después.
 */
export async function subirPendientes(d: DepsSubida): Promise<Map<string, ResultadoSync> | null> {
  const pendientes = await d.pendientes();
  if (!pendientes.length) return new Map();

  let resultados: ResultadoSync[];
  try {
    resultados = await d.subir(pendientes.map(({ raw, tramoCodigo, monto, metodo, ocurridoEn }) => ({ raw, tramoCodigo, monto, metodo, ocurridoEn })));
  } catch {
    return null;
  }

  const porBid = new Map<string, ResultadoSync>();
  for (const r of resultados) {
    porBid.set(r.bid, r);
    await d.marcar(r.bid, r.estado, { codigo: r.codigo, nombre: r.cobro?.pasajeroNombre });
  }
  return porBid;
}

/** Evita dos subidas simultáneas (toque + reintento): la segunda espera a la primera. */
export function unaALaVez<T>(fn: () => Promise<T>): () => Promise<T> {
  let enCurso: Promise<T> | null = null;
  return () => {
    enCurso ??= fn().finally(() => {
      enCurso = null;
    });
    return enCurso;
  };
}
