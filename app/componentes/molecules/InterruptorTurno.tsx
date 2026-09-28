import { ActivityIndicator, StyleSheet, Switch, View } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { IconoCirculo } from "@componentes/atoms/IconoCirculo";
import { colors, radius } from "@nucleo/theme";

interface Props {
  enTurno: boolean;
  activando: boolean;
  error: string | null;
  ultimoEnvio: Date | null;
  onCambiar: (activar: boolean) => void;
}

/** Toggle «En turno»: mientras está activo, la unidad aparece en el mapa. */
export function InterruptorTurno({ enTurno, activando, error, ultimoEnvio, onCambiar }: Props) {
  const detalle = error
    ? error
    : enTurno
      ? ultimoEnvio
        ? `Tu unidad aparece en el mapa · ${ultimoEnvio.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })}`
        : "Enviando tu ubicación…"
      : "Actívalo al empezar la ruta para aparecer en el mapa";

  return (
    <View style={[styles.caja, enTurno && styles.cajaActiva]}>
      <IconoCirculo
        nombre={enTurno ? "navigate" : "navigate-outline"}
        color={enTurno ? colors.blanco : colors.primario}
        fondo={enTurno ? colors.exito : colors.primarioClaro}
      />
      <View style={styles.textos}>
        <AppText style={styles.titulo}>{enTurno ? "En turno" : "Fuera de turno"}</AppText>
        <AppText variant="etiqueta" style={error ? styles.error : undefined}>{detalle}</AppText>
      </View>
      {activando ? (
        <ActivityIndicator color={colors.primario} />
      ) : (
        <Switch
          value={enTurno}
          onValueChange={onCambiar}
          trackColor={{ false: colors.borde, true: colors.exito }}
          thumbColor={colors.blanco}
          accessibilityLabel="En turno"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  caja: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.blanco,
    borderWidth: 1,
    borderColor: colors.borde,
  },
  cajaActiva: { borderColor: colors.exito, backgroundColor: colors.exitoClaro },
  textos: { flex: 1, gap: 2 },
  titulo: { fontWeight: "700" },
  error: { color: colors.error, opacity: 1 },
});
