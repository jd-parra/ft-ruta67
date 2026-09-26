import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { CampoTexto } from "@componentes/atoms/CampoTexto";
import { Tarjeta } from "@componentes/atoms/Tarjeta";
import { formatearBs, formatearFechaHora } from "@componentes/formato";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { FilaLista } from "@componentes/molecules/FilaLista";
import { Pantalla } from "@componentes/templates/Pantalla";
import { agregarBoletos } from "@nucleo/boletos/almacenBoletos";
import { usePagoHce } from "@nucleo/hce/usePagoHce";
import { colors, radius } from "@nucleo/theme";

// Diseño de Jose sobre la lógica de Andy (usePagoHce): el HCE solo responde con esta pantalla abierta.
export function PagarScreen() {
  const [version, setVersion] = useState(0);
  const [pegado, setPegado] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const { activo, restantes, ultimoRecibo, error, soportado } = usePagoHce(version);

  const cargar = async () => {
    try {
      await agregarBoletos([pegado.trim()]);
      setPegado("");
      setMsg("Boleto cargado");
      setVersion((v) => v + 1);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const listo = soportado && activo && restantes > 0;
  const estado = !soportado
    ? { titulo: "Este teléfono no puede pagar por NFC", detalle: "Necesitas un Android con NFC. El pago por QR llega pronto." }
    : !activo
      ? { titulo: "Preparando…", detalle: "Activando el pago por NFC" }
      : restantes === 0
        ? { titulo: "No tienes boletos", detalle: "Conéctate a internet y recarga saldo para obtener boletos." }
        : { titulo: "Acerca tu teléfono", detalle: "Pon la parte de atrás junto al teléfono del recolector" };

  return (
    <Pantalla titulo="Pagar" subtitulo="Mantén esta pantalla abierta al subir">
      <View style={styles.zona}>
        <Pulso activo={listo} />
        <View style={[styles.circulo, !listo && styles.circuloInactivo]}>
          <Ionicons
            name={!soportado ? "close" : listo ? "phone-portrait-outline" : "hourglass-outline"}
            size={56}
            color={listo ? colors.blanco : colors.textoSuave}
          />
        </View>
      </View>

      <View style={styles.textos}>
        <AppText variant="titulo" style={styles.centro}>{estado.titulo}</AppText>
        <AppText style={[styles.centro, styles.suave]}>{estado.detalle}</AppText>
      </View>

      <View style={[styles.boletos, restantes === 0 && styles.boletosVacio]}>
        <AppText style={[styles.boletosTexto, restantes === 0 && { color: colors.error }]}>
          🎫 {restantes} {restantes === 1 ? "boleto listo" : "boletos listos"}
        </AppText>
      </View>

      {error && <BannerAviso tono="error" icono="alert-circle-outline" titulo="No se pudo activar el pago" mensaje={error} />}

      {ultimoRecibo && (
        <Tarjeta style={styles.recibo}>
          <FilaLista
            icono="checkmark"
            colorIcono={colors.blanco}
            fondoIcono={colors.exito}
            titulo="¡Pago registrado!"
            subtitulo={`Tramo ${ultimoRecibo.tramoCodigo} · Unidad ${ultimoRecibo.unidadCodigo}`}
            valor={formatearBs(ultimoRecibo.monto)}
            colorValor={colors.exito}
            detalleValor={formatearFechaHora(ultimoRecibo.ocurridoEn)}
          />
        </Tarjeta>
      )}

      {__DEV__ && (
        <Tarjeta style={styles.dev}>
          <AppText variant="etiqueta">DEV: pegar boleto de prueba (base64url, `pnpm dev:boleto`)</AppText>
          <CampoTexto value={pegado} onChangeText={setPegado} placeholder="boleto base64url" autoCapitalize="none" />
          <Boton titulo="Cargar boleto" onPress={() => void cargar()} deshabilitado={!pegado} secundario />
          {msg && <AppText variant="etiqueta">{msg}</AppText>}
        </Tarjeta>
      )}
    </Pantalla>
  );
}

/** Ondas que salen del círculo mientras el teléfono está listo para pagar. */
function Pulso({ activo }: { activo: boolean }) {
  const ondas = useRef([new Animated.Value(0), new Animated.Value(0)]).current;

  useEffect(() => {
    if (!activo) return;
    const animaciones = ondas.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 900),
          Animated.timing(v, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    animaciones.forEach((a) => a.start());
    return () => {
      animaciones.forEach((a) => a.stop());
      ondas.forEach((v) => v.setValue(0));
    };
  }, [activo, ondas]);

  if (!activo) return null;
  return (
    <>
      {ondas.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.onda,
            {
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
            },
          ]}
        />
      ))}
    </>
  );
}

const TAMANO = 140;

const styles = StyleSheet.create({
  zona: { height: TAMANO * 2, alignItems: "center", justifyContent: "center" },
  circulo: {
    width: TAMANO,
    height: TAMANO,
    borderRadius: TAMANO / 2,
    backgroundColor: colors.primario,
    alignItems: "center",
    justifyContent: "center",
  },
  circuloInactivo: { backgroundColor: colors.primarioClaro },
  onda: { position: "absolute", width: TAMANO, height: TAMANO, borderRadius: TAMANO / 2, backgroundColor: colors.acento },
  textos: { gap: 6, marginTop: -8 },
  centro: { textAlign: "center" },
  suave: { color: colors.textoSuave },
  boletos: {
    alignSelf: "center",
    backgroundColor: colors.primarioClaro,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  boletosVacio: { backgroundColor: colors.errorClaro },
  boletosTexto: { color: colors.primarioOscuro, fontWeight: "700" },
  recibo: { paddingVertical: 4 },
  dev: { gap: 10 },
});
