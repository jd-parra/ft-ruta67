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
  | "NFC_ERROR";

const MENSAJES_COBRO: Record<Exclude<CodigoCobro, CodigoBoleto>, string> = {
  PASAJERO_SIN_APP: "El pasajero debe abrir la pantalla Pagar",
  SIN_BOLETOS: "El pasajero no tiene boletos. Debe conectarse para obtener más.",
  RESPUESTA_INVALIDA: "Respuesta inesperada del teléfono del pasajero",
  TRAMO_INVALIDO: "El tramo no es de la línea de esta unidad",
  ERROR_LOCAL: "No se pudo guardar el cobro",
  NFC_ERROR: "Se perdió la conexión NFC. Vuelve a acercar el teléfono.",
};

export type ResultadoCobro =
  | {
      ok: true;
      cobro: CobroLocal;
      boleto: Boleto;
      tramo: Tramo;
      categoriaAplicada: Categoria;
      /** false: los teléfonos se separaron antes del RECIBO. El cobro sigue valiendo. */
      reciboEnviado: boolean;
    }
  | { ok: false; codigo: CodigoCobro; mensaje: string };

export interface CobroPersistir {
  bid: string;
  cobro: CobroLocal;
  categoria: Categoria;
}

export interface OpcionesCobro {
  paquete: PaqueteRecolector;
  modo: ModoTramo;
  yaCobrado: ReadonlySet<string>;
  /** Botón "Cobrar como general" cuando el recolector duda de la categoría. */
  cobrarComoGeneral?: boolean;
  ahora?: Date;
  /** Debe guardar en cola_cobros ANTES de enviar el RECIBO: así el bid queda quemado. */
  persistir: (c: CobroPersistir) => Promise<void>;
}

const fallo = (codigo: CodigoCobro): ResultadoCobro => ({
  ok: false,
  codigo,
  mensaje: codigo in MENSAJES ? MENSAJES[codigo as CodigoBoleto] : MENSAJES_COBRO[codigo as keyof typeof MENSAJES_COBRO],
});

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

  // 3. Reglas 1–3 (8.3), sin internet
  const ahora = o.ahora ?? new Date();
  const raw = base64urlDeBytes(ofrecido.boleto);
  const v = validarBoleto(raw, paquete, o.yaCobrado, ahora);
  if (!v.ok) return fallo(v.codigo);

  // 4. Tramo, categoría y monto
  const tramo = elegirTramo(paquete.linea, o.modo, ofrecido.tramoSugerido);
  if (!tramo) return fallo("TRAMO_INVALIDO");
  const categoria: Categoria = o.cobrarComoGeneral ? "general" : v.boleto.categoria;
  const monto = calcularMonto({
    linea: paquete.linea,
    tramo,
    tabulador: tabuladorVigente(paquete.tabulador, paquete.tabuladorProximo, ahora),
    categoria,
    ocurridoEn: ahora,
    feriados: paquete.feriados,
  });

  // Regla 4
  if (!cubreMonto(monto, v.boleto)) return fallo("BOLETO_INSUFICIENTE");

  // 5. Guardar el bid ANTES del RECIBO. `ocurridoEn` se trunca a segundos: es el mismo valor
  //    que viaja en el RECIBO, así el backend puede casar cobro y recibo (6.4).
  const ocurridoSeg = Math.floor(ahora.getTime() / 1000);
  const cobro: CobroLocal = {
    raw,
    tramoCodigo: tramo.codigo,
    monto,
    metodo: "nfc",
    ocurridoEn: new Date(ocurridoSeg * 1000).toISOString(),
  };
  try {
    await o.persistir({ bid: v.boleto.bid, cobro, categoria });
  } catch {
    return fallo("ERROR_LOCAL");
  }

  // 6. RECIBO. Si falla (se separaron) el cobro sigue igual.
  let reciboEnviado = false;
  try {
    const bid = Array.from(bytesDeBase64url(raw).slice(1, 17));
    const rec = parsearRespuesta(await transceive(cmdRecibo(bid, tramo.codigo, monto, ocurridoSeg)));
    reciboEnviado = rec.sw === SW.OK;
  } catch {
    reciboEnviado = false;
  }

  return { ok: true, cobro, boleto: v.boleto, tramo, categoriaAplicada: categoria, reciboEnviado };
}
