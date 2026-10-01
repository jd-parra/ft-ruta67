import { Image, StyleSheet, View } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { colors, sombra } from "@nucleo/theme";

/** Logo de Ruta67 + título, para Login y Registro. */
export function EncabezadoMarca({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <View style={styles.contenedor}>
      <Image source={require("../../assets/logo.png")} style={styles.logo} accessibilityLabel="Ruta67" />
      <AppText style={styles.marca}>Ruta67</AppText>
      <AppText variant="titulo" style={styles.centro}>{titulo}</AppText>
      <AppText style={[styles.centro, styles.subtitulo]}>{subtitulo}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { alignItems: "center", gap: 6, marginTop: 24, marginBottom: 8 },
  // El PNG ya trae el fondo morado y las esquinas redondeadas.
  logo: { width: 88, height: 88, transform: [{ rotate: "-6deg" }], ...sombra },
  marca: { color: colors.acento, fontWeight: "800", letterSpacing: 2, textTransform: "uppercase", fontSize: 12, marginTop: 8 },
  centro: { textAlign: "center" },
  subtitulo: { color: colors.textoSuave },
});
