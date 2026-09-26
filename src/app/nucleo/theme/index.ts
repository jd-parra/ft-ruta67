import type { Precision } from "@nucleo/types/place";

export const colors = {
  bg: "#f7f5f2",
  panel: "#ffffff",
  border: "#e4e0da",
  text: "#2a2622",
  textMuted: "#7a736a",
  accent: "#c1440e",
  accentSoft: "#f3e2d9",
  warn: "#b5892b",
};

export const precisionColor: Record<Precision, string> = {
  plus_code: "#2f7d4f",
  exacta: "#2f7d4f",
  coordenadas_gps: "#2f6fa8",
  aproximada: "#c1440e",
};

export const precisionLabel: Record<Precision, string> = {
  plus_code: "Plus Code decodificado",
  coordenadas_gps: "Coordenadas GPS del PDF",
  aproximada: "Aproximada (calle / centro comercial)",
  exacta: "Exacta",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16 };
export const radius = { sm: 8, pill: 999 };

// Centro aproximado de Ejido, Mérida
export const EJIDO_CENTER = { latitude: 8.5445, longitude: -71.242 };
