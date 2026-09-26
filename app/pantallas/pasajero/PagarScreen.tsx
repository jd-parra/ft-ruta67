import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { CampoTexto } from "@componentes/atoms/CampoTexto";
import { agregarBoletos } from "@nucleo/boletos/almacenBoletos";
import { usePagoHce } from "@nucleo/hce/usePagoHce";
import { colors } from "@nucleo/theme";

// Versión mínima para probar el protocolo. Jose/Andy la rediseñan después (tarea 5).
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

  return (
    <View style={styles.root}>
      <AppText variant="titulo">Pagar</AppText>
      <AppText>
        {!soportado ? "Este teléfono no soporta HCE" : activo ? "📡 Acerca el teléfono al recolector" : "Inactivo"}
      </AppText>
      <AppText>🎫 {restantes} boletos listos</AppText>
      {error && <AppText style={{ color: colors.error }}>{error}</AppText>}
      {ultimoRecibo && (
        <AppText>
          ✅ Último cobro: tramo {ultimoRecibo.tramoCodigo} · {(ultimoRecibo.monto / 100).toFixed(2)} Bs
        </AppText>
      )}
      {__DEV__ && (
        <>
          <AppText variant="etiqueta">DEV: pegar boleto de prueba (base64url, `npm run boleto-prueba`)</AppText>
          <CampoTexto value={pegado} onChangeText={setPegado} placeholder="boleto base64url" autoCapitalize="none" />
          <Boton titulo="Cargar boleto" onPress={() => void cargar()} deshabilitado={!pegado} secundario />
          {msg && <AppText variant="etiqueta">{msg}</AppText>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, justifyContent: "center", padding: 24, gap: 12 } });
