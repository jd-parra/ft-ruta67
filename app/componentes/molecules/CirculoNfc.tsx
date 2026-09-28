import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@nucleo/theme";

const TAMANO = 140;

interface Props {
  /** Morado con ondas cuando el NFC está listo; gris claro si no. */
  activo: boolean;
  icono: keyof typeof Ionicons.glyphMap;
}

/** Círculo central de Pagar y Cobrar: ondas que salen mientras el teléfono espera el toque. */
export function CirculoNfc({ activo, icono }: Props) {
  return (
    <View style={styles.zona}>
      <Pulso activo={activo} />
      <View style={[styles.circulo, !activo && styles.circuloInactivo]}>
        <Ionicons name={icono} size={56} color={activo ? colors.blanco : colors.textoSuave} />
      </View>
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
  onda: { position: "absolute", width: TAMANO, height: TAMANO, borderRadius: TAMANO / 2, backgroundColor: colors.acento },
});
