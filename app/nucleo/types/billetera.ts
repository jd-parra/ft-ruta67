// Contrato sección 5 (+ §19: viajesEstimados es null para exonerados).

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
  creadoEn: string;
}
