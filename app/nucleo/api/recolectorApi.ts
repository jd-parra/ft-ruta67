import { USE_MOCKS } from "@nucleo/config";
import { leerPaquete, guardarPaquete } from "@nucleo/almacen/paquete";
import { PAQUETE_MOCK } from "@nucleo/mocks/paquete";
import { cobrosDeHoyMock } from "@nucleo/mocks/recolector";
import { inicioDelDia } from "@nucleo/tarifas/zonaHoraria";
import type { CobrosDelDia } from "@nucleo/types/cobros";
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

/** GET /recolector/cobros?desde= con el inicio del día en hora de Mérida. Solo lo ya subido. */
export async function cobrosDeHoy(): Promise<CobrosDelDia> {
  if (USE_MOCKS) return cobrosDeHoyMock();
  return (await api.get<CobrosDelDia>("/recolector/cobros", { params: { desde: inicioDelDia(new Date()) } })).data;
}

/** POST /ubicaciones (cada 30 s mientras está «En turno»). */
export async function enviarUbicacion(lat: number, lng: number): Promise<void> {
  if (USE_MOCKS) return;
  await api.post("/ubicaciones", { lat, lng });
}
