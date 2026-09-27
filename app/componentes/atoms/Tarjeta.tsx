import { View, StyleSheet, type ViewProps } from "react-native";
import { colors, radius, sombra } from "@nucleo/theme";

/** Contenedor blanco con esquinas redondeadas y sombra suave. */
export function Tarjeta({ style, ...rest }: ViewProps) {
  return <View style={[styles.tarjeta, style]} {...rest} />;
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: colors.blanco, borderRadius: radius.lg, padding: 16, ...sombra },
});
