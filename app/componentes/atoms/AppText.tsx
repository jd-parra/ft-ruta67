import { Text, type TextProps, StyleSheet } from "react-native";
import { colors } from "@nucleo/theme";

type Variant = "titulo" | "subtitulo" | "cuerpo" | "etiqueta" | "cifra";

interface Props extends TextProps {
  variant?: Variant;
}

export function AppText({ variant = "cuerpo", style, ...rest }: Props) {
  return <Text style={[styles.base, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: { color: colors.texto },
  titulo: { fontSize: 24, fontWeight: "700", color: colors.primarioOscuro },
  subtitulo: { fontSize: 17, fontWeight: "600" },
  cuerpo: { fontSize: 15 },
  etiqueta: { fontSize: 12, opacity: 0.7 },
  cifra: { fontSize: 34, fontWeight: "800", letterSpacing: -0.5 },
});
