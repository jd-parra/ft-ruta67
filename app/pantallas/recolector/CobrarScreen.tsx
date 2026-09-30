import { StyleSheet, View } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { CirculoNfc } from "@componentes/molecules/CirculoNfc";
import { ContadorDia } from "@componentes/molecules/ContadorDia";
import { EstadoCargando } from "@componentes/molecules/EstadoVacio";
import { InterruptorTurno } from "@componentes/molecules/InterruptorTurno";
import { SelectorTramo } from "@componentes/molecules/SelectorTramo";
import { TarjetaResultado } from "@componentes/molecules/TarjetaResultado";
import { Pantalla } from "@componentes/templates/Pantalla";
import { useCobrador } from "@hooks/useCobrador";
import { useTurno } from "@hooks/useTurno";
import { colors } from "@nucleo/theme";

// Diseño de Jose sobre la lógica de Andy (useCobrador): el lector escucha mientras esta pantalla está abierta.
export function CobrarScreen() {
  const c = useCobrador();
  const turno = useTurno();

  const estado =
    c.nfc === false
      ? { icono: "close" as const, titulo: "NFC no disponible", detalle: "Enciende el NFC en los ajustes del teléfono para cobrar." }
      : !c.paquete
        ? { icono: "cloud-offline-outline" as const, titulo: "Sin datos de la línea", detalle: "Conéctate a internet para descargarlos." }
        : c.escuchando
          ? { icono: "scan-outline" as const, titulo: "Acerca el teléfono", detalle: "El cobro se hace solo al tocar el teléfono del pasajero" }
          : { icono: "hourglass-outline" as const, titulo: "Preparando…", detalle: "Activando el lector NFC" };

  return (
    <Pantalla
      titulo="Cobrar"
      subtitulo={c.paquete ? `${c.paquete.linea.nombre} · ${c.paquete.unidad.placa}` : undefined}
      pie={<ContadorDia cantidad={c.resumen.cantidad} total={c.resumen.total} />}
    >
      <InterruptorTurno
        enTurno={turno.enTurno}
        activando={turno.activando}
        error={turno.error}
        ultimoEnvio={turno.ultimoEnvio}
        onCambiar={turno.cambiar}
      />

      {c.desactualizado && (
        <BannerAviso tono="aviso" icono="cloud-offline-outline" titulo="Sin conexión" mensaje="Cobrando con los últimos datos guardados de tu línea." />
      )}

      {c.paquete ? (
        <View style={styles.seccion}>
          <AppText variant="etiqueta">Ruta a cobrar</AppText>
          <SelectorTramo tramos={c.paquete.linea.tramos} modo={c.modo} onChange={c.setModo} />
        </View>
      ) : (
        c.cargando && <EstadoCargando />
      )}

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
        !c.cargando && (
          <>
            <CirculoNfc activo={c.escuchando} icono={estado.icono} />
            <View style={styles.textos}>
              <AppText variant="titulo" style={styles.centro}>{estado.titulo}</AppText>
              <AppText style={[styles.centro, styles.suave]}>{estado.detalle}</AppText>
            </View>
          </>
        )
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: 6 },
  textos: { gap: 6, marginTop: -8 },
  centro: { textAlign: "center" },
  suave: { color: colors.textoSuave },
});
