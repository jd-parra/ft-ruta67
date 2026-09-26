import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { obtenerPaquete } from "@nucleo/api/recolectorApi";
import { cancelarLectura, leerCobro, nfcListo } from "@nucleo/nfc/lectorCobro";
import type { ResultadoCobro } from "@nucleo/nfc/ejecutarCobro";
import type { ModoTramo } from "@nucleo/tarifas/elegirTramo";
import type { PaqueteRecolector } from "@nucleo/types/paquete";
import { useAuth } from "@nucleo/auth/AuthContext";
import { colors } from "@nucleo/theme";

const ICONO = { general: "", estudiante: "🎓", exonerado: "👴" } as const;

// Versión mínima para probar el lector. La pantalla final (tarjeta de 3 s, «Corregir») es la tarea 5.
export function CobrarScreen() {
  const { logout } = useAuth();
  const [paquete, setPaquete] = useState<PaqueteRecolector | null>(null);
  const [desactualizado, setDesactualizado] = useState(false);
  const [modo, setModo] = useState<ModoTramo>({ tipo: "automatico" });
  const [comoGeneral, setComoGeneral] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [nfc, setNfc] = useState<boolean | null>(null);
  const [resultado, setResultado] = useState<ResultadoCobro | null>(null);

  // Fase 1: se refresca al abrir Cobrar (contrato 6.3).
  useEffect(() => {
    void obtenerPaquete().then((r) => {
      setPaquete(r.paquete);
      setDesactualizado(r.desactualizado);
    });
    void nfcListo().then(setNfc);
    return () => void cancelarLectura();
  }, []);

  const leer = async () => {
    if (!paquete) return;
    setResultado(null);
    setLeyendo(true);
    const r = await leerCobro({ paquete, modo, cobrarComoGeneral: comoGeneral });
    setLeyendo(false);
    setResultado(r);
    setComoGeneral(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <AppText variant="titulo">Cobrar</AppText>
      {!paquete ? (
        <AppText>Sin paquete: conéctate a internet para descargar tu línea.</AppText>
      ) : (
        <>
          <AppText>{paquete.linea.nombre} · unidad {paquete.unidad.placa}</AppText>
          {desactualizado && <AppText variant="etiqueta">Sin conexión: usando el último paquete guardado</AppText>}

          <AppText variant="etiqueta">Tramo</AppText>
          <View style={styles.fila}>
            <Boton titulo="Automático" secundario={modo.tipo !== "automatico"} onPress={() => setModo({ tipo: "automatico" })} />
            {paquete.linea.tramos.map((t) => (
              <Boton
                key={t.codigo}
                titulo={t.nombre}
                secundario={!(modo.tipo === "fijo" && modo.tramoCodigo === t.codigo)}
                onPress={() => setModo({ tipo: "fijo", tramoCodigo: t.codigo })}
              />
            ))}
          </View>

          <Boton titulo={comoGeneral ? "✔ Cobrar como general" : "Cobrar como general"} secundario={!comoGeneral} onPress={() => setComoGeneral((v) => !v)} />
          {nfc === false && <AppText style={{ color: colors.error }}>NFC apagado o no disponible</AppText>}
          <Boton titulo={leyendo ? "Acerca el teléfono del pasajero…" : "Leer pasajero"} onPress={() => void leer()} deshabilitado={leyendo || nfc === false} />
          {leyendo && <Boton titulo="Cancelar" secundario onPress={() => void cancelarLectura()} />}
        </>
      )}

      {resultado &&
        (resultado.ok ? (
          <View style={[styles.tarjeta, { borderColor: colors.exito }]}>
            <AppText variant="titulo" style={{ color: colors.exito }}>✅ {(resultado.cobro.monto / 100).toFixed(2)} Bs</AppText>
            <AppText>{ICONO[resultado.categoriaAplicada]} {resultado.categoriaAplicada}</AppText>
            <AppText>{resultado.tramo.nombre}</AppText>
            {!resultado.reciboEnviado && <AppText variant="etiqueta">El pasajero recibirá su recibo al sincronizar</AppText>}
          </View>
        ) : (
          <View style={[styles.tarjeta, { borderColor: colors.error }]}>
            <AppText variant="titulo" style={{ color: colors.error }}>❌ {resultado.codigo}</AppText>
            <AppText>{resultado.mensaje}</AppText>
          </View>
        ))}

      <Boton titulo="Cerrar sesión" secundario onPress={() => void logout()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: 24, paddingTop: 48, gap: 12 },
  fila: { gap: 8 },
  tarjeta: { borderWidth: 2, borderRadius: 12, padding: 16, gap: 4, backgroundColor: colors.blanco },
});
