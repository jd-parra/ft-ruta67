import type { ErrorApi } from "@nucleo/types/auth";

/** Mensaje para el usuario a partir de un error de axios (contrato sección 4: `mensaje` se muestra tal cual). */
export function mensajeDeError(e: unknown, porDefecto = "Algo salió mal. Inténtalo de nuevo"): string {
  const err = e as { response?: { data?: ErrorApi }; request?: unknown };
  if (err.response?.data?.error?.mensaje) return err.response.data.error.mensaje;
  if (err.request && !err.response) return "Sin conexión con el servidor";
  return porDefecto;
}
