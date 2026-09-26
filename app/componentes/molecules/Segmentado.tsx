import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { colors, radius } from "@nucleo/theme";

interface Props<T extends string> {
  opciones: { valor: T; texto: string }[];
  valor: T;
  onChange: (v: T) => void;
}

/** Control segmentado (pestañas dentro de una pantalla). */
export function Segmentado<T extends string>({ opciones, valor, onChange }: Props<T>) {
  return (
    <View style={styles.contenedor} accessibilityRole="tablist">
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onChange(o.valor)}
            style={[styles.opcion, activo && styles.activa]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
          >
            <AppText style={[styles.texto, activo && styles.textoActivo]}>{o.texto}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { flexDirection: "row", backgroundColor: colors.primarioClaro, borderRadius: radius.md, padding: 4 },
  opcion: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: radius.sm },
  activa: { backgroundColor: colors.blanco },
  texto: { fontWeight: "600", color: colors.textoSuave },
  textoActivo: { color: colors.primarioOscuro },
});
