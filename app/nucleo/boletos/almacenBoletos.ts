import * as SecureStore from "expo-secure-store";
import { bidDeRaw, bytesDeBase64url, LARGO_BOLETO } from "./boleto";

const KEY = "pasaje.boletos";
export async function leerBoletos(): Promise<string[]> {
  const s = await SecureStore.getItemAsync(KEY);
  return s ? (JSON.parse(s) as string[]) : [];
}

async function escribir(boletos: string[]) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(boletos));
}

export async function agregarBoletos(raws: string[]) {
  for (const raw of raws) {
    if (bytesDeBase64url(raw).length !== LARGO_BOLETO) throw new Error("Boleto de largo inválido");
  }
  const actuales = await leerBoletos();
  await escribir([...actuales, ...raws.filter((r) => !actuales.includes(r))]);
}

export async function quitarBoletosPorBid(bids: string[]) {
  const actuales = await leerBoletos();
  await escribir(actuales.filter((raw) => !bids.includes(bidDeRaw(raw))));
}
