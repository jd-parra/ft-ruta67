import * as SecureStore from "expo-secure-store";
import type { Sesion } from "@nucleo/types/auth";

const KEY = "ruta67.sesion";

export async function guardarSesion(sesion: Sesion) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(sesion));
}

export async function leerSesion(): Promise<Sesion | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  return raw ? (JSON.parse(raw) as Sesion) : null;
}

export async function borrarSesion() {
  await SecureStore.deleteItemAsync(KEY);
}
