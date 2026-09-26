import { anularCobroRemoto, subirCobros } from "@nucleo/api/cobrosApi";
import { bidsCobrados, cobrosPendientes, eliminarCobro, encolarCobro, marcarCobro, obtenerCobro } from "@nucleo/almacen/colaCobros";
import type { OpcionesPreparar } from "@nucleo/nfc/ejecutarCobro";
import { corregirCobro, type Cambios } from "./corregirCobro";
import { subirPendientes, unaALaVez } from "./subirCobros";

/** Sube lo pendiente. Una sola subida a la vez. null = sin red. */
export const sincronizarCobros = (() => {
  let ultima: Promise<unknown> = Promise.resolve();
  const subir = unaALaVez(() =>
    subirPendientes({ pendientes: cobrosPendientes, subir: subirCobros, marcar: marcarCobro })
  );
  return () => {
    const p = subir();
    ultima = p;
    return p;
  };
})();

export const corregir = (bid: string, cambios: Cambios, opciones: Pick<OpcionesPreparar, "paquete">) =>
  corregirCobro(
    {
      obtener: obtenerCobro,
      cobrados: bidsCobrados,
      anular: anularCobroRemoto,
      eliminar: eliminarCobro,
      persistir: encolarCobro,
      esperarSubida: () => sincronizarCobros().catch(() => undefined),
    },
    bid,
    cambios,
    opciones
  );
