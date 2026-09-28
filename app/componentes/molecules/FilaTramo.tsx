import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { CATEGORIAS, formatearBs } from "@componentes/formato";
import { colors, radius } from "@nucleo/theme";
import type { Categoria } from "@nucleo/types/auth";

const ORDEN: Categoria[] = ["general", "estudiante", "exonerado"];

interface Props {
  nombre: string;
  km: number;
  /** Monto por categoría, en céntimos. */
  montos: Record<Categoria, number>;
}

/** Tramo de la línea con su tarifa completa y con descuento (Mi línea). */
export function FilaTramo({ nombre, km, montos }: Props) {
  return (
    <View style={styles.fila}>
      <View style={styles.encabezado}>
        <AppText style={styles.nombre}>{nombre}</AppText>
        <AppText variant="etiqueta">{km} km</AppText>
      </View>
      <View style={styles.tarifas}>
        {ORDEN.map((c) => (
          <View key={c} style={[styles.tarifa, c === "general" && styles.tarifaGeneral]}>
            <View style={styles.categoria}>
              <Ionicons name={CATEGORIAS[c].icono} size={13} color={colors.textoSuave} />
              <AppText variant="etiqueta">{CATEGORIAS[c].nombre}</AppText>
            </View>
            <AppText style={[styles.monto, c === "general" && styles.montoGeneral]}>
              {montos[c] === 0 ? "Gratis" : formatearBs(montos[c])}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { paddingVertical: 14, gap: 10 },
  encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  nombre: { flex: 1, fontWeight: "700" },
  tarifas: { flexDirection: "row", gap: 8 },
  categoria: { flexDirection: "row", alignItems: "center", gap: 4 },
  tarifa: { flex: 1, backgroundColor: colors.fondo, borderRadius: radius.sm, padding: 8, gap: 2 },
  tarifaGeneral: { backgroundColor: colors.primarioClaro },
  monto: { fontWeight: "700" },
  montoGeneral: { color: colors.primarioOscuro },
});
