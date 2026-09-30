import { Vibration } from "react-native";
import { requireOptionalNativeModule } from "expo";
import type { AudioPlayer } from "expo-audio";

// Un APK compilado antes de instalar expo-audio no trae el módulo: importarlo lanzaría error.
// Sin él solo se vibra.
const audioDisponible = requireOptionalNativeModule("ExpoAudio") != null;

// Vibración: una corta si cobró; tres si no (se distingue sin mirar la pantalla).
const PATRON_OK = [0, 120];
const PATRON_ERROR = [0, 180, 100, 180, 100, 180];

let reproductores: { ok: AudioPlayer; error: AudioPlayer } | null = null;

function cargarReproductores() {
  if (!audioDisponible) return null;
  if (!reproductores) {
    const { createAudioPlayer } = require("expo-audio") as typeof import("expo-audio");
    reproductores = {
      ok: createAudioPlayer(require("../../assets/sonidos/cobro-ok.wav")),
      error: createAudioPlayer(require("../../assets/sonidos/cobro-error.wav")),
    };
  }
  return reproductores;
}

/** Sonido y vibración tras cada toque en Cobrar, para que el recolector sepa el resultado sin mirar. */
export function avisarCobro(ok: boolean) {
  Vibration.vibrate(ok ? PATRON_OK : PATRON_ERROR);
  try {
    const r = cargarReproductores();
    const sonido = ok ? r?.ok : r?.error;
    if (!sonido) return;
    void sonido.seekTo(0);
    sonido.play();
  } catch {
    // Sin sonido no se pierde el cobro: basta con la vibración y la tarjeta.
  }
}
