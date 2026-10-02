import type { Ionicons } from "@expo/vector-icons";
import type { Categoria } from "@nucleo/types/auth";

export const formatearBs = (centimos: number) =>
  `${(centimos / 100).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;

/** "Hoy, 14:05" · "Ayer, 09:30" · "12 sep, 18:20" (hora local del teléfono). */
export function formatearFechaHora(iso: string, ahora = new Date()): string {
  const d = new Date(iso);
  const hora = d.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dias = Math.round((dia(ahora) - dia(d)) / 86_400_000);
  if (dias === 0) return `Hoy, ${hora}`;
  if (dias === 1) return `Ayer, ${hora}`;
  return `${d.toLocaleDateString("es-VE", { day: "numeric", month: "short" })}, ${hora}`;
}

/** "1.500,50" / "1500.5" / "2000" → céntimos. null si no es un número válido. */
export function bsACentimos(texto: string): number | null {
  const limpio = texto.trim().replace(/\s/g, "");
  if (!limpio) return null;
  // Con coma: los puntos son miles (formato venezolano). Sin coma: el punto es decimal.
  const normal = limpio.includes(",") ? limpio.replace(/\./g, "").replace(",", ".") : limpio;
  if (!/^\d+(\.\d{0,2})?$/.test(normal)) return null;
  return Math.round(Number(normal) * 100);
}

export const CATEGORIAS: Record<Categoria, { nombre: string; icono: keyof typeof Ionicons.glyphMap; detalle: string }> = {
  general: { nombre: "General", icono: "person-outline", detalle: "Pasaje completo" },
  estudiante: { nombre: "Estudiante", icono: "school-outline", detalle: "50 % de descuento con carnet" },
  exonerado: { nombre: "Exonerado", icono: "accessibility-outline", detalle: "Adultos mayores y personas con discapacidad · 50 % de descuento" },
};
