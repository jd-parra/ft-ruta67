import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { IconoCirculo } from "@componentes/atoms/IconoCirculo";
import { colors } from "@nucleo/theme";

interface Props {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  mensaje: string;
  /** Acción opcional debajo del mensaje (p. ej. «Reintentar»). */
  children?: ReactNode;
}

/** Lista sin datos o sin conexión: icono grande, título y explicación. */
export function EstadoVacio({ icono, titulo, mensaje, children }: Props) {
  return (
    <View style={styles.vacio}>
      <IconoCirculo nombre={icono} tamano={64} />
      <AppText variant="subtitulo">{titulo}</AppText>
      <AppText style={styles.mensaje}>{mensaje}</AppText>
      {children}
    </View>
  );
}

export function EstadoCargando() {
  return (
    <View style={styles.vacio}>
      <ActivityIndicator color={colors.primario} />
    </View>
  );
}

const styles = StyleSheet.create({
  vacio: { alignItems: "center", gap: 10, paddingVertical: 48, paddingHorizontal: 24 },
  mensaje: { textAlign: "center", color: colors.textoSuave },
});
