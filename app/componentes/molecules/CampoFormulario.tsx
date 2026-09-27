import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { colors, radius } from "@nucleo/theme";

interface Props extends TextInputProps {
  etiqueta: string;
  icono?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  ayuda?: string;
}

/** Campo con etiqueta, icono y mensaje de error o de ayuda debajo. */
export function CampoFormulario({ etiqueta, icono, error, ayuda, secureTextEntry, onFocus, onBlur, ...rest }: Props) {
  const [enfocado, setEnfocado] = useState(false);
  const [oculto, setOculto] = useState(true);
  const colorBorde = error ? colors.error : enfocado ? colors.primario : colors.borde;

  return (
    <View style={styles.contenedor}>
      <AppText style={styles.etiqueta}>{etiqueta}</AppText>
      <View style={[styles.caja, { borderColor: colorBorde }]}>
        {icono && <Ionicons name={icono} size={20} color={enfocado ? colors.primario : colors.textoSuave} />}
        <TextInput
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          secureTextEntry={secureTextEntry && oculto}
          onFocus={(e) => {
            setEnfocado(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setEnfocado(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secureTextEntry && (
          <Ionicons
            name={oculto ? "eye-outline" : "eye-off-outline"}
            size={20}
            color={colors.textoSuave}
            onPress={() => setOculto((o) => !o)}
            accessibilityLabel={oculto ? "Mostrar clave" : "Ocultar clave"}
          />
        )}
      </View>
      {error ? (
        <AppText style={styles.error}>{error}</AppText>
      ) : (
        ayuda && <AppText variant="etiqueta">{ayuda}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { gap: 6 },
  etiqueta: { fontSize: 13, fontWeight: "600", color: colors.primarioOscuro },
  caja: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1.5,
    backgroundColor: colors.blanco,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 13, fontSize: 16, color: colors.texto },
  error: { fontSize: 12, color: colors.error },
});
