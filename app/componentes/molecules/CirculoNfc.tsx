import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { colors } from "@nucleo/theme";

const TAMANO = 140;

interface Props {
  /** Morado con ondas cuando el NFC está listo; gris claro si no. */
  activo: boolean;
  icono: keyof typeof Ionicons.glyphMap;
  /** Hace el círculo tocable (Cobrar: abre el escáner de QR). */
  onPress?: () => void;
  /** Texto corto bajo el ícono, dentro del círculo (p. ej. «Escanear QR»). */
  pista?: string;
}

/** Círculo central de Pagar y Cobrar: ondas que salen mientras el teléfono espera el toque. */
export function CirculoNfc({ activo, icono, onPress, pista }: Props) {
  const color = activo ? colors.blanco : colors.primarioOscuro;
  return (
    <View style={styles.zona}>
      <Pulso activo={activo} />
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={pista}
        style={({ pressed }) => [styles.circulo, !activo && styles.circuloInactivo, pressed && styles.presionado]}
      >
        <Ionicons name={icono} size={pista ? 48 : 56} color={onPress || activo ? color : colors.textoSuave} />
        {pista && <AppText style={[styles.pista, { color }]}>{pista}</AppText>}
      </Pressable>
    </View>
  );
}

function Pulso({ activo }: { activo: boolean }) {
  const ondas = useRef([new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    if (!activo) return;
    const animaciones = ondas.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 900),
          Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    animaciones.forEach((a) => a.start());
    return () => {
      animaciones.forEach((a) => a.stop());
      ondas.forEach((v) => v.setValue(0));
    };
  }, [activo, ondas]);

  if (!activo) return null;
  return (
    <>
      {ondas.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.onda,
            {
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
            },
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  zona: { height: TAMANO * 2, alignItems: "center", justifyContent: "center" },
  circulo: {
    width: TAMANO,
    height: TAMANO,
    borderRadius: TAMANO / 2,
    backgroundColor: colors.primario,
    alignItems: "center",
    justifyContent: "center",
  },
  circuloInactivo: { backgroundColor: colors.primarioClaro },
  presionado: { transform: [{ scale: 0.95 }] },
  pista: { fontSize: 11, fontWeight: "700", marginTop: 2 },
  onda: { position: "absolute", width: TAMANO, height: TAMANO, borderRadius: TAMANO / 2, backgroundColor: colors.acento },
});
