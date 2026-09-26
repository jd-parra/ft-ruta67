import { View, StyleSheet } from "react-native";
import { Dot } from "@nucleo/components/atoms/Dot";
import { AppText } from "@nucleo/components/atoms/AppText";

interface Props {
  color: string;
  label: string;
}

export function LegendItem({ color, label }: Props) {
  return (
    <View style={styles.row}>
      <Dot color={color} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
});
