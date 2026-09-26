import { View, StyleSheet } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { useAuth } from "@nucleo/auth/AuthContext";

// Placeholder: Jose monta aquí el Inicio del pasajero.
export function InicioScreen() {
  const { sesion, logout } = useAuth();
  return (
    <View style={styles.root}>
      <AppText variant="titulo">Modo pasajero</AppText>
      <AppText>{sesion?.usuario.nombre} · {sesion?.usuario.categoria}</AppText>
      <Boton titulo="Cerrar sesión" onPress={() => void logout()} secundario />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 } });
