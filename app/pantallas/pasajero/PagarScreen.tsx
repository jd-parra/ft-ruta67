import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { CampoTexto } from "@componentes/atoms/CampoTexto";
import { Tarjeta } from "@componentes/atoms/Tarjeta";
import { formatearBs, formatearFechaHora } from "@componentes/formato";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { CirculoNfc } from "@componentes/molecules/CirculoNfc";
import { FilaLista } from "@componentes/molecules/FilaLista";
import { QrPago } from "@componentes/organisms/QrPago";
import { Pantalla } from "@componentes/templates/Pantalla";
import { agregarBoletos } from "@nucleo/boletos/almacenBoletos";
import { apartarBoletoQr } from "@nucleo/boletos/boletoQr";
import { textoQr } from "@nucleo/qr/cobroQr";
import { usePagoHce } from "@hooks/usePagoHce";
import { colors, radius } from "@nucleo/theme";

// Diseño de Jose sobre la lógica de Andy (usePagoHce): el HCE solo responde con esta pantalla abierta.
export function PagarScreen() {
  const [version, setVersion] = useState(0);
  const [pegado, setPegado] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [sinBoletoQr, setSinBoletoQr] = useState(false);
  const { activo, restantes, ultimoRecibo, error, soportado } = usePagoHce(version);

  const mostrarQr = async () => {
    const raw = await apartarBoletoQr();
    setSinBoletoQr(!raw);
    if (!raw) return;
    setQr(textoQr(raw));
    setVersion((v) => v + 1); // el boleto apartado sale de la lista del NFC
  };

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
    ? { titulo: "Paga con QR", detalle: "Este teléfono no tiene NFC: muestra tu QR y el recolector lo escanea." }
    : !activo
      ? { titulo: "Preparando…", detalle: "Activando el pago por NFC" }
      : restantes === 0
        ? { titulo: "No tienes boletos", detalle: "Conéctate a internet y recarga saldo para obtener boletos." }
        : { titulo: "Acerca tu teléfono", detalle: "Pon la parte de atrás junto al teléfono del recolector" };

  return (
    <Pantalla titulo="Pagar" subtitulo="Mantén esta pantalla abierta al subir">
      <CirculoNfc activo={listo} icono={!soportado ? "qr-code-outline" : listo ? "phone-portrait-outline" : "hourglass-outline"} />

      <View style={styles.textos}>
        <AppText variant="titulo" style={styles.centro}>{estado.titulo}</AppText>
        <AppText style={[styles.centro, styles.suave]}>{estado.detalle}</AppText>
      </View>

      <View style={[styles.boletos, restantes === 0 && styles.boletosVacio]}>
        <Ionicons name={restantes === 0 ? "alert-circle-outline" : "checkmark-circle-outline"} size={16} color={restantes === 0 ? colors.error : colors.primarioOscuro} />
        <AppText style={[styles.boletosTexto, restantes === 0 && { color: colors.error }]}>
          {restantes === 0 ? "Sin boletos" : "Listo para pagar"}
        </AppText>
      </View>

      <Boton
        titulo="Pagar con QR"
        icono="qr-code-outline"
        secundario={soportado}
        onPress={() => void mostrarQr()}
      />
      {sinBoletoQr && (
        <BannerAviso tono="aviso" icono="alert-circle-outline" titulo="No tienes boletos" mensaje="Conéctate a internet y recarga saldo para obtener boletos." />
      )}

      {error && <BannerAviso tono="error" icono="alert-circle-outline" titulo="No se pudo activar el pago" mensaje={error} />}

      {ultimoRecibo && (
        <Tarjeta style={styles.recibo}>
          <FilaLista
            icono="checkmark"
            colorIcono={colors.blanco}
            fondoIcono={colors.exito}
            titulo="¡Pago registrado!"
            subtitulo={`Ruta ${ultimoRecibo.tramoCodigo} · Unidad ${ultimoRecibo.unidadCodigo}`}
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
      <QrPago texto={qr} onCerrar={() => setQr(null)} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  textos: { gap: 6, marginTop: -8 },
  centro: { textAlign: "center" },
  suave: { color: colors.textoSuave },
  boletos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
