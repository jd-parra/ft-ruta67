// Mérida: UTC-4 todo el año. El "día" del recolector y el recargo de domingo se deciden en hora local.
export const OFFSET_VE_MS = -4 * 3600 * 1000;

/** Inicio (00:00 local) del día de `ahora`, como ISO UTC. */
export function inicioDelDia(ahora: Date): string {
  const local = new Date(ahora.getTime() + OFFSET_VE_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET_VE_MS).toISOString();
}

/** Día local completo de `fecha` como rango ISO UTC [desde, hasta) (hasta = 00:00 del día siguiente). */
export function rangoDelDia(fecha: Date): { desde: string; hasta: string } {
  const desde = inicioDelDia(fecha);
  return { desde, hasta: new Date(Date.parse(desde) + 24 * 3600 * 1000).toISOString() };
}
