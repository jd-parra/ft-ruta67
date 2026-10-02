import type { PaqueteRecolector } from "@nucleo/types/paquete";

// Paquete de prueba (datos semilla, sección 13). La llave es la FIJA de desarrollo de
// scripts/devBoleto.ts: `pnpm dev:boleto` genera boletos que este paquete acepta.
export const LLAVE_PUBLICA_DEV = "6kpsY-KcUgq-9VB7Ey7F-ZVHdq6-vnuSQh7qaRRG0iw";

export const PAQUETE_MOCK: PaqueteRecolector = {
  llavePublica: LLAVE_PUBLICA_DEV,
  unidad: { id: "u-102", codigo: 102, placa: "AC456EF", lineaId: "l-3", recolectorId: "mock-04140000006" },
  linea: {
    id: "l-3", codigo: 3, nombre: "Mérida – Ejido", tipo: "suburbana",
    tramos: [
      { id: "t-3-1", codigo: 1, nombre: "Centro – Ejido", km: 9, tarifaCompleta: 28000, frecuencia: 5 },
      { id: "t-3-2", codigo: 2, nombre: "Centro – La Parroquia", km: 6, tarifaCompleta: 28000, frecuencia: 2 },
    ],
  },
  tabulador: {
    id: "tab-1", fuente: "Gaceta Oficial, septiembre 2026 (valores de prueba)", vigenteDesde: "2026-09-01T04:00:00Z",
    descuentos: { general: 0, estudiante: 0.5, exonerado: 0.5 }, recargoDomingoFeriado: 0,
    urbanoMinimo: 20000, suburbano: [{ hastaKm: 10, monto: 28000 }, { hastaKm: 9999, monto: 99000 }],
  },
  tabuladorProximo: null,
  feriados: ["2026-10-12"],
  revocados: [],
  generadoEn: new Date().toISOString(),
};
