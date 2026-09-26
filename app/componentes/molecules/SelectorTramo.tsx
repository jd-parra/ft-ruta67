import { ScrollView, Pressable, StyleSheet } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { colors, radius } from "@nucleo/theme";
import type { ModoTramo } from "@nucleo/tarifas/elegirTramo";
import type { Tramo } from "@nucleo/types/paquete";

interface Props {
  tramos: Tramo[];
  modo: ModoTramo;
  onChange: (m: ModoTramo) => void;
}

/** «Automático» (por defecto) o un tramo fijo; los tramos van ordenados por frecuencia. */
export function SelectorTramo({ tramos, modo, onChange }: Props) {
  const ordenados = [...tramos].sort((a, b) => b.frecuencia - a.frecuencia);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.fila}>
      <Chip texto="Automático" activo={modo.tipo === "automatico"} onPress={() => onChange({ tipo: "automatico" })} />
      {ordenados.map((t) => (
        <Chip
          key={t.codigo}
          texto={t.nombre}
          activo={modo.tipo === "fijo" && modo.tramoCodigo === t.codigo}
          onPress={() => onChange({ tipo: "fijo", tramoCodigo: t.codigo })}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ texto, activo, onPress }: { texto: string; activo: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, activo && styles.chipActivo]}>
      <AppText style={{ color: activo ? colors.blanco : colors.primarioOscuro, fontWeight: "600" }}>{texto}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.primarioClaro },
  chipActivo: { backgroundColor: colors.primario },
});
