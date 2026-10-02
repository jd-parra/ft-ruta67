// Contrato sección 5 (+ §19: viajesEstimados es null solo con descuento del 100 %).

export interface Aviso {
  id: string;
  tipo: "CAMBIO_TARIFA" | "CATEGORIA_APROBADA" | "CATEGORIA_RECHAZADA" | "CUENTA_BLOQUEADA";
  mensaje: string;
  vigenteDesde?: string;
}

export interface Billetera {
  saldoDisponible: number;
  saldoReservado: number;
  boletosActivos: number;
  tarifaReferencia: number;
  /** De qué gaceta sale la tarifa de referencia (p. ej. "Gaceta Oficial N° 43.xxx"). */
  tarifaFuente: string;
  viajesEstimados: number | null;
  avisos: Aviso[];
}

/** Lo que el pasajero ve como "su saldo": lo libre más lo apartado en boletos (que sigue siendo suyo). */
export const saldoTotal = (b: Billetera) => b.saldoDisponible + b.saldoReservado;

/** Contrato §6.2: boleto emitido por el backend (`raw` es lo que se guarda y se entrega por NFC). */
export interface BoletoEmitido {
  bid: string;
  raw: string;
  montoReservado: number;
  expiraEn: string;
}

export interface Recarga {
  id: string;
  monto: number;
  metodo: "simulada" | "pago_movil";
  estado: "pendiente" | "confirmada" | "rechazada";
  creadoEn: string;
}

export interface Movimiento {
  id: string;
  tipo: "recarga" | "reserva" | "cobro" | "liberacion";
  monto: number;
  saldoDisponibleDespues: number;
  cobroId?: string;
  /** En cobro y su liberación: lo que costó el viaje de verdad y dónde. */
  viaje?: { monto: number; lineaNombre: string; tramoNombre: string; unidadCodigo: number };
  creadoEn: string;
}
