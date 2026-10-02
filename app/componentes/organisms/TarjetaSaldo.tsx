import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { formatearBs } from "@componentes/formato";
import { colors, radius, sombra } from "@nucleo/theme";
import { saldoTotal, type Billetera } from "@nucleo/types/billetera";

/**
 * Saldo total (libre + apartado en boletos) y cuántos viajes alcanza (contrato sección 14, Inicio).
 * Debajo, en letra pequeña, con qué tarifa se calcula: el pasaje urbano de la gaceta con su descuento.
 */
export function TarjetaSaldo({ billetera }: { billetera: Billetera }) {
  const { viajesEstimados, tarifaReferencia, tarifaFuente } = billetera;
  return (
    <View style={styles.tarjeta}>
      {/* Círculos decorativos: dan profundidad sin depender de un gradiente nativo. */}
      <View style={[styles.circulo, styles.circuloGrande]} />
      <View style={[styles.circulo, styles.circuloChico]} />

      <AppText style={styles.etiqueta}>Tu saldo</AppText>
      <AppText variant="cifra" style={styles.blanco} adjustsFontSizeToFit numberOfLines={1}>
        {formatearBs(saldoTotal(billetera))}
      </AppText>

      <View style={styles.viajes}>
        <Ionicons name="bus-outline" size={14} color={colors.blanco} />
        <AppText style={styles.viajesTexto}>
          {viajesEstimados === null
            ? "Viajes ilimitados"
            : `Te alcanza para ≈ ${viajesEstimados} ${viajesEstimados === 1 ? "viaje" : "viajes"}`}
        </AppText>
      </View>
      {tarifaReferencia > 0 && (
        <AppText style={styles.nota}>
          Calculado con el pasaje urbano de {formatearBs(tarifaReferencia)}
          {tarifaFuente ? ` · ${tarifaFuente}` : ""}. Las rutas largas pueden costar más.
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { backgroundColor: colors.primario, borderRadius: radius.lg, padding: 20, gap: 4, overflow: "hidden", ...sombra },
  circulo: { position: "absolute", borderRadius: 999, backgroundColor: colors.acento, opacity: 0.25 },
  circuloGrande: { width: 220, height: 220, top: -90, right: -70 },
  circuloChico: { width: 120, height: 120, bottom: -50, right: 60, backgroundColor: colors.primarioOscuro, opacity: 0.35 },
  etiqueta: { color: colors.primarioClaro, fontSize: 13 },
  blanco: { color: colors.blanco },
  viajes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  viajesTexto: { color: colors.blanco, fontWeight: "600", fontSize: 13 },
  nota: { color: colors.primarioClaro, fontSize: 11, opacity: 0.85, marginTop: 6 },
});
