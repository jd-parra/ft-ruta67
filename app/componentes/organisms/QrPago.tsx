import { Modal, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { colors, radius, sombra } from "@nucleo/theme";

interface Props {
  /** Texto del QR (`P2:…`); null cierra el modal. */
  texto: string | null;
  onCerrar: () => void;
}

/** QR grande para pagar sin NFC: el recolector lo escanea desde Cobrar. */
export function QrPago({ texto, onCerrar }: Props) {
  return (
    <Modal visible={!!texto} animationType="fade" transparent onRequestClose={onCerrar} statusBarTranslucent>
      <View style={styles.fondo}>
        <View style={styles.tarjeta}>
          <AppText variant="titulo" style={styles.centro}>Paga con QR</AppText>
          <AppText style={[styles.centro, styles.suave]}>Muéstraselo al recolector para que lo escanee</AppText>
          <View style={styles.qr}>{texto && <QRCode value={texto} size={260} color={colors.primarioOscuro} ecl="M" />}</View>
          <AppText variant="etiqueta" style={styles.centro}>
            Vale por un viaje. El recibo te llega cuando el recolector sincroniza.
          </AppText>
          <Boton titulo="Listo" onPress={onCerrar} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "rgba(31,27,46,0.6)", justifyContent: "center", padding: 20 },
  tarjeta: { backgroundColor: colors.blanco, borderRadius: radius.lg, padding: 24, gap: 12, ...sombra },
  qr: { alignSelf: "center", padding: 12, backgroundColor: colors.blanco, borderRadius: radius.md, marginVertical: 8 },
  centro: { textAlign: "center" },
  suave: { color: colors.textoSuave },
});
