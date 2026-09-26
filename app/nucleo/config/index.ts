// true = pantallas contra /mocks; EXPO_PUBLIC_USE_MOCKS=false para el backend real.
export const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS !== "false";

// IP local del backend de Juan, ej. EXPO_PUBLIC_API_HOST=192.168.1.10:3000
const HOST = process.env.EXPO_PUBLIC_API_HOST ?? "localhost:3000";

export const API_URL = `http://${HOST}/api/v1`;
export const SOCKET_URL = `http://${HOST}`;
