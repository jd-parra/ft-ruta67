import { USE_MOCKS } from "@nucleo/config";
import { unidadesMapaMock } from "@nucleo/mocks/mapa";
import type { UnidadMapa } from "@nucleo/types/mapa";
import { api } from "./client";

/** GET /mapa/unidades: las que enviaron ubicación en los últimos 5 minutos. */
export async function obtenerUnidadesMapa(): Promise<UnidadMapa[]> {
  if (USE_MOCKS) return unidadesMapaMock();
  return (await api.get<UnidadMapa[]>("/mapa/unidades")).data;
}
