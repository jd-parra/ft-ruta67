import { TextInput, StyleSheet, type TextInputProps } from "react-native";
import { colors, radius } from "@/theme";

export function SearchField(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      returnKeyType="search"
      autoCorrect={false}
      style={styles.input}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
});
