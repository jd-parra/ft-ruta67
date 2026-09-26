import { io, type Socket } from "socket.io-client";
import { SOCKET_URL, USE_MOCKS } from "@nucleo/config";

let socket: Socket | null = null;

export function conectarSocket(token: string): Socket | null {
  if (USE_MOCKS) return null;
  socket ??= io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
  return socket;
}

export function desconectarSocket() {
  socket?.disconnect();
  socket = null;
}
