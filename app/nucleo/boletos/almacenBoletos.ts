import * as SecureStore from "expo-secure-store";
import { decodeBase64 } from "tweetnacl-util";

const KEY = "pasaje.boletos";
export const LARGO_BOLETO = 106;

// El boleto viaja en base64url; se guarda tal cual lo emitió el servidor.
export function bytesDeRaw(raw: string): Uint8Array {
  const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  return decodeBase64(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
}

// bid = bytes 1..16 (version:1, bid:16, ...). TODO: reemplazar por @shared/boleto cuando lo suba Juan.
export function bidDeRaw(raw: string): string {
  const b = bytesDeRaw(raw);
  const hex = Array.from(b.slice(1, 17), (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function leerBoletos(): Promise<string[]> {
  const s = await SecureStore.getItemAsync(KEY);
  return s ? (JSON.parse(s) as string[]) : [];
}

async function escribir(boletos: string[]) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(boletos));
}

export async function agregarBoletos(raws: string[]) {
  for (const raw of raws) {
    if (bytesDeRaw(raw).length !== LARGO_BOLETO) throw new Error("Boleto de largo inválido");
  }
  const actuales = await leerBoletos();
  await escribir([...actuales, ...raws.filter((r) => !actuales.includes(r))]);
}

export async function quitarBoletosPorBid(bids: string[]) {
  const actuales = await leerBoletos();
  await escribir(actuales.filter((raw) => !bids.includes(bidDeRaw(raw))));
}
