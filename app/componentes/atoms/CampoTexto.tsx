import { TextInput, StyleSheet, type TextInputProps } from "react-native";
import { colors, radius } from "@nucleo/theme";

export function CampoTexto(props: TextInputProps) {
  return <TextInput placeholderTextColor="#9CA3AF" style={styles.input} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.acento,
    backgroundColor: colors.blanco,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.texto,
  },
});
