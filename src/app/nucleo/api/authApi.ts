import { USE_MOCKS } from "@nucleo/config";
import type { Rol, Sesion } from "@nucleo/types/auth";
import { api } from "./client";

export interface Credenciales {
  usuario: string;
  password: string;
}

// Mock: un usuario que empiece con "rec" entra como recolector, cualquier otro como pasajero.
async function loginMock({ usuario }: Credenciales): Promise<Sesion> {
  const rol: Rol = usuario.toLowerCase().startsWith("rec") ? "recolector" : "pasajero";
  return {
    token: "mock-jwt",
    usuario: { id: `mock-${rol}`, nombre: usuario || rol, rol },
  };
}

export async function login(cred: Credenciales): Promise<Sesion> {
  if (USE_MOCKS) return loginMock(cred);
  const { data } = await api.post<Sesion>("/auth/login", cred);
  return data;
}
