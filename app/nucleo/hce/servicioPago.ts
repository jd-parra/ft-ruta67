import { PasajeHce } from "./PasajeHce";
import { bidDeRaw, leerBoletos, quitarBoletosPorBid } from "@nucleo/boletos/almacenBoletos";
import { aReciboLocal, frecuentesPorLinea, guardarRecibos, type ReciboLocal } from "@nucleo/almacen/recibos";

export const hceSoportado = () => PasajeHce?.soportado() ?? false;

// Serializa los drenajes: el evento nativo y el cierre de pantalla pueden coincidir.
let cola: Promise<unknown> = Promise.resolve();

/** Pasa los recibos que dejó el servicio nativo a SQLite y borra esos boletos del almacén seguro. */
export function sincronizarRecibos(): Promise<ReciboLocal[]> {
  const tarea = cola.then(async () => {
    if (!PasajeHce) return [];
    const recibos = PasajeHce.drenarRecibos().map(aReciboLocal);
    if (recibos.length) {
      await guardarRecibos(recibos);
      await quitarBoletosPorBid(recibos.map((r) => r.bid));
    }
    return recibos;
  });
  cola = tarea.catch(() => undefined);
  return tarea;
}

export async function boletosRestantes() {
  return (await leerBoletos()).length;
}

/**
 * Empieza a responder al lector. Solo debe estar activo con la pantalla Pagar abierta.
 * Devuelve la función que detiene todo.
 */
export async function iniciarPago(alRecibir: (r: ReciboLocal[]) => void): Promise<() => Promise<void>> {
  const hce = PasajeHce;
  if (!hce) throw new Error("Módulo NFC no disponible: hace falta el dev build");

  // Recibos de una sesión anterior que no se alcanzaron a drenar.
  await sincronizarRecibos();

  const boletos = await leerBoletos();
  hce.setBoletos(boletos);
  hce.setFrecuentes(await frecuentesPorLinea());
  hce.setActivo(true);

  const sub = hce.addListener("onRecibo", () => {
    void sincronizarRecibos().then((r) => r.length && alRecibir(r));
  });

  return async () => {
    sub.remove();
    hce.setActivo(false);
    const r = await sincronizarRecibos();
    if (r.length) alRecibir(r);
  };
}

export { bidDeRaw };
