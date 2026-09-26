import { Text, type TextProps, StyleSheet } from "react-native";
import { colors } from "@/theme";

type Variant = "title" | "body" | "bold" | "caption" | "accent";

interface Props extends TextProps {
  variant?: Variant;
}

export function AppText({ variant = "body", style, ...rest }: Props) {
  return <Text style={[styles.base, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: { color: colors.text },
  title: { fontSize: 18, fontWeight: "700" },
  body: { fontSize: 13 },
  bold: { fontSize: 13.5, fontWeight: "600" },
  caption: { fontSize: 12, color: colors.textMuted },
  accent: { fontSize: 12, color: colors.accent, fontWeight: "600" },
});
