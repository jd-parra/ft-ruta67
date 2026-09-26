import nacl from "tweetnacl";
import { decodeBase64 } from "tweetnacl-util";
import type { Categoria } from "../types/auth";

// Formato de 106 bytes (contrato 8.1). Cuando Juan suba /shared/boleto.js, esto se reemplaza por ese módulo.
export const LARGO_BOLETO = 106;
const LARGO_FIRMADO = 42;
const CATEGORIAS: Categoria[] = ["general", "estudiante", "exonerado"];

export interface Boleto {
  version: number;
  bid: string; // UUID
  uid: string; // UUID del pasajero
  categoria: Categoria;
  montoReservado: number; // céntimos
  expira: number; // segundos Unix
}

export function bytesDeBase64url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return decodeBase64(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
}

const hex = (b: Uint8Array) => Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
export function uuidDeBytes(b: Uint8Array): string {
  const h = hex(b);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function bidDeRaw(raw: string): string {
  return uuidDeBytes(bytesDeBase64url(raw).slice(1, 17));
}

/** null si el largo, la versión o la categoría no son válidos. No verifica la firma. */
export function decodificarBoleto(bytes: Uint8Array): Boleto | null {
  if (bytes.length !== LARGO_BOLETO || bytes[0] !== 0x01) return null;
  const categoria = CATEGORIAS[bytes[33]];
  if (!categoria) return null;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    version: bytes[0],
    bid: uuidDeBytes(bytes.slice(1, 17)),
    uid: uuidDeBytes(bytes.slice(17, 33)),
    categoria,
    montoReservado: dv.getUint32(34, false),
    expira: dv.getUint32(38, false),
  };
}

/** Ed25519 del servidor sobre los 42 bytes anteriores a la firma. */
export function verificarFirma(bytes: Uint8Array, llavePublica: Uint8Array): boolean {
  if (bytes.length !== LARGO_BOLETO || llavePublica.length !== 32) return false;
  return nacl.sign.detached.verify(bytes.slice(0, LARGO_FIRMADO), bytes.slice(LARGO_FIRMADO), llavePublica);
}

export function base64urlDeBytes(b: ArrayLike<number>): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
