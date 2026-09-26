import type { Categoria } from "./auth";

// Contrato sección 5
export interface Tabulador {
  id: string;
  fuente: string;
  vigenteDesde: string;
  descuentos: Record<Categoria, number>;
  recargoDomingoFeriado: number;
  urbanoMinimo: number; // céntimos
  suburbano: { hastaKm: number; monto: number }[];
}

export interface Tramo {
  id: string;
  codigo: number;
  nombre: string;
  km: number;
  tarifaCompleta: number;
  tarifaManual?: number;
  frecuencia: number;
}

export interface Linea {
  id: string;
  codigo: number;
  nombre: string;
  tipo: "urbana" | "suburbana";
  tramos: Tramo[];
}

export interface Unidad {
  id: string;
  codigo: number;
  placa: string;
  lineaId: string;
  recolectorId: string | null;
}

// GET /recolector/paquete (sección 6.3)
export interface PaqueteRecolector {
  llavePublica: string; // base64url Ed25519
  unidad: Unidad;
  linea: Linea; // tramos ordenados por frecuencia
  tabulador: Tabulador;
  tabuladorProximo: Tabulador | null;
  feriados: string[]; // "2026-10-12"
  revocados: string[]; // bid
  generadoEn: string;
}

export interface CobroLocal {
  raw: string;
  tramoCodigo: number;
  monto: number;
  metodo: "nfc" | "qr";
  ocurridoEn: string;
}
