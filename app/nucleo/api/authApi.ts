import { USE_MOCKS } from "@nucleo/config";
import type { Sesion, Usuario } from "@nucleo/types/auth";
import { api } from "./client";

export interface Credenciales {
  telefono: string;
  clave: string;
}

// Usuarios semilla (contrato sección 13)
const SEMILLA: Pick<Usuario, "telefono" | "nombre" | "rol" | "categoria">[] = [
  { telefono: "04140000001", nombre: "Ana Pasajera", rol: "pasajero", categoria: "estudiante" },
  { telefono: "04140000004", nombre: "Pedro General", rol: "pasajero", categoria: "general" },
  { telefono: "04140000005", nombre: "Rosa Mayor", rol: "pasajero", categoria: "exonerado" },
  { telefono: "04140000002", nombre: "Luis Recolector", rol: "recolector", categoria: "general" },
  { telefono: "04140000006", nombre: "Marta Recolectora", rol: "recolector", categoria: "general" },
  { telefono: "04140000003", nombre: "Central Mérida", rol: "central", categoria: "general" },
];

async function loginMock({ telefono, clave }: Credenciales): Promise<Sesion> {
  const u = SEMILLA.find((s) => s.telefono === telefono);
  if (!u || clave !== "1234") {
    throw { response: { status: 401, data: { error: { codigo: "NO_AUTENTICADO", mensaje: "Teléfono o clave incorrectos" } } } };
  }
  return {
    token: "mock-jwt",
    usuario: { ...u, id: `mock-${u.telefono}`, categoriaVerificada: true, bloqueado: false, creadoEn: new Date().toISOString() },
  };
}

export async function login(cred: Credenciales): Promise<Sesion> {
  if (USE_MOCKS) return loginMock(cred);
  const { data } = await api.post<Sesion>("/auth/login", cred);
  return data;
}
