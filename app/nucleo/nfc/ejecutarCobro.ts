import { base64urlDeBytes, bytesDeBase64url, type Boleto } from "../boletos/boleto";
import { cubreMonto, MENSAJES, validarBoleto, type CodigoBoleto } from "../boletos/validar";
import { calcularMonto, tabuladorVigente } from "../tarifas/calcularMonto";
import { elegirTramo, type ModoTramo } from "../tarifas/elegirTramo";
import type { Categoria } from "../types/auth";
import type { CobroLocal, PaqueteRecolector, Tramo } from "../types/paquete";
import { cmdPedirBoleto, cmdRecibo, cmdSelect, parsearBoletoOfrecido, parsearRespuesta, SW } from "./apdu";

export type CodigoCobro =
  | CodigoBoleto
  | "PASAJERO_SIN_APP" // no respondió al SELECT: no tiene Pagar abierta
  | "SIN_BOLETOS"
  | "RESPUESTA_INVALIDA"
  | "TRAMO_INVALIDO"
  | "ERROR_LOCAL"
  | "NFC_ERROR"
  | "NFC_CANCELADO"
  | "CORRECCION_FALLIDA";

const MENSAJES_COBRO: Record<Exclude<CodigoCobro, CodigoBoleto>, string> = {
  PASAJERO_SIN_APP: "El pasajero debe abrir la pantalla Pagar",
  SIN_BOLETOS: "El pasajero no tiene boletos. Debe conectarse para obtener más.",
  RESPUESTA_INVALIDA: "Respuesta inesperada del teléfono del pasajero",
  TRAMO_INVALIDO: "La ruta no es de la línea de esta unidad",
  ERROR_LOCAL: "No se pudo guardar el cobro",
  NFC_ERROR: "Se perdió la conexión NFC. Vuelve a acercar el teléfono.",
  NFC_CANCELADO: "Lectura cancelada",
  CORRECCION_FALLIDA: "No se pudo corregir el cobro",
};

export interface Falla {
  ok: false;
  codigo: CodigoCobro;
  mensaje: string;
}

export interface CobroPreparado {
  ok: true;
  cobro: CobroLocal;
  boleto: Boleto;
  tramo: Tramo;
  categoriaAplicada: Categoria;
}

export type ResultadoCobro = (CobroPreparado & {
  /** false: los teléfonos se separaron antes del RECIBO. El cobro sigue valiendo. */
  reciboEnviado: boolean;
}) | Falla;

export interface CobroPersistir {
  bid: string;
  cobro: CobroLocal;
  categoria: Categoria;
}

export interface OpcionesPreparar {
  paquete: PaqueteRecolector;
  modo: ModoTramo;
  yaCobrado: ReadonlySet<string>;
  /** «Cobrar como general»: el recolector duda de la categoría. Solo puede quitar descuento, nunca dar uno. */
  categoriaForzada?: "general";
  ahora?: Date;
}

export interface OpcionesCobro extends OpcionesPreparar {
  /** Debe guardar en cola_cobros ANTES de enviar el RECIBO: así el bid queda quemado. */
  persistir: (c: CobroPersistir) => Promise<void>;
}

export const fallo = (codigo: CodigoCobro, mensaje?: string): Falla => ({
  ok: false,
  codigo,
  mensaje:
    mensaje ?? (codigo in MENSAJES ? MENSAJES[codigo as CodigoBoleto] : MENSAJES_COBRO[codigo as keyof typeof MENSAJES_COBRO]),
});

/**
 * Reglas 1–4 (8.3) + tramo + monto. No toca disco ni NFC: sirve igual para un toque nuevo
 * y para re-cobrar un boleto ya guardado (Corregir).
 */
export function prepararCobro(raw: string, tramoSugerido: number, o: OpcionesPreparar): CobroPreparado | Falla {
  const { paquete } = o;
  const ahora = o.ahora ?? new Date();

  const v = validarBoleto(raw, paquete, o.yaCobrado, ahora);
  if (!v.ok) return fallo(v.codigo);

  const tramo = elegirTramo(paquete.linea, o.modo, tramoSugerido);
  if (!tramo) return fallo("TRAMO_INVALIDO");

  const categoria: Categoria = o.categoriaForzada ?? v.boleto.categoria;
  const monto = calcularMonto({
    linea: paquete.linea,
    tramo,
    tabulador: tabuladorVigente(paquete.tabulador, paquete.tabuladorProximo, ahora),
    categoria,
    ocurridoEn: ahora,
    feriados: paquete.feriados,
  });
  if (!cubreMonto(monto, v.boleto)) return fallo("BOLETO_INSUFICIENTE");

  // `ocurridoEn` truncado a segundos: es el mismo valor que viaja en el RECIBO, así el
  // backend puede casar cobro y recibo (6.4).
  const seg = Math.floor(ahora.getTime() / 1000);
  return {
    ok: true,
    boleto: v.boleto,
    tramo,
    categoriaAplicada: categoria,
    cobro: { raw, tramoCodigo: tramo.codigo, monto, metodo: "nfc", ocurridoEn: new Date(seg * 1000).toISOString() },
  };
}

/** Un toque completo (contrato 8.3 y 9). `transceive` envía un APDU y devuelve la respuesta. */
export async function ejecutarCobro(
  transceive: (apdu: number[]) => Promise<number[]>,
  o: OpcionesCobro
): Promise<ResultadoCobro> {
  const { paquete } = o;

  // 1. SELECT
  const sel = parsearRespuesta(await transceive(cmdSelect()));
  if (sel.sw !== SW.OK) return fallo("PASAJERO_SIN_APP");

  // 2. PEDIR_BOLETO con línea y unidad del paquete
  const ped = parsearRespuesta(await transceive(cmdPedirBoleto(paquete.linea.codigo, paquete.unidad.codigo)));
  if (ped.sw === SW.SIN_BOLETOS) return fallo("SIN_BOLETOS");
  if (ped.sw !== SW.OK) return fallo("RESPUESTA_INVALIDA");
  const ofrecido = parsearBoletoOfrecido(ped.datos);
  if (!ofrecido) return fallo("RESPUESTA_INVALIDA");

  // 3. Reglas, tramo y monto
  const raw = base64urlDeBytes(ofrecido.boleto);
  const p = prepararCobro(raw, ofrecido.tramoSugerido, o);
  if (!p.ok) return p;

  // 4. Guardar el bid ANTES del RECIBO
  try {
    await o.persistir({ bid: p.boleto.bid, cobro: p.cobro, categoria: p.categoriaAplicada });
  } catch {
    return fallo("ERROR_LOCAL");
  }

  // 5. RECIBO. Si falla (se separaron) el cobro sigue igual.
  let reciboEnviado = false;
  try {
    const bid = Array.from(bytesDeBase64url(raw).slice(1, 17));
    const seg = Math.floor(new Date(p.cobro.ocurridoEn).getTime() / 1000);
    const rec = parsearRespuesta(await transceive(cmdRecibo(bid, p.tramo.codigo, p.cobro.monto, seg)));
    reciboEnviado = rec.sw === SW.OK;
  } catch {
    reciboEnviado = false;
  }

  return { ...p, reciboEnviado };
}
