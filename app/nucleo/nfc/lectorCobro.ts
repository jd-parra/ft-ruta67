import NfcManager, { NfcAdapter, NfcTech } from "react-native-nfc-manager";
import { bidsCobrados, encolarCobro } from "@nucleo/almacen/colaCobros";
import { ejecutarCobro, fallo, type OpcionesPreparar, type ResultadoCobro } from "./ejecutarCobro";

let iniciado = false;

/** true si el teléfono tiene NFC y está encendido. */
export async function nfcListo(): Promise<boolean> {
  if (!(await NfcManager.isSupported())) return false;
  if (!iniciado) {
    await NfcManager.start();
    iniciado = true;
  }
  return NfcManager.isEnabled();
}

export type OpcionesLectura = Omit<OpcionesPreparar, "yaCobrado" | "ahora">;

/**
 * Espera un toque (reader mode, IsoDep) y ejecuta el cobro. Se cancela con `cancelarLectura()`.
 * Las opciones se piden DESPUÉS del toque: si el recolector cambia el selector mientras el
 * lector espera, se usa el valor actual.
 */
export async function leerCobro(opciones: () => OpcionesLectura): Promise<ResultadoCobro> {
  try {
    await NfcManager.requestTechnology(NfcTech.IsoDep, {
      isReaderModeEnabled: true,
      readerModeFlags: NfcAdapter.FLAG_READER_NFC_A | NfcAdapter.FLAG_READER_NFC_B | NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
    });
  } catch {
    // Cancelado (pantalla cerrada / app en segundo plano) o NFC no disponible: no hubo toque.
    return fallo("NFC_CANCELADO");
  }

  try {
    return await ejecutarCobro((apdu) => NfcManager.isoDepHandler.transceive(apdu), {
      ...opciones(),
      yaCobrado: await bidsCobrados(),
      persistir: encolarCobro,
    });
  } catch {
    return fallo("NFC_ERROR");
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

export async function cancelarLectura() {
  await NfcManager.cancelTechnologyRequest().catch(() => undefined);
}
