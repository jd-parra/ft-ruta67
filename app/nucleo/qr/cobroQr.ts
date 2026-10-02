import { fallo, prepararCobro, type OpcionesCobro, type ResultadoCobro } from "../nfc/ejecutarCobro";

// Contrato §9, «QR (fase 2)»: el pasajero muestra `P2:` + base64url(boleto) + `.` + tramoSugerido
// y el recolector lo escanea. No hay RECIBO: al pasajero le llega el viaje al sincronizar.

const PREFIJO = "P2:";

/** Texto del QR que muestra el pasajero. `tramoSugerido` 0 = sin sugerencia. */
export function textoQr(raw: string, tramoSugerido = 0): string {
  return `${PREFIJO}${raw}.${tramoSugerido}`;
}

/** null si el texto no es un QR de pago de Ruta67. */
export function leerTextoQr(texto: string): { raw: string; tramoSugerido: number } | null {
  if (!texto.startsWith(PREFIJO)) return null;
  const cuerpo = texto.slice(PREFIJO.length);
  const punto = cuerpo.lastIndexOf(".");
  const raw = punto === -1 ? cuerpo : cuerpo.slice(0, punto);
  const tramo = punto === -1 ? 0 : Number(cuerpo.slice(punto + 1));
  if (!/^[A-Za-z0-9_-]+$/.test(raw) || !Number.isInteger(tramo) || tramo < 0) return null;
  return { raw, tramoSugerido: tramo };
}

/** Cobra un QR escaneado con las mismas reglas que un toque NFC (8.3), pero con `metodo: "qr"`. */
export async function ejecutarCobroQr(texto: string, o: OpcionesCobro): Promise<ResultadoCobro> {
  const qr = leerTextoQr(texto);
  if (!qr) return fallo("QR_INVALIDO");

  const p = prepararCobro(qr.raw, qr.tramoSugerido, o);
  if (!p.ok) return p;
  const cobro = { ...p.cobro, metodo: "qr" as const };

  try {
    await o.persistir({ bid: p.boleto.bid, cobro, categoria: p.categoriaAplicada });
  } catch {
    return fallo("ERROR_LOCAL");
  }
  return { ...p, cobro, reciboEnviado: false };
}
