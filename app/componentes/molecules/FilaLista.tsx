import { StyleSheet, View } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { IconoCirculo } from "@componentes/atoms/IconoCirculo";
import { colors } from "@nucleo/theme";

interface Props {
  icono: keyof typeof Ionicons.glyphMap;
  colorIcono?: string;
  fondoIcono?: string;
  titulo: string;
  subtitulo?: string;
  valor?: string;
  colorValor?: string;
  detalleValor?: string;
}

/** Fila de historial: icono · título/subtítulo · monto a la derecha. */
export function FilaLista({ icono, colorIcono, fondoIcono, titulo, subtitulo, valor, colorValor = colors.texto, detalleValor }: Props) {
  return (
    <View style={styles.fila}>
      <IconoCirculo nombre={icono} color={colorIcono} fondo={fondoIcono} />
      <View style={styles.centro}>
        <AppText style={styles.titulo} numberOfLines={1}>{titulo}</AppText>
        {subtitulo && <AppText variant="etiqueta" numberOfLines={1}>{subtitulo}</AppText>}
      </View>
      {valor && (
        <View style={styles.derecha}>
          <AppText style={[styles.valor, { color: colorValor }]}>{valor}</AppText>
          {detalleValor && <AppText variant="etiqueta">{detalleValor}</AppText>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  centro: { flex: 1, gap: 2 },
  titulo: { fontWeight: "600" },
  derecha: { alignItems: "flex-end", gap: 2 },
  valor: { fontWeight: "700" },
});
