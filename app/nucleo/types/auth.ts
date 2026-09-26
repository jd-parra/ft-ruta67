export type Rol = "pasajero" | "recolector" | "central";
export type Categoria = "general" | "estudiante" | "exonerado";

export interface Usuario {
  id: string;
  nombre: string;
  telefono: string;
  rol: Rol;
  categoria: Categoria;
  categoriaVerificada: boolean;
  bloqueado: boolean;
  creadoEn: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface ErrorApi {
  error: { codigo: string; mensaje: string; detalle?: unknown };
}
