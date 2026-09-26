import { Text, type TextProps, StyleSheet } from "react-native";
import { colors } from "@nucleo/theme";

type Variant = "titulo" | "cuerpo" | "etiqueta";

interface Props extends TextProps {
  variant?: Variant;
}

export function AppText({ variant = "cuerpo", style, ...rest }: Props) {
  return <Text style={[styles.base, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: { color: colors.texto },
  titulo: { fontSize: 24, fontWeight: "700", color: colors.primarioOscuro },
  cuerpo: { fontSize: 15 },
  etiqueta: { fontSize: 12, opacity: 0.7 },
});
