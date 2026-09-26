import { View, Button, StyleSheet } from "react-native";
import { AppText } from "@nucleo/components/atoms/AppText";
import { useAuth } from "@nucleo/auth/AuthContext";

// Placeholder: aquí Jose monta la pantalla del recolector (lectura NFC).
export function CobroScreen() {
  const { sesion, logout } = useAuth();
  return (
    <View style={styles.root}>
      <AppText variant="title">Modo recolector</AppText>
      <AppText>{sesion?.usuario.nombre}</AppText>
      <Button title="Cerrar sesión" onPress={() => void logout()} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 } });
