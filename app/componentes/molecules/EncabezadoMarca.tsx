import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { colors, radius, sombra } from "@nucleo/theme";

/** Logo de Pasaje + título, para Login y Registro. */
export function EncabezadoMarca({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.logo}>
        <Ionicons name="bus" size={34} color={colors.blanco} />
      </View>
      <AppText style={styles.marca}>Pasaje</AppText>
      <AppText variant="titulo" style={styles.centro}>{titulo}</AppText>
      <AppText style={[styles.centro, styles.subtitulo]}>{subtitulo}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", gap: 6, marginTop: 24, marginBottom: 8 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primario,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-6deg" }],
    ...sombra,
  },
  marca: { color: colors.acento, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", fontSize: 12, marginTop: 8 },
  centro: { textAlign: "center" },
  subtitulo: { color: colors.textoSuave },
});
