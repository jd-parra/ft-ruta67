import { ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { ContadorDia } from "@componentes/molecules/ContadorDia";
import { SelectorTramo } from "@componentes/molecules/SelectorTramo";
import { TarjetaResultado } from "@componentes/molecules/TarjetaResultado";
import { useCobrador } from "@nucleo/nfc/useCobrador";
import { useAuth } from "@nucleo/auth/AuthContext";
import { colors } from "@nucleo/theme";

export function CobrarScreen() {
  const { logout } = useAuth();
  const c = useCobrador();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <AppText variant="titulo">Cobrar</AppText>

        {!c.paquete ? (
          <AppText>{c.cargando ? "Cargando…" : "Sin paquete: conéctate a internet para descargar tu línea."}</AppText>
        ) : (
          <>
            <AppText>{c.paquete.linea.nombre} · unidad {c.paquete.unidad.placa}</AppText>
            {c.desactualizado && <AppText variant="etiqueta">Sin conexión: usando el último paquete guardado</AppText>}
            <SelectorTramo tramos={c.paquete.linea.tramos} modo={c.modo} onChange={c.setModo} />
          </>
        )}

        {c.nfc === false && <AppText style={{ color: colors.error }}>El NFC está apagado o no está disponible</AppText>}

        {c.tarjeta ? (
          <TarjetaResultado
            tarjeta={c.tarjeta}
            tramos={c.paquete?.linea.tramos ?? []}
            eligiendo={c.corrigiendo && !c.procesando}
            procesando={c.procesando}
            onCorregir={c.elegirCorreccion}
            onElegirTramo={(tramoCodigo) => void c.corregirTarjeta({ tramoCodigo })}
            onCancelarCorreccion={c.cancelarCorreccion}
            onComoGeneral={() => void c.corregirTarjeta({ comoGeneral: true })}
          />
        ) : (
          c.escuchando && <AppText style={styles.escuchando}>📡 Acerca el teléfono del pasajero</AppText>
        )}

        <Boton titulo="Cerrar sesión" secundario onPress={() => void logout()} />
      </ScrollView>

      <View style={styles.pie}>
        <ContadorDia cantidad={c.resumen.cantidad} total={c.resumen.total} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.fondo },
  contenido: { padding: 24, paddingTop: 48, gap: 12 },
  escuchando: { fontSize: 20, textAlign: "center", paddingVertical: 32, color: colors.primarioOscuro },
  pie: { padding: 16 },
});
