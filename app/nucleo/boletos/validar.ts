import type { PaqueteRecolector } from "../types/paquete";
import { bytesDeBase64url, decodificarBoleto, verificarFirma, type Boleto } from "./boleto";

export type CodigoBoleto = "BOLETO_INVALIDO" | "BOLETO_VENCIDO" | "BOLETO_USADO" | "BOLETO_INSUFICIENTE";

export const MENSAJES: Record<CodigoBoleto, string> = {
  BOLETO_INVALIDO: "Boleto inválido",
  BOLETO_VENCIDO: "Boleto vencido",
  BOLETO_USADO: "Este boleto ya fue usado",
  BOLETO_INSUFICIENTE: "El boleto no cubre esta tarifa. El pasajero debe conectarse para renovar sus boletos.",
};

const TOLERANCIA_RELOJ_MS = 10 * 60 * 1000;

export type ResultadoValidacion = { ok: true; boleto: Boleto } | { ok: false; codigo: CodigoBoleto };

/** Reglas 1–3 de 8.3, en orden; la primera que falle gana. La 4 necesita el monto: ver `cubreMonto`. */
export function validarBoleto(
  raw: string,
  paquete: Pick<PaqueteRecolector, "llavePublica" | "revocados">,
  yaCobrado: ReadonlySet<string>,
  ahora: Date
): ResultadoValidacion {
  let bytes: Uint8Array;
  let llave: Uint8Array;
  try {
    bytes = bytesDeBase64url(raw);
    llave = bytesDeBase64url(paquete.llavePublica);
  } catch {
    return { ok: false, codigo: "BOLETO_INVALIDO" };
  }

  // 1. Firma
  const boleto = decodificarBoleto(bytes);
  if (!boleto || !verificarFirma(bytes, llave)) return { ok: false, codigo: "BOLETO_INVALIDO" };

  // 2. Vigencia (con 10 min de tolerancia de reloj)
  if (boleto.expira * 1000 <= ahora.getTime() - TOLERANCIA_RELOJ_MS) return { ok: false, codigo: "BOLETO_VENCIDO" };

  // 3. No revocado ni ya cobrado
  if (paquete.revocados.includes(boleto.bid) || yaCobrado.has(boleto.bid)) return { ok: false, codigo: "BOLETO_USADO" };

  return { ok: true, boleto };
}

/** Regla 4 */
export const cubreMonto = (monto: number, boleto: Boleto) => monto <= boleto.montoReservado;
