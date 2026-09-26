import { useState } from "react";
import { Alert, View, StyleSheet } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { CampoTexto } from "@componentes/atoms/CampoTexto";
import { Boton } from "@componentes/atoms/Boton";
import { useAuth } from "@nucleo/auth/AuthContext";
import { USE_MOCKS } from "@nucleo/config";
import type { ErrorApi } from "@nucleo/types/auth";

export function LoginScreen() {
  const { login } = useAuth();
  const [telefono, setTelefono] = useState("");
  const [clave, setClave] = useState("");

  const entrar = () =>
    login({ telefono, clave }).catch((e: { response?: { data?: ErrorApi } }) =>
      Alert.alert(e.response?.data?.error.mensaje ?? "No se pudo iniciar sesión")
    );

  return (
    <View style={styles.root}>
      <AppText variant="titulo">Pasaje</AppText>
      {USE_MOCKS && <AppText variant="etiqueta">Mock: 04140000001 (pasajero) o 04140000002 (recolector), clave 1234</AppText>}
      <CampoTexto value={telefono} onChangeText={setTelefono} placeholder="Teléfono" keyboardType="phone-pad" />
      <CampoTexto value={clave} onChangeText={setClave} placeholder="Clave" secureTextEntry />
      <Boton titulo="Entrar" onPress={entrar} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, justifyContent: "center", padding: 24, gap: 12 } });
