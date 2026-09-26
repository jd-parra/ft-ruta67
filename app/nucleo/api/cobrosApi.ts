import { USE_MOCKS } from "@nucleo/config";
import type { ErrorApi } from "@nucleo/types/auth";
import type { ResultadoSync } from "@nucleo/types/cobros";
import type { CobroLocal } from "@nucleo/types/paquete";
import { bidDeRaw } from "@nucleo/boletos/boleto";
import { api } from "./client";

/** POST /sync/cobros. Lanza si no hay red (el cobro queda pendiente en cola_cobros). */
export async function subirCobros(cobros: CobroLocal[]): Promise<ResultadoSync[]> {
  if (USE_MOCKS) {
    return cobros.map((c) => ({ bid: bidDeRaw(c.raw), estado: "ok", cobro: { pasajeroNombre: "Ana Pasajera (mock)" } }));
  }
  const { data } = await api.post<{ resultados: ResultadoSync[] }>("/sync/cobros", { cobros });
  return data.resultados;
}

/** DELETE /sync/cobros/:bid (solo cobros propios de hace menos de 2 min). Lanza con el mensaje del backend. */
export async function anularCobroRemoto(bid: string): Promise<void> {
  if (USE_MOCKS) return;
  try {
    await api.delete(`/sync/cobros/${bid}`);
  } catch (e) {
    const err = (e as { response?: { data?: ErrorApi } }).response?.data?.error;
    throw new Error(err?.mensaje ?? "Sin conexión: no se puede corregir un cobro ya subido");
  }
}
