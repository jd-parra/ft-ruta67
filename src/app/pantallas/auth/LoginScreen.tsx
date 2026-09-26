import { useState } from "react";
import { Alert, Button, View, StyleSheet } from "react-native";
import { AppText } from "@nucleo/components/atoms/AppText";
import { SearchField } from "@nucleo/components/atoms/SearchField";
import { useAuth } from "@nucleo/auth/AuthContext";
import { USE_MOCKS } from "@nucleo/config";

export function LoginScreen() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  const entrar = () =>
    login({ usuario, password }).catch(() => Alert.alert("No se pudo iniciar sesión"));

  return (
    <View style={styles.root}>
      <AppText variant="title">Ruta 67</AppText>
      {USE_MOCKS && (
        <AppText variant="caption">Modo mock: usuario "rec…" = recolector, otro = pasajero</AppText>
      )}
      <SearchField value={usuario} onChangeText={setUsuario} placeholder="Usuario" autoCapitalize="none" />
      <SearchField value={password} onChangeText={setPassword} placeholder="Contraseña" secureTextEntry />
      <Button title="Entrar" onPress={entrar} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
});
