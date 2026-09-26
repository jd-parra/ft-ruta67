import Constants from "expo-constants";

// Cambiar a false (o definir EXPO_PUBLIC_USE_MOCKS=false) para hablar con el backend real.
export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS !== "false";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? API_URL;

export const APP_VERSION = Constants.expoConfig?.version ?? "0.0.0";
