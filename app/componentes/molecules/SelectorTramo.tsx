import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { formatearBs } from "@componentes/formato";
import { colors, radius } from "@nucleo/theme";
import type { ModoTramo } from "@nucleo/tarifas/elegirTramo";
import type { Tramo } from "@nucleo/types/paquete";

interface Props {
  tramos: Tramo[];
  modo: ModoTramo;
  onChange: (m: ModoTramo) => void;
  /** Pasaje completo y con descuento (estudiante/exonerado) de un tramo, hoy. */
  precio: (t: Tramo) => { completo: number; descuento: number };
}

/**
 * Qué ruta se cobra: «Automático» (por defecto, la que sugiere el pasajero) o una ruta fija.
 * Cada ruta es una tarjeta con su precio, para que el recolector sepa cuánto cobra antes del toque.
 */
export function SelectorTramo({ tramos, modo, onChange, precio }: Props) {
  const ordenados = [...tramos].sort((a, b) => b.frecuencia - a.frecuencia);
  const automatico = modo.tipo === "automatico";
  return (
    <View style={styles.contenedor}>
      <Pressable
        onPress={() => onChange({ tipo: "automatico" })}
        accessibilityRole="radio"
        accessibilityState={{ selected: automatico }}
        style={[styles.tarjeta, styles.automatico, automatico && styles.activa]}
      >
        <Ionicons name="sparkles-outline" size={22} color={automatico ? colors.blanco : colors.primario} />
        <View style={styles.flex}>
          <AppText style={[styles.nombre, automatico && styles.blanco]}>Automático</AppText>
          <AppText style={[styles.detalle, automatico && styles.blancoSuave]}>
            Cobra la ruta que sugiere el teléfono del pasajero
          </AppText>
        </View>
        {automatico && <Ionicons name="checkmark-circle" size={22} color={colors.blanco} />}
      </Pressable>

      <View style={styles.rejilla}>
        {ordenados.map((t) => {
          const activa = modo.tipo === "fijo" && modo.tramoCodigo === t.codigo;
          const p = precio(t);
          return (
            <Pressable
              key={t.codigo}
              onPress={() => onChange({ tipo: "fijo", tramoCodigo: t.codigo })}
              accessibilityRole="radio"
              accessibilityState={{ selected: activa }}
              style={[styles.tarjeta, styles.ruta, activa && styles.activa]}
            >
              <AppText style={[styles.nombre, activa && styles.blanco]} numberOfLines={2}>
                {t.nombre}
              </AppText>
              <AppText style={[styles.detalle, activa && styles.blancoSuave]}>{t.km} km</AppText>
              <AppText style={[styles.precio, activa && styles.blanco]} adjustsFontSizeToFit numberOfLines={1}>
                {formatearBs(p.completo)}
              </AppText>
              {p.descuento !== p.completo && (
                <AppText style={[styles.detalle, activa && styles.blancoSuave]}>
                  Est. / exon. {formatearBs(p.descuento)}
                </AppText>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 10 },
  rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tarjeta: {
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borde,
    backgroundColor: colors.blanco,
    padding: 12,
  },
  automatico: { flexDirection: "row", alignItems: "center", gap: 12 },
  ruta: { flexGrow: 1, flexBasis: "45%", gap: 2 },
  activa: { backgroundColor: colors.primario, borderColor: colors.primario },
  flex: { flex: 1 },
  nombre: { fontWeight: "700", color: colors.primarioOscuro },
  detalle: { fontSize: 12, color: colors.textoSuave },
  precio: { fontSize: 20, fontWeight: "800", color: colors.primarioOscuro, marginTop: 6 },
  blanco: { color: colors.blanco },
  blancoSuave: { color: colors.primarioClaro },
});
