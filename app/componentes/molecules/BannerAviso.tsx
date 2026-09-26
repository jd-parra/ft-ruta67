import { StyleSheet, View } from "react-native";
import type { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { IconoCirculo } from "@componentes/atoms/IconoCirculo";
import { colors, radius } from "@nucleo/theme";
import type { Aviso } from "@nucleo/types/billetera";

type Tono = "info" | "exito" | "aviso" | "error";

const TONOS: Record<Tono, { color: string; fondo: string }> = {
  info: { color: colors.primario, fondo: colors.primarioClaro },
  exito: { color: colors.exito, fondo: colors.exitoClaro },
  aviso: { color: colors.aviso, fondo: colors.avisoClaro },
  error: { color: colors.error, fondo: colors.errorClaro },
};

const POR_TIPO: Record<Aviso["tipo"], { tono: Tono; icono: keyof typeof Ionicons.glyphMap; titulo: string }> = {
  CAMBIO_TARIFA: { tono: "aviso", icono: "pricetag-outline", titulo: "Cambio de tarifa" },
  CATEGORIA_APROBADA: { tono: "exito", icono: "checkmark-circle-outline", titulo: "Categoría aprobada" },
  CATEGORIA_RECHAZADA: { tono: "error", icono: "close-circle-outline", titulo: "Categoría rechazada" },
  CUENTA_BLOQUEADA: { tono: "error", icono: "lock-closed-outline", titulo: "Cuenta bloqueada" },
};

interface Props {
  titulo: string;
  mensaje: string;
  tono?: Tono;
  icono?: keyof typeof Ionicons.glyphMap;
}

export function BannerAviso({ titulo, mensaje, tono = "info", icono = "information-circle-outline" }: Props) {
  const { color, fondo } = TONOS[tono];
  return (
    <View style={[styles.banner, { backgroundColor: fondo }]}>
      <IconoCirculo nombre={icono} color={color} fondo={colors.blanco} tamano={36} />
      <View style={styles.textos}>
        <AppText style={[styles.titulo, { color }]}>{titulo}</AppText>
        <AppText style={styles.mensaje}>{mensaje}</AppText>
      </View>
    </View>
  );
}

/** Aviso del backend (`Billetera.avisos`) con el tono e icono de su tipo. */
export function BannerDeAviso({ aviso }: { aviso: Aviso }) {
  const { tono, icono, titulo } = POR_TIPO[aviso.tipo];
  const desde = aviso.vigenteDesde ? ` Vigente desde el ${new Date(aviso.vigenteDesde).toLocaleDateString("es-VE")}.` : "";
  return <BannerAviso titulo={titulo} mensaje={aviso.mensaje + desde} tono={tono} icono={icono} />;
}

const styles = StyleSheet.create({
  banner: { flexDirection: "row", gap: 12, padding: 14, borderRadius: radius.md, alignItems: "center" },
  textos: { flex: 1, gap: 2 },
  titulo: { fontWeight: "700", fontSize: 14 },
  mensaje: { fontSize: 13 },
});
