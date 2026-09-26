// Mérida: UTC-4 todo el año. El "día" del recolector y el recargo de domingo se deciden en hora local.
export const OFFSET_VE_MS = -4 * 3600 * 1000;

/** Inicio (00:00 local) del día de `ahora`, como ISO UTC. */
export function inicioDelDia(ahora: Date): string {
  const local = new Date(ahora.getTime() + OFFSET_VE_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - OFFSET_VE_MS).toISOString();
}
