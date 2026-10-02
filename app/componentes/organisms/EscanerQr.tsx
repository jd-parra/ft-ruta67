import { useEffect, useRef } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { colors, radius } from "@nucleo/theme";

const MARCO = 260;

interface Props {
  visible: boolean;
  onCerrar: () => void;
  /** Se llama una sola vez por apertura con el texto del QR; el escáner se cierra solo. */
  onLeido: (texto: string) => void;
}

/** Cámara a pantalla completa para cobrar el QR de un pasajero sin NFC (contrato §9, QR). */
export function EscanerQr({ visible, onCerrar, onLeido }: Props) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const leido = useRef(false);

  useEffect(() => {
    if (!visible) return;
    leido.current = false;
    if (permiso && !permiso.granted && permiso.canAskAgain) void pedirPermiso();
  }, [visible, permiso, pedirPermiso]);

  const alLeer = ({ data }: { data: string }) => {
    if (leido.current) return; // la cámara entrega el mismo código varias veces por segundo
    leido.current = true;
    onCerrar();
    onLeido(data);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar} statusBarTranslucent>
      <View style={styles.fondo}>
        {permiso?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={visible ? alLeer : undefined}
          />
        ) : (
          <View style={styles.sinPermiso}>
            <Ionicons name="camera-outline" size={48} color={colors.blanco} />
            <AppText style={styles.textoClaro}>Para cobrar por QR, Ruta67 necesita usar la cámara.</AppText>
            <Boton titulo="Permitir cámara" icono="camera" onPress={() => void pedirPermiso()} />
          </View>
        )}

        <View style={styles.capa} pointerEvents="box-none">
          <Pressable onPress={onCerrar} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.cerrar}>
            <Ionicons name="close" size={26} color={colors.blanco} />
          </Pressable>
          {permiso?.granted && (
            <>
              <View style={styles.marco} />
              <AppText style={[styles.textoClaro, styles.instruccion]}>Apunta al QR que muestra el pasajero en Pagar</AppText>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: "#000" },
  capa: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", gap: 24 },
  cerrar: {
    position: "absolute",
    top: 48,
    right: 20,
    padding: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  marco: { width: MARCO, height: MARCO, borderRadius: radius.lg, borderWidth: 4, borderColor: colors.acento },
  instruccion: { paddingHorizontal: 32, fontWeight: "600" },
  sinPermiso: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 32 },
  textoClaro: { color: colors.blanco, textAlign: "center" },
});
