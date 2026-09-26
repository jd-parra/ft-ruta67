import type { Categoria } from "./auth";
import type { CobroLocal } from "./paquete";

// pendiente = aún no se sube; el resto son los estados de POST /sync/cobros (6.3)
export type EstadoCobro = "pendiente" | "ok" | "duplicado" | "conflicto" | "rechazado";

export interface FilaCobro extends CobroLocal {
  bid: string;
  categoria: Categoria;
  estado: EstadoCobro;
  codigo: string | null;
  pasajeroNombre: string | null;
}

export interface ResultadoSync {
  bid: string;
  estado: Exclude<EstadoCobro, "pendiente">;
  codigo?: string;
  cobro?: { pasajeroNombre: string };
}
