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

// Cobro ya registrado en el backend (sección 5)
export interface Cobro {
  id: string;
  bid: string;
  pasajeroNombre: string;
  categoriaAplicada: Categoria;
  lineaCodigo: number;
  tramoCodigo: number;
  tramoNombre: string;
  unidadCodigo: number;
  monto: number;
  metodo: "nfc" | "qr";
  ocurridoEn: string;
  sincronizadoEn: string;
  confirmadoPor: ("recolector" | "pasajero")[];
  estado: "ok" | "conflicto";
}

// GET /recolector/cobros?desde= (sección 6.3)
export interface CobrosDelDia {
  total: number;
  cantidad: number;
  cobros: Cobro[];
}
