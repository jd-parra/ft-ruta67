import { USE_MOCKS } from "@nucleo/config";
import { marcarRecibosSincronizados, recibosPendientes } from "@nucleo/almacen/recibos";
import { api } from "@nucleo/api/client";
import type { ResultadoSync } from "@nucleo/types/cobros";

// El backend acepta hasta 500 por llamada.
const POR_LLAMADA = 100;

let enCurso: Promise<number> | null = null;

/**
 * POST /sync/recibos (contrato 6.4): sube los recibos del pasajero para que el backend confirme cada cobro
 * (o lo cree, si el recolector aún no lo subió). Cualquier respuesta del backend cuenta como entregado;
 * sin conexión lanza error y quedan para la próxima. Devuelve cuántos se subieron.
 */
export function subirRecibos(): Promise<number> {
  if (USE_MOCKS) return Promise.resolve(0);
  enCurso ??= (async () => {
    let subidos = 0;
    for (;;) {
      const lote = await recibosPendientes(POR_LLAMADA);
      if (!lote.length) return subidos;
      const { data } = await api.post<{ resultados: ResultadoSync[] }>("/sync/recibos", { recibos: lote });
      await marcarRecibosSincronizados(data.resultados.map((r) => r.bid));
      subidos += data.resultados.length;
      // Sin resultados no hubo avance: cortar para no repetir el mismo lote para siempre.
      if (lote.length < POR_LLAMADA || !data.resultados.length) return subidos;
    }
  })().finally(() => {
    enCurso = null;
  });
  return enCurso;
}
