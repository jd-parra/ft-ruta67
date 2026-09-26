import NfcManager, { NfcAdapter, NfcTech } from "react-native-nfc-manager";
import { bidsCobrados, encolarCobro } from "@nucleo/almacen/colaCobros";
import { ejecutarCobro, type OpcionesCobro, type ResultadoCobro } from "./ejecutarCobro";

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

export type OpcionesLectura = Omit<OpcionesCobro, "yaCobrado" | "persistir">;

/** Espera un toque (reader mode, IsoDep) y ejecuta el cobro. Se cancela con `cancelarLectura()`. */
export async function leerCobro(o: OpcionesLectura): Promise<ResultadoCobro> {
  try {
    await NfcManager.requestTechnology(NfcTech.IsoDep, {
      isReaderModeEnabled: true,
      readerModeFlags: NfcAdapter.FLAG_READER_NFC_A | NfcAdapter.FLAG_READER_NFC_B | NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
    });
    return await ejecutarCobro((apdu) => NfcManager.isoDepHandler.transceive(apdu), {
      ...o,
      yaCobrado: await bidsCobrados(),
      persistir: encolarCobro,
    });
  } catch {
    return { ok: false, codigo: "NFC_ERROR", mensaje: "Se perdió la conexión NFC. Vuelve a acercar el teléfono." };
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

export async function cancelarLectura() {
  await NfcManager.cancelTechnologyRequest().catch(() => undefined);
}
