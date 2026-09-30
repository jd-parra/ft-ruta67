import { USE_MOCKS } from "@nucleo/config";
import { leerPaquete, guardarPaquete } from "@nucleo/almacen/paquete";
import { PAQUETE_MOCK } from "@nucleo/mocks/paquete";
import { cobrosDeHoyMock } from "@nucleo/mocks/recolector";
import { rangoDelDia } from "@nucleo/tarifas/zonaHoraria";
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

/** GET /recolector/cobros?desde=&hasta= : los cobros ya subidos de un día (hora de Mérida). */
export async function cobrosDelDia(dia: Date): Promise<CobrosDelDia> {
  if (USE_MOCKS) return cobrosDeHoyMock();
  return (await api.get<CobrosDelDia>("/recolector/cobros", { params: rangoDelDia(dia) })).data;
}

/** POST /ubicaciones (cada 30 s mientras está «En turno»). */
export async function enviarUbicacion(lat: number, lng: number): Promise<void> {
  if (USE_MOCKS) return;
  await api.post("/ubicaciones", { lat, lng });
}
