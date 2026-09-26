// Protocolo NFC v2 (contrato sección 9), lado lector. Sin dependencias de React Native.

export const AID = [0xf0, 0x50, 0x41, 0x53, 0x45, 0x00, 0x02];
export const LARGO_BOLETO = 106;

const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const u32 = (n: number) => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];

export const cmdSelect = () => [0x00, 0xa4, 0x04, 0x00, AID.length, ...AID, 0x00];

export const cmdPedirBoleto = (lineaCodigo: number, unidadCodigo: number) => [
  0x80, 0x10, 0x00, 0x00, 0x04, ...u16(lineaCodigo), ...u16(unidadCodigo),
];

/** bid: 16 bytes; ocurridoSeg: uint32 en segundos Unix. */
export const cmdRecibo = (bid: number[], tramoCodigo: number, monto: number, ocurridoSeg: number) => {
  if (bid.length !== 16) throw new Error("bid debe tener 16 bytes");
  return [0x80, 0x20, 0x00, 0x00, 0x1a, ...bid, ...u16(tramoCodigo), ...u32(monto), ...u32(ocurridoSeg)];
};

export interface Respuesta {
  datos: number[];
  sw: number; // SW1SW2
}

export function parsearRespuesta(r: number[]): Respuesta {
  if (r.length < 2) throw new Error("Respuesta APDU truncada");
  return { datos: r.slice(0, -2), sw: (r[r.length - 2] << 8) | r[r.length - 1] };
}

export const SW = { OK: 0x9000, SIN_BOLETOS: 0x6a82, DESCONOCIDO: 0x6d00 } as const;

/** Respuesta de PEDIR_BOLETO: [boleto:106][tramoSugerido:2] */
export function parsearBoletoOfrecido(datos: number[]): { boleto: number[]; tramoSugerido: number } | null {
  if (datos.length !== LARGO_BOLETO + 2) return null;
  return { boleto: datos.slice(0, LARGO_BOLETO), tramoSugerido: (datos[LARGO_BOLETO] << 8) | datos[LARGO_BOLETO + 1] };
}
