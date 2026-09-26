import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@nucleo/theme";

interface Props {
  map: ReactNode;
  panel: ReactNode;
}

// Mapa arriba (55%), panel de lista abajo (45%).
export function MapTemplate({ map, panel }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.map}>{map}</View>
      <View style={[styles.panel, { paddingBottom: insets.bottom }]}>{panel}</View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 55 },
  panel: { flex: 45, backgroundColor: colors.panel },
});
