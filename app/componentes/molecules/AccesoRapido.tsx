import { Pressable, StyleSheet } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { IconoCirculo } from "@componentes/atoms/IconoCirculo";
import { colors, radius, sombra } from "@nucleo/theme";

interface Props {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  onPress: () => void;
}

/** Botón cuadrado con icono para las acciones principales del Inicio. */
export function AccesoRapido({ icono, texto, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.caja, pressed && styles.pressed]} accessibilityRole="button">
      <IconoCirculo nombre={icono} tamano={44} />
      <AppText style={styles.texto}>{texto}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  caja: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.blanco,
    ...sombra,
  },
  pressed: { backgroundColor: colors.primarioClaro },
  texto: { fontWeight: "600", fontSize: 13, color: colors.primarioOscuro },
});
