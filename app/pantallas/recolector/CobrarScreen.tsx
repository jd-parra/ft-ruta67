import { View, StyleSheet } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { useAuth } from "@nucleo/auth/AuthContext";

// Placeholder: la pantalla Cobrar (lector NFC) se arma sobre nucleo/nfc.
export function CobrarScreen() {
  const { sesion, logout } = useAuth();
  return (
    <View style={styles.root}>
      <AppText variant="titulo">Modo recolector</AppText>
      <AppText>{sesion?.usuario.nombre}</AppText>
      <Boton titulo="Cerrar sesión" onPress={() => void logout()} secundario />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 } });
