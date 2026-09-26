import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { colors, radius } from "@nucleo/theme";

interface Props {
  titulo: string;
  onPress: () => void;
  deshabilitado?: boolean;
  secundario?: boolean;
  icono?: keyof typeof Ionicons.glyphMap;
  /** Muestra un spinner y bloquea el botón mientras dura la acción. */
  cargando?: boolean;
}

export function Boton({ titulo, onPress, deshabilitado, secundario, icono, cargando }: Props) {
  const colorTexto = secundario ? colors.primarioOscuro : colors.blanco;
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado || cargando}
      style={({ pressed }) => [
        styles.base,
        secundario && styles.secundario,
        pressed && (secundario ? styles.pressedSecundario : styles.pressed),
        (deshabilitado || cargando) && styles.deshabilitado,
      ]}
    >
      <View style={styles.fila}>
        {cargando ? (
          <ActivityIndicator color={colorTexto} />
        ) : (
          icono && <Ionicons name={icono} size={20} color={colorTexto} />
        )}
        <AppText style={[styles.texto, { color: colorTexto }]}>{titulo}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.primario, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, alignItems: "center" },
  fila: { flexDirection: "row", alignItems: "center", gap: 8 },
  secundario: { backgroundColor: colors.primarioClaro },
  pressed: { backgroundColor: colors.primarioOscuro },
  pressedSecundario: { backgroundColor: colors.borde },
  deshabilitado: { opacity: 0.5 },
  texto: { fontWeight: "600" },
});
