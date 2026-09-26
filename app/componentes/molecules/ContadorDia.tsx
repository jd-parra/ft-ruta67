import { View, StyleSheet } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { formatearBs } from "@componentes/formato";
import { colors, radius } from "@nucleo/theme";

// Se reexporta para no romper los imports existentes (TarjetaResultado).
export { formatearBs };

export function ContadorDia({ cantidad, total }: { cantidad: number; total: number }) {
  return (
    <View style={styles.caja}>
      <AppText variant="etiqueta">Hoy</AppText>
      <AppText style={styles.texto}>
        {cantidad} {cantidad === 1 ? "cobro" : "cobros"} · {formatearBs(total)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  caja: { backgroundColor: colors.primarioClaro, borderRadius: radius.md, padding: 14, alignItems: "center" },
  texto: { fontSize: 18, fontWeight: "700", color: colors.primarioOscuro },
});
