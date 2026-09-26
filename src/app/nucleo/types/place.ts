export type Precision = "plus_code" | "coordenadas_gps" | "aproximada" | "exacta";

export interface Place {
  nombre: string;
  direccion: string;
  rating: number | null;
  telefono: string | null;
  horario: string | null;
  nota: string | null;
  lat: number;
  lng: number;
  precision: Precision;
}
