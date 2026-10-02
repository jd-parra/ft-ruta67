// Backend real por defecto. Solo con EXPO_PUBLIC_USE_MOCKS=true las pantallas usan datos de prueba:
// un build sin la variable nunca debe mostrar datos inventados.
export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

// Servidor: EXPO_PUBLIC_API_URL=https://api.ejemplo.com (sin /api/v1). Es lo que usa el APK instalable:
// Android bloquea http en las apps de release.
// Desarrollo en la LAN: EXPO_PUBLIC_API_HOST=192.168.1.10:3001 (http).
const BASE = (
  process.env.EXPO_PUBLIC_API_URL ?? `http://${process.env.EXPO_PUBLIC_API_HOST ?? "localhost:3000"}`
).replace(/\/$/, "");

export const API_URL = `${BASE}/api/v1`;
export const SOCKET_URL = BASE;
