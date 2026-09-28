import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { IconoCirculo } from "@componentes/atoms/IconoCirculo";
import { CATEGORIAS } from "@componentes/formato";
import { colors, radius } from "@nucleo/theme";
import type { Categoria } from "@nucleo/types/auth";

interface Props {
  valor: Categoria;
  onChange: (c: Categoria) => void;
}

const ORDEN: Categoria[] = ["general", "estudiante", "exonerado"];

/** Tres opciones en tarjeta; la elegida se marca con borde y check. */
export function SelectorCategoria({ valor, onChange }: Props) {
  return (
    <View style={styles.lista} accessibilityRole="radiogroup">
      {ORDEN.map((c) => {
        const activa = c === valor;
        const { nombre, icono, detalle } = CATEGORIAS[c];
        return (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            accessibilityRole="radio"
            accessibilityState={{ checked: activa }}
            style={[styles.opcion, activa && styles.activa]}
          >
            <IconoCirculo nombre={icono} fondo={activa ? colors.blanco : colors.primarioClaro} />
            <View style={styles.textos}>
              <AppText style={styles.nombre}>{nombre}</AppText>
              <AppText variant="etiqueta">{detalle}</AppText>
            </View>
            <Ionicons
              name={activa ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={activa ? colors.primario : colors.borde}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { gap: 8 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.blanco,
  },
  activa: { borderColor: colors.primario, backgroundColor: colors.primarioClaro },
  textos: { flex: 1, gap: 2 },
  nombre: { fontWeight: "600" },
});
