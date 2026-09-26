import { Pressable, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { colors, radius } from "@nucleo/theme";

interface Props {
  texto: string;
  activo: boolean;
  onPress: () => void;
}

/** Pastilla seleccionable (montos rápidos, filtros). */
export function Chip({ texto, activo, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, activo && styles.activo, pressed && !activo && styles.pressed]}>
      <AppText style={[styles.texto, { color: activo ? colors.blanco : colors.primarioOscuro }]}>{texto}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.primarioClaro },
  activo: { backgroundColor: colors.primario },
  pressed: { backgroundColor: colors.borde },
  texto: { fontWeight: "600" },
});
