import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { colors, radius } from "@nucleo/theme";

interface Props {
  /** 0 = hoy, 1 = ayer… */
  diasAtras: number;
  onChange: (diasAtras: number) => void;
  /** Hasta cuántos días atrás se puede ir. */
  maximo?: number;
}

const DIA_MS = 24 * 3600 * 1000;

/** Fecha que corresponde a `diasAtras` (la hora da igual: el día se calcula en hora de Mérida). */
export const fechaDe = (diasAtras: number) => new Date(Date.now() - diasAtras * DIA_MS);

function nombreDia(diasAtras: number) {
  if (diasAtras === 0) return "Hoy";
  if (diasAtras === 1) return "Ayer";
  return fechaDe(diasAtras).toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "short" });
}

/** ‹ Hoy › para moverse entre días. No deja pasar de hoy. */
export function SelectorDia({ diasAtras, onChange, maximo = 30 }: Props) {
  return (
    <View style={styles.fila}>
      <Flecha icono="chevron-back" habilitada={diasAtras < maximo} onPress={() => onChange(diasAtras + 1)} etiqueta="Día anterior" />
      <AppText style={styles.texto}>{nombreDia(diasAtras)}</AppText>
      <Flecha icono="chevron-forward" habilitada={diasAtras > 0} onPress={() => onChange(diasAtras - 1)} etiqueta="Día siguiente" />
    </View>
  );
}

function Flecha(p: { icono: "chevron-back" | "chevron-forward"; habilitada: boolean; onPress: () => void; etiqueta: string }) {
  return (
    <Pressable
      onPress={p.onPress}
      disabled={!p.habilitada}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={p.etiqueta}
      style={({ pressed }) => [styles.flecha, pressed && { backgroundColor: colors.borde }, !p.habilitada && { opacity: 0.3 }]}
    >
      <Ionicons name={p.icono} size={20} color={colors.primarioOscuro} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.primarioClaro, borderRadius: radius.pill, padding: 4 },
  flecha: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  texto: { color: colors.primarioOscuro, fontWeight: "700", textTransform: "capitalize" },
});
