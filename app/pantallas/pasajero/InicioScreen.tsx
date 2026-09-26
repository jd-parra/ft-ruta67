import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { Tarjeta } from "@componentes/atoms/Tarjeta";
import { CATEGORIAS } from "@componentes/formato";
import { AccesoRapido } from "@componentes/molecules/AccesoRapido";
import { BannerAviso, BannerDeAviso } from "@componentes/molecules/BannerAviso";
import { TarjetaSaldo } from "@componentes/organisms/TarjetaSaldo";
import { Pantalla } from "@componentes/templates/Pantalla";
import { useAuth } from "@nucleo/auth/AuthContext";
import type { PasajeroNav } from "@nucleo/navigation/types";
import { colors, radius } from "@nucleo/theme";
import { useBilletera } from "./useBilletera";

/** Inicio del pasajero (contrato sección 14): saldo, viajes estimados, boletos listos y avisos. */
export function InicioScreen() {
  const { sesion, logout } = useAuth();
  const navigation = useNavigation<PasajeroNav>();
  const { billetera, error, refrescando, refrescar } = useBilletera();
  const usuario = sesion!.usuario;
  const primerNombre = usuario.nombre.split(" ")[0];
  const pendiente = usuario.categoria !== "general" && !usuario.categoriaVerificada;

  return (
    <Pantalla
      titulo={`Hola, ${primerNombre}`}
      onRefrescar={() => void refrescar()}
      refrescando={refrescando}
      derecha={
        <Pressable onPress={() => void logout()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar sesión" style={styles.salir}>
          <Ionicons name="log-out-outline" size={22} color={colors.primarioOscuro} />
        </Pressable>
      }
    >
      <View style={styles.insignia}>
        <AppText style={styles.insigniaTexto}>
          {CATEGORIAS[usuario.categoria].emoji} {CATEGORIAS[usuario.categoria].nombre}
          {pendiente ? " · pendiente de verificación" : ""}
        </AppText>
      </View>

      {usuario.bloqueado && (
        <BannerAviso
          tono="error"
          icono="lock-closed-outline"
          titulo="Cuenta bloqueada"
          mensaje="Detectamos un boleto usado dos veces. Comunícate con la central."
        />
      )}

      {billetera ? (
        <TarjetaSaldo billetera={billetera} />
      ) : error ? (
        <Tarjeta style={styles.estado}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.textoSuave} />
          <AppText style={styles.centro}>{error}</AppText>
          <Boton titulo="Reintentar" secundario icono="refresh" onPress={() => void refrescar()} />
        </Tarjeta>
      ) : (
        <Tarjeta style={styles.estado}>
          <ActivityIndicator color={colors.primario} />
        </Tarjeta>
      )}

      <View style={styles.accesos}>
        <AccesoRapido icono="add-circle-outline" texto="Recargar" onPress={() => navigation.navigate("Recargar")} />
        <AccesoRapido icono="phone-portrait-outline" texto="Pagar" onPress={() => navigation.navigate("Pagar")} />
        <AccesoRapido icono="time-outline" texto="Historial" onPress={() => navigation.navigate("Historial")} />
      </View>

      {(pendiente || (billetera?.avisos.length ?? 0) > 0) && (
        <View style={styles.avisos}>
          <AppText variant="subtitulo">Avisos</AppText>
          {pendiente && (
            <BannerAviso
              tono="aviso"
              icono="hourglass-outline"
              titulo="Categoría en revisión"
              mensaje="La central está verificando tu carnet. Mientras tanto pagas la tarifa general."
            />
          )}
          {billetera?.avisos.map((a) => <BannerDeAviso key={a.id} aviso={a} />)}
        </View>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  salir: { padding: 8, borderRadius: radius.pill, backgroundColor: colors.primarioClaro },
  insignia: {
    alignSelf: "flex-start",
    marginTop: -12,
    backgroundColor: colors.primarioClaro,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  insigniaTexto: { color: colors.primarioOscuro, fontWeight: "600", fontSize: 13 },
  estado: { alignItems: "center", justifyContent: "center", gap: 12, minHeight: 180 },
  centro: { textAlign: "center" },
  accesos: { flexDirection: "row", gap: 12 },
  avisos: { gap: 10 },
});
