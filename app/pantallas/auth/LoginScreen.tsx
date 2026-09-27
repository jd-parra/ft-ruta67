import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { CampoFormulario } from "@componentes/molecules/CampoFormulario";
import { EncabezadoMarca } from "@componentes/molecules/EncabezadoMarca";
import { Pantalla } from "@componentes/templates/Pantalla";
import { mensajeDeError } from "@nucleo/api/errores";
import { useAuth } from "@nucleo/auth/AuthContext";
import { USE_MOCKS } from "@nucleo/config";
import type { AuthNav } from "@nucleo/navigation/types";
import { colors } from "@nucleo/theme";

// Compartido por los dos modos: el rol del usuario decide a dónde entra.
export function LoginScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<AuthNav>();
  const [telefono, setTelefono] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entrar = async () => {
    setError(null);
    setEnviando(true);
    try {
      await login({ telefono: telefono.trim(), clave });
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo iniciar sesión"));
      setEnviando(false);
    }
  };

  return (
    <Pantalla>
      <EncabezadoMarca titulo="Bienvenido" subtitulo="Paga tu pasaje acercando el teléfono" />

      {USE_MOCKS && (
        <BannerAviso
          titulo="Modo de prueba"
          mensaje="Pasajero 04140000001 · Recolector 04140000002 · Clave 1234"
          icono="flask-outline"
        />
      )}

      <View style={styles.formulario}>
        <CampoFormulario
          etiqueta="Teléfono"
          icono="call-outline"
          value={telefono}
          onChangeText={setTelefono}
          placeholder="04141234567"
          keyboardType="phone-pad"
          maxLength={11}
          autoComplete="tel"
        />
        <CampoFormulario
          etiqueta="Clave"
          icono="lock-closed-outline"
          value={clave}
          onChangeText={setClave}
          placeholder="Tu clave"
          secureTextEntry
          onSubmitEditing={() => void entrar()}
        />
        {error && <AppText style={styles.error}>{error}</AppText>}
        <Boton titulo="Entrar" icono="log-in-outline" onPress={() => void entrar()} cargando={enviando} deshabilitado={!telefono || !clave} />
      </View>

      <Pressable onPress={() => navigation.navigate("Registro")} style={styles.enlace} accessibilityRole="link">
        <AppText style={styles.enlaceTexto}>
          ¿No tienes cuenta? <AppText style={styles.enlaceFuerte}>Regístrate</AppText>
        </AppText>
      </Pressable>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  formulario: { gap: 14 },
  error: { color: colors.error, textAlign: "center" },
  enlace: { alignItems: "center", paddingVertical: 8 },
  enlaceTexto: { color: colors.textoSuave },
  enlaceFuerte: { color: colors.primario, fontWeight: "700" },
});
