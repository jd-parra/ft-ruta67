import { USE_MOCKS } from "@nucleo/config";
import { listarRecibos, type ReciboLocal } from "@nucleo/almacen/recibos";
import { billeteraMock, LINEAS_MOCK, movimientosMock, recargarMock, VIAJES_MOCK } from "@nucleo/mocks/pasajero";
import type { Categoria } from "@nucleo/types/auth";
import type { Billetera, BoletoEmitido, Movimiento, Recarga } from "@nucleo/types/billetera";
import type { Linea } from "@nucleo/types/paquete";
import { api } from "./client";

// La categoría solo la usan los mocks (el backend la saca del token).

/** GET /billetera */
export async function obtenerBilletera(categoria: Categoria): Promise<Billetera> {
  if (USE_MOCKS) return billeteraMock(categoria);
  return (await api.get<Billetera>("/billetera")).data;
}

/** POST /recargas (fase 1: solo "simulada", se confirma al instante). `monto` en céntimos. */
export async function recargar(monto: number, categoria: Categoria): Promise<{ recarga: Recarga; billetera: Billetera }> {
  if (USE_MOCKS) return recargarMock(monto, categoria);
  return (await api.post<{ recarga: Recarga; billetera: Billetera }>("/recargas", { monto, metodo: "simulada" })).data;
}

/** POST /boletos: emite hasta completar 5 activos, según alcance el saldo. Devuelve solo los nuevos. */
export async function emitirBoletos(): Promise<{ boletos: BoletoEmitido[]; billetera: Billetera }> {
  return (await api.post<{ boletos: BoletoEmitido[]; billetera: Billetera }>("/boletos", {})).data;
}

/** GET /boletos: los activos del pasajero, para reconciliar lo guardado en el teléfono. */
export async function listarBoletosActivos(): Promise<BoletoEmitido[]> {
  return (await api.get<BoletoEmitido[]>("/boletos")).data;
}

/** GET /movimientos?limite= */
export async function listarMovimientos(limite = 20): Promise<Movimiento[]> {
  if (USE_MOCKS) return movimientosMock(limite);
  return (await api.get<Movimiento[]>("/movimientos", { params: { limite } })).data;
}

/** GET /lineas: para mostrar el nombre de la línea y del tramo en el historial. */
export async function obtenerLineas(): Promise<Linea[]> {
  if (USE_MOCKS) return LINEAS_MOCK;
  return (await api.get<Linea[]>("/lineas")).data;
}

/** Viajes = recibos locales (paso 3 NFC). En mocks, si aún no hay ninguno, muestra unos de ejemplo. */
export async function listarViajes(limite = 50): Promise<ReciboLocal[]> {
  const recibos = await listarRecibos(limite);
  return USE_MOCKS && recibos.length === 0 ? VIAJES_MOCK : recibos;
}

