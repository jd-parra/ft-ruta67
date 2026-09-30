import { USE_MOCKS } from "@nucleo/config";
import { bidsConRecibo } from "@nucleo/almacen/recibos";
import { emitirBoletos, listarBoletosActivos } from "@nucleo/api/pasajeroApi";
import type { ErrorApi } from "@nucleo/types/auth";
import { leerBoletos, reemplazarBoletos } from "./almacenBoletos";

// Serializa las renovaciones: el foco de la pantalla puede dispararlas seguidas.
let enCurso: Promise<number> | null = null;

const esSaldoInsuficiente = (e: unknown) =>
  (e as { response?: { data?: ErrorApi } }).response?.data?.error?.codigo === "SALDO_INSUFICIENTE";

/**
 * Pide boletos hasta completar 5 (contrato §6.2) y deja en el teléfono exactamente los activos del backend:
 * los usados, vencidos o revocados se borran y los que falten (p. ej. tras reinstalar) se recuperan.
 * Los que ya se entregaron por NFC no vuelven aunque el recolector aún no haya subido el cobro (doble gasto §8.4).
 * Sin conexión lanza error y lo guardado queda intacto. Devuelve cuántos boletos quedan.
 */
export function renovarBoletos(): Promise<number> {
  if (USE_MOCKS) return leerBoletos().then((b) => b.length);
  enCurso ??= (async () => {
    try {
      await emitirBoletos();
    } catch (e) {
      // Sin saldo para uno más: igual se reconcilian los que ya tiene.
      if (!esSaldoInsuficiente(e)) throw e;
    }
    const [activos, usados] = await Promise.all([listarBoletosActivos(), bidsConRecibo()]);
    const vigentes = activos.filter((b) => !usados.has(b.bid)).map((b) => b.raw);
    await reemplazarBoletos(vigentes);
    return vigentes.length;
  })().finally(() => {
    enCurso = null;
  });
  return enCurso;
}
