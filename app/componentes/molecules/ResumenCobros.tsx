import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { Tarjeta } from "@componentes/atoms/Tarjeta";
import { CATEGORIAS, formatearBs } from "@componentes/formato";
import { colors, radius } from "@nucleo/theme";
import type { Categoria } from "@nucleo/types/auth";
import type { Cobro } from "@nucleo/types/cobros";

interface Grupo {
  nombre: string;
  cantidad: number;
  total: number;
}

function porTramo(cobros: Cobro[]): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const c of cobros) {
    const g = grupos.get(c.tramoNombre) ?? { nombre: c.tramoNombre, cantidad: 0, total: 0 };
    g.cantidad += 1;
    g.total += c.monto;
    grupos.set(c.tramoNombre, g);
  }
  return [...grupos.values()].sort((a, b) => b.cantidad - a.cantidad);
}

function porCategoria(cobros: Cobro[]): [Categoria, number][] {
  const cuenta: Record<Categoria, number> = { general: 0, estudiante: 0, exonerado: 0 };
  for (const c of cobros) cuenta[c.categoriaAplicada] += 1;
  return (Object.keys(cuenta) as Categoria[]).filter((k) => cuenta[k] > 0).map((k) => [k, cuenta[k]]);
}

/** Desglose del día: cuánto se cobró en cada tramo y cuántos pasajeros de cada categoría. */
export function ResumenCobros({ cobros }: { cobros: Cobro[] }) {
  if (!cobros.length) return null;
  return (
    <Tarjeta style={styles.tarjeta}>
      <AppText variant="subtitulo">Por ruta</AppText>
      {porTramo(cobros).map((g) => (
        <View key={g.nombre} style={styles.fila}>
          <AppText style={styles.nombre} numberOfLines={1}>{g.nombre}</AppText>
          <AppText style={styles.cantidad}>{g.cantidad} ×</AppText>
          <AppText style={styles.total}>{formatearBs(g.total)}</AppText>
        </View>
      ))}

      <AppText variant="subtitulo" style={styles.subtitulo}>Pasajeros</AppText>
      <View style={styles.chips}>
        {porCategoria(cobros).map(([cat, n]) => (
          <View key={cat} style={styles.chip}>
            <Ionicons name={CATEGORIAS[cat].icono} size={14} color={colors.primarioOscuro} />
            <AppText style={styles.chipTexto}>
              {n} {CATEGORIAS[cat].nombre.toLowerCase()}
            </AppText>
          </View>
        ))}
      </View>
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  tarjeta: { gap: 8 },
  fila: { flexDirection: "row", alignItems: "center", gap: 8 },
  nombre: { flex: 1 },
  cantidad: { color: colors.textoSuave },
  total: { fontWeight: "700", minWidth: 90, textAlign: "right" },
  subtitulo: { marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primarioClaro, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  chipTexto: { color: colors.primarioOscuro, fontWeight: "600", fontSize: 13 },
});
