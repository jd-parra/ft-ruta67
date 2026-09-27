import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { CampoFormulario } from "@componentes/molecules/CampoFormulario";
import { SelectorCategoria } from "@componentes/molecules/SelectorCategoria";
import { Pantalla } from "@componentes/templates/Pantalla";
import { mensajeDeError } from "@nucleo/api/errores";
import { useAuth } from "@nucleo/auth/AuthContext";
import type { AuthNav } from "@nucleo/navigation/types";
import { colors } from "@nucleo/theme";
import type { Categoria, ErrorApi } from "@nucleo/types/auth";

type Campo = "nombre" | "telefono" | "clave";
type Errores = Partial<Record<Campo, string>>;

// Mismas reglas que el backend (auth/esquemas.js), para avisar antes de enviar.
function validar(nombre: string, telefono: string, clave: string): Errores {
  const e: Errores = {};
  if (nombre.trim().length < 2) e.nombre = "Escribe tu nombre";
  if (!/^04\d{9}$/.test(telefono.trim())) e.telefono = "Debe tener 11 dígitos y empezar por 04";
  if (clave.length < 4) e.clave = "Mínimo 4 caracteres";
  return e;
}

/** Registro de pasajeros (contrato 6.1: solo crea pasajeros). */
export function RegistroScreen() {
  const { registrar } = useAuth();
  const navigation = useNavigation<AuthNav>();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [clave, setClave] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("general");
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const crear = async () => {
    const e = validar(nombre, telefono, clave);
    setErrores(e);
    setErrorGeneral(null);
    if (Object.keys(e).length) return;

    setEnviando(true);
    try {
      // Al registrarse entra directo: el navegador cambia solo al modo pasajero.
      await registrar({ nombre: nombre.trim(), telefono: telefono.trim(), clave, categoria });
    } catch (err) {
      // VALIDACION trae el error de cada campo en `detalle`.
      const detalle = (err as { response?: { data?: ErrorApi } }).response?.data?.error.detalle;
      if (Array.isArray(detalle)) {
        const porCampo: Errores = {};
        for (const d of detalle as { campo: string; mensaje: string }[]) {
          if (d.campo === "nombre" || d.campo === "telefono" || d.campo === "clave") porCampo[d.campo] = d.mensaje;
        }
        setErrores(porCampo);
      }
      setErrorGeneral(mensajeDeError(err, "No se pudo crear la cuenta"));
      setEnviando(false);
    }
  };

  const limpiar = (campo: Campo) => errores[campo] && setErrores((e) => ({ ...e, [campo]: undefined }));

  return (
    <Pantalla titulo="Crear cuenta" subtitulo="Solo te toma un minuto" onAtras={() => navigation.goBack()}>
      <View style={styles.seccion}>
        <CampoFormulario
          etiqueta="Nombre y apellido"
          icono="person-outline"
          value={nombre}
          onChangeText={(t) => {
            setNombre(t);
            limpiar("nombre");
          }}
          placeholder="Ana Pérez"
          autoCapitalize="words"
          autoComplete="name"
          error={errores.nombre}
        />
        <CampoFormulario
          etiqueta="Teléfono"
          icono="call-outline"
          value={telefono}
          onChangeText={(t) => {
            setTelefono(t.replace(/\D/g, ""));
            limpiar("telefono");
          }}
          placeholder="04141234567"
          keyboardType="phone-pad"
          maxLength={11}
          autoComplete="tel"
          error={errores.telefono}
          ayuda="Con él inicias sesión"
        />
        <CampoFormulario
          etiqueta="Clave"
          icono="lock-closed-outline"
          value={clave}
          onChangeText={(t) => {
            setClave(t);
            limpiar("clave");
          }}
          placeholder="Mínimo 4 caracteres"
          secureTextEntry
          error={errores.clave}
        />
      </View>

      <View style={styles.seccion}>
        <AppText variant="subtitulo">¿Qué tarifa te corresponde?</AppText>
        <SelectorCategoria valor={categoria} onChange={setCategoria} />
        {categoria !== "general" && (
          <BannerAviso
            tono="aviso"
            icono="hourglass-outline"
            titulo="Quedará pendiente de verificación"
            mensaje="La central revisará tu carnet. Mientras tanto pagas la tarifa general."
          />
        )}
      </View>

      {errorGeneral && <AppText style={styles.error}>{errorGeneral}</AppText>}
      <Boton titulo="Crear cuenta" icono="person-add-outline" onPress={() => void crear()} cargando={enviando} />

      <Pressable onPress={() => navigation.goBack()} style={styles.enlace} accessibilityRole="link">
        <AppText style={styles.enlaceTexto}>
          ¿Ya tienes cuenta? <AppText style={styles.enlaceFuerte}>Inicia sesión</AppText>
        </AppText>
      </Pressable>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: 12 },
  error: { color: colors.error, textAlign: "center" },
  enlace: { alignItems: "center", paddingVertical: 8 },
  enlaceTexto: { color: colors.textoSuave },
  enlaceFuerte: { color: colors.primario, fontWeight: "700" },
});
