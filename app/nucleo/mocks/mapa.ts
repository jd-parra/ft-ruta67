import type { UnidadMapa } from "@nucleo/types/mapa";

// Unidades de prueba alrededor del centro de Mérida (datos semilla, sección 13).
export function unidadesMapaMock(): UnidadMapa[] {
  const ahora = new Date().toISOString();
  return [
    { unidadCodigo: 101, placa: "AB123CD", lineaNombre: "Chorros de Milla", lat: 8.6035, lng: -71.1437, actualizadoEn: ahora },
    { unidadCodigo: 102, placa: "AC456EF", lineaNombre: "Mérida – Ejido", lat: 8.5752, lng: -71.1714, actualizadoEn: ahora },
  ];
}
