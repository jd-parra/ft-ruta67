import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/atoms/AppText";
import { LegendItem } from "@/components/molecules/LegendItem";
import { colors, precisionColor, radius } from "@/theme";

export function Legend() {
  return (
    <View style={styles.box} pointerEvents="none">
      <AppText variant="bold" style={styles.title}>Precisión de ubicación</AppText>
      <LegendItem color={precisionColor.plus_code} label="Plus Code decodificado" />
      <LegendItem color={precisionColor.coordenadas_gps} label="Coordenadas GPS del PDF" />
      <LegendItem color={precisionColor.aproximada} label="Aproximada (calle/centro comercial)" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 10,
  },
  title: { fontSize: 11.5, marginBottom: 6 },
});
