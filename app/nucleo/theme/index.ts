// Paleta morada (contrato sección 15)
export const colors = {
  primario: "#6D28D9",
  primarioOscuro: "#4C1D95",
  primarioClaro: "#EDE9FE",
  acento: "#A78BFA",
  exito: "#16A34A",
  error: "#DC2626",
  fondo: "#FAFAFC",
  texto: "#3A3550", // contrato: #1F1B2E; se aclaró para que no se vea negro puro
  blanco: "#FFFFFF",
  // Neutros para texto secundario y bordes suaves.
  textoSuave: "#6B6880",
  borde: "#E7E3F3",
  exitoClaro: "#DCFCE7",
  errorClaro: "#FEE2E2",
  aviso: "#B45309",
  avisoClaro: "#FEF3C7",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 8, md: 12, lg: 20, pill: 999 };

// Sombra suave para tarjetas (iOS usa shadow*, Android elevation).
export const sombra = {
  shadowColor: "#4C1D95",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
};
