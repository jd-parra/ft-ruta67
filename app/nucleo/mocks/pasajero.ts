import type { ReciboLocal } from "@nucleo/almacen/recibos";
import type { Categoria } from "@nucleo/types/auth";
import type { Billetera, Movimiento, Recarga } from "@nucleo/types/billetera";
import type { Linea } from "@nucleo/types/paquete";

// Datos de prueba con la forma de bk-ruta67/mocks (contrato sección 13).
// Viven en memoria: se reinician al recargar la app.

const DESCUENTO: Record<Categoria, number> = { general: 0, estudiante: 0.5, exonerado: 0.5 };
const FUENTE = "Gaceta Oficial, septiembre 2026 (valores de prueba)";
const URBANO_MINIMO = 20000;

export const LINEAS_MOCK: Linea[] = [
  {
    id: "l-1", codigo: 1, nombre: "Chorros de Milla", tipo: "urbana",
    tramos: [
      { id: "t-1-1", codigo: 1, nombre: "Centro – Chorros de Milla", km: 5, tarifaCompleta: 20000, frecuencia: 0 },
      { id: "t-1-2", codigo: 2, nombre: "Centro – Milla", km: 3, tarifaCompleta: 20000, frecuencia: 0 },
    ],
  },
  {
    id: "l-2", codigo: 2, nombre: "San Benito", tipo: "urbana",
    tramos: [{ id: "t-2-1", codigo: 1, nombre: "Centro – San Benito", km: 4, tarifaCompleta: 20000, frecuencia: 0 }],
  },
  {
    id: "l-3", codigo: 3, nombre: "Mérida – Ejido", tipo: "suburbana",
    tramos: [
      { id: "t-3-1", codigo: 1, nombre: "Centro – Ejido", km: 9, tarifaCompleta: 28000, frecuencia: 0 },
      { id: "t-3-2", codigo: 2, nombre: "Centro – La Parroquia", km: 6, tarifaCompleta: 28000, frecuencia: 0 },
    ],
  },
];

const haceMin = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export const VIAJES_MOCK: ReciboLocal[] = [
  { bid: "mock-v1", lineaCodigo: 1, unidadCodigo: 101, tramoCodigo: 1, monto: 10000, ocurridoEn: haceMin(90) },
  { bid: "mock-v2", lineaCodigo: 3, unidadCodigo: 102, tramoCodigo: 1, monto: 14000, ocurridoEn: haceMin(60 * 26) },
  { bid: "mock-v3", lineaCodigo: 1, unidadCodigo: 101, tramoCodigo: 2, monto: 10000, ocurridoEn: haceMin(60 * 50) },
];

const VIAJE_1 = { monto: 10000, lineaNombre: "Chorros de Milla", tramoNombre: "Centro – Chorros de Milla", unidadCodigo: 101 };

let estado: { billetera: Omit<Billetera, "tarifaReferencia" | "tarifaFuente" | "viajesEstimados">; movimientos: Movimiento[] } = {
  billetera: { saldoDisponible: 48000, saldoReservado: 42000, boletosActivos: 3, avisos: [] },
  movimientos: [
    { id: "m-4", tipo: "liberacion", monto: 4000, saldoDisponibleDespues: 48000, cobroId: "c-1", viaje: VIAJE_1, creadoEn: haceMin(90) },
    { id: "m-3", tipo: "cobro", monto: 0, saldoDisponibleDespues: 44000, cobroId: "c-1", viaje: VIAJE_1, creadoEn: haceMin(90) },
    { id: "m-2", tipo: "reserva", monto: -56000, saldoDisponibleDespues: 44000, creadoEn: haceMin(60 * 27) },
    { id: "m-1", tipo: "recarga", monto: 100000, saldoDisponibleDespues: 100000, creadoEn: haceMin(60 * 28) },
  ],
};

let siguienteId = 100;

export function billeteraMock(categoria: Categoria): Billetera {
  const tarifaReferencia = Math.round(URBANO_MINIMO * (1 - DESCUENTO[categoria]));
  const { saldoDisponible, saldoReservado } = estado.billetera;
  return {
    ...estado.billetera,
    tarifaReferencia,
    tarifaFuente: FUENTE,
    viajesEstimados: tarifaReferencia === 0 ? null : Math.floor((saldoDisponible + saldoReservado) / tarifaReferencia),
    avisos:
      categoria === "estudiante"
        ? [{ id: "a-1", tipo: "CATEGORIA_APROBADA", mensaje: "La central verificó tu carnet: ya pagas tarifa de estudiante." }]
        : [],
  };
}

export function recargarMock(monto: number, categoria: Categoria): { recarga: Recarga; billetera: Billetera } {
  const saldoDisponible = estado.billetera.saldoDisponible + monto;
  const creadoEn = new Date().toISOString();
  estado = {
    billetera: { ...estado.billetera, saldoDisponible },
    movimientos: [
      { id: `m-${++siguienteId}`, tipo: "recarga", monto, saldoDisponibleDespues: saldoDisponible, creadoEn },
      ...estado.movimientos,
    ],
  };
  return {
    recarga: { id: `r-${siguienteId}`, monto, metodo: "simulada", estado: "confirmada", creadoEn },
    billetera: billeteraMock(categoria),
  };
}

export const movimientosMock = (limite: number) => estado.movimientos.slice(0, limite);
