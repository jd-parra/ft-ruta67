import { USE_MOCKS } from "@nucleo/config";
import { leerPaquete, guardarPaquete } from "@nucleo/almacen/paquete";
import { PAQUETE_MOCK } from "@nucleo/mocks/paquete";
import type { PaqueteRecolector } from "@nucleo/types/paquete";
import { api } from "./client";

/** Pide el paquete y lo guarda. Sin conexión devuelve el último guardado: cobrar no depende de internet. */
export async function obtenerPaquete(): Promise<{ paquete: PaqueteRecolector | null; desactualizado: boolean }> {
  try {
    const paquete = USE_MOCKS ? { ...PAQUETE_MOCK, generadoEn: new Date().toISOString() } : (await api.get<PaqueteRecolector>("/recolector/paquete")).data;
    await guardarPaquete(paquete);
    return { paquete, desactualizado: false };
  } catch {
    return { paquete: await leerPaquete(), desactualizado: true };
  }
}
