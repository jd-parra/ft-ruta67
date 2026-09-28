import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { Chip } from "@componentes/atoms/Chip";
import { IconoCirculo } from "@componentes/atoms/IconoCirculo";
import { Tarjeta } from "@componentes/atoms/Tarjeta";
import { bsACentimos, formatearBs } from "@componentes/formato";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { CampoFormulario } from "@componentes/molecules/CampoFormulario";
import { Pantalla } from "@componentes/templates/Pantalla";
import { mensajeDeError } from "@nucleo/api/errores";
import { recargar } from "@nucleo/api/pasajeroApi";
import { useAuth } from "@nucleo/auth/AuthContext";
import type { PasajeroNav } from "@nucleo/navigation/types";
import { colors } from "@nucleo/theme";
import type { Billetera } from "@nucleo/types/billetera";
import { useBilletera } from "@hooks/useBilletera";

const MONTOS_RAPIDOS = [50000, 100000, 200000]; // 500, 1000 y 2000 Bs en céntimos
const MAXIMO = 10_000_000; // §19: máximo 100.000,00 Bs por recarga

/** Recarga de saldo (fase 1: simulada, se confirma al instante). */
export function RecargarScreen() {
  const navigation = useNavigation<PasajeroNav>();
  const { sesion } = useAuth();
  const { billetera } = useBilletera();
  const [rapido, setRapido] = useState<number | null>(100000);
  const [libre, setLibre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ monto: number; billetera: Billetera } | null>(null);

  const monto = libre ? bsACentimos(libre) : rapido;
  const errorMonto =
    libre && monto === null ? "Monto inválido" : monto !== null && monto > MAXIMO ? `Máximo ${formatearBs(MAXIMO)} por recarga` : null;
  const valido = monto !== null && monto > 0 && !errorMonto;

  // Si por algún motivo no hay pantalla anterior, vuelve igual al Inicio.
  const volver = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("Tabs", { screen: "Inicio" }));

  const confirmar = async () => {
    if (!valido || monto === null) return;
    setEnviando(true);
    setError(null);
    try {
      const r = await recargar(monto, sesion!.usuario.categoria);
      setResultado({ monto, billetera: r.billetera });
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo recargar"));
    } finally {
      setEnviando(false);
    }
  };

  if (resultado) {
    return (
      <Pantalla pie={<Boton titulo="Listo" icono="checkmark" onPress={volver} />}>
        <View style={styles.exito}>
          <IconoCirculo nombre="checkmark" color={colors.blanco} fondo={colors.exito} tamano={88} />
          <AppText variant="titulo" style={styles.centro}>¡Recarga confirmada!</AppText>
          <AppText style={[styles.centro, styles.suave]}>Agregaste {formatearBs(resultado.monto)} a tu saldo</AppText>
          <Tarjeta style={styles.nuevoSaldo}>
            <AppText variant="etiqueta">Saldo disponible</AppText>
            <AppText variant="cifra" style={{ color: colors.primarioOscuro }}>
              {formatearBs(resultado.billetera.saldoDisponible)}
            </AppText>
          </Tarjeta>
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla
      titulo="Recargar saldo"
      subtitulo={billetera ? `Disponible: ${formatearBs(billetera.saldoDisponible)}` : " "}
      onAtras={volver}
      pie={
        <Boton
          titulo={valido && monto !== null ? `Recargar ${formatearBs(monto)}` : "Elige un monto"}
          icono="wallet-outline"
          onPress={() => void confirmar()}
          deshabilitado={!valido}
          cargando={enviando}
        />
      }
    >
      <Tarjeta style={styles.seccion}>
        <AppText variant="subtitulo">Montos rápidos</AppText>
        <View style={styles.chips}>
          {MONTOS_RAPIDOS.map((m) => (
            <Chip
              key={m}
              texto={formatearBs(m).replace(",00", "")}
              activo={!libre && rapido === m}
              onPress={() => {
                setRapido(m);
                setLibre("");
              }}
            />
          ))}
        </View>
      </Tarjeta>

      <Tarjeta style={styles.seccion}>
        <CampoFormulario
          etiqueta="Otro monto (Bs)"
          icono="cash-outline"
          value={libre}
          onChangeText={(t) => setLibre(t.replace(/[^\d.,]/g, ""))}
          placeholder="Ej. 750"
          keyboardType="decimal-pad"
          error={errorMonto}
          ayuda={`Hasta ${formatearBs(MAXIMO)}`}
        />
      </Tarjeta>

      <BannerAviso
        icono="flask-outline"
        titulo="Recarga simulada"
        mensaje="En esta versión el saldo se acredita al instante. El pago móvil llega más adelante."
      />
      {error && <AppText style={[styles.centro, { color: colors.error }]}>{error}</AppText>}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  exito: { alignItems: "center", gap: 12, marginTop: 48 },
  centro: { textAlign: "center" },
  suave: { color: colors.textoSuave },
  nuevoSaldo: { alignSelf: "stretch", alignItems: "center", gap: 4, marginTop: 12 },
});
