import * as SecureStore from "expo-secure-store";
import { leerBoletos, quitarBoletosPorBid } from "./almacenBoletos";
import { bidDeRaw } from "./boleto";

// Un solo boleto se aparta para pagar por QR (contrato §9). Sale de la lista del NFC para que no se
// pueda entregar dos veces (QR y toque), y se repite en cada QR hasta que el backend lo da por usado:
// así abrir y cerrar el QR sin pagar no gasta boletos.
const KEY = "pasaje.boletoQr";

export async function leerBoletoQr(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

/** El boleto para el QR: el apartado, o el primero de la lista del NFC. null si no hay ninguno. */
export async function apartarBoletoQr(): Promise<string | null> {
  const apartado = await leerBoletoQr();
  if (apartado) return apartado;
  const [primero] = await leerBoletos();
  if (!primero) return null;
  await SecureStore.setItemAsync(KEY, primero);
  await quitarBoletosPorBid([bidDeRaw(primero)]);
  return primero;
}

/**
 * Tras reconciliar con el backend: si el apartado ya no está activo (se cobró, venció o se revocó)
 * se suelta. Devuelve su bid si sigue apartado, para que no vuelva a la lista del NFC.
 */
export async function conciliarBoletoQr(bidsActivos: ReadonlySet<string>): Promise<string | null> {
  const apartado = await leerBoletoQr();
  if (!apartado) return null;
  const bid = bidDeRaw(apartado);
  if (bidsActivos.has(bid)) return bid;
  await SecureStore.deleteItemAsync(KEY);
  return null;
}
