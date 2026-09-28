import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { formatearBs } from "@componentes/formato";
import { colors, radius, sombra } from "@nucleo/theme";
import type { Billetera } from "@nucleo/types/billetera";

/** Saldo disponible grande, reservado en boletos y viajes estimados (contrato sección 14, Inicio). */
export function TarjetaSaldo({ billetera }: { billetera: Billetera }) {
  const { saldoDisponible, saldoReservado, viajesEstimados, boletosActivos } = billetera;
  return (
    <View style={styles.tarjeta}>
      {/* Círculos decorativos: dan profundidad sin depender de un gradiente nativo. */}
      <View style={[styles.circulo, styles.circuloGrande]} />
      <View style={[styles.circulo, styles.circuloChico]} />

      <AppText style={styles.etiqueta}>Saldo disponible</AppText>
      <AppText variant="cifra" style={styles.blanco} adjustsFontSizeToFit numberOfLines={1}>
        {formatearBs(saldoDisponible)}
      </AppText>

      <View style={styles.pie}>
        <Dato icono="lock-closed-outline" etiqueta="En boletos" valor={formatearBs(saldoReservado)} />
        <View style={styles.separador} />
        <Dato
          icono="bus-outline"
          etiqueta="Te alcanza para"
          valor={viajesEstimados === null ? "Viajes ilimitados" : `≈ ${viajesEstimados} ${viajesEstimados === 1 ? "viaje" : "viajes"}`}
        />
      </View>

      <View style={styles.boletos}>
        <Ionicons name="ticket-outline" size={14} color={colors.blanco} />
        <AppText style={styles.boletosTexto}>
          {boletosActivos} {boletosActivos === 1 ? "boleto listo" : "boletos listos"}
        </AppText>
      </View>
    </View>
  );
}

function Dato({ icono, etiqueta, valor }: { icono: keyof typeof Ionicons.glyphMap; etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <View style={styles.datoFila}>
        <Ionicons name={icono} size={14} color={colors.primarioClaro} />
        <AppText style={styles.etiqueta}>{etiqueta}</AppText>
      </View>
      <AppText style={styles.datoValor}>{valor}</AppText>
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
  pie: { flexDirection: "row", marginTop: 16, gap: 16 },
  separador: { width: 1, backgroundColor: colors.acento, opacity: 0.5 },
  dato: { flex: 1, gap: 4 },
  datoFila: { flexDirection: "row", alignItems: "center", gap: 4 },
  datoValor: { color: colors.blanco, fontWeight: "700", fontSize: 16 },
  boletos: {
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
  boletosTexto: { color: colors.blanco, fontWeight: "600", fontSize: 13 },
});
