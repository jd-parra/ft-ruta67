export type Rol = "pasajero" | "recolector";

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}
