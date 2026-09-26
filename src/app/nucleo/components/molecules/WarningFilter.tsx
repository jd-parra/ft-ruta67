import { View, Switch, StyleSheet } from "react-native";
import { AppText } from "@nucleo/components/atoms/AppText";
import { colors } from "@nucleo/theme";

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function WarningFilter({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.accent }}
      />
      <AppText variant="caption">Solo con ⚠️ para revisar</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
});
