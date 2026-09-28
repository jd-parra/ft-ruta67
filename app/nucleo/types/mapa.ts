// GET /mapa/unidades (sección 6.6): unidades con ubicación de los últimos 5 min
export interface UnidadMapa {
  unidadCodigo: number;
  placa: string;
  lineaNombre: string;
  lat: number;
  lng: number;
  actualizadoEn: string;
}

// Evento «unidad:ubicacion» (sección 11)
export interface UbicacionUnidad {
  unidadCodigo: number;
  lat: number;
  lng: number;
}
