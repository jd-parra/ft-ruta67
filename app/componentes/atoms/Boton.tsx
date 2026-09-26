import { Pressable, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { colors, radius } from "@nucleo/theme";

interface Props {
  titulo: string;
  onPress: () => void;
  deshabilitado?: boolean;
  secundario?: boolean;
}

export function Boton({ titulo, onPress, deshabilitado, secundario }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      style={({ pressed }) => [
        styles.base,
        secundario && styles.secundario,
        pressed && styles.pressed,
        deshabilitado && styles.deshabilitado,
      ]}
    >
      <AppText style={[styles.texto, secundario && { color: colors.primarioOscuro }]}>{titulo}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.primario, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" },
  secundario: { backgroundColor: colors.primarioClaro },
  pressed: { backgroundColor: colors.primarioOscuro },
  deshabilitado: { opacity: 0.5 },
  texto: { color: colors.blanco, fontWeight: "600" },
});
