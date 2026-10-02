import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { CirculoNfc } from "@componentes/molecules/CirculoNfc";
import { ContadorDia } from "@componentes/molecules/ContadorDia";
import { EstadoCargando } from "@componentes/molecules/EstadoVacio";
import { InterruptorTurno } from "@componentes/molecules/InterruptorTurno";
import { SelectorTramo } from "@componentes/molecules/SelectorTramo";
import { TarjetaResultado } from "@componentes/molecules/TarjetaResultado";
import { EscanerQr } from "@componentes/organisms/EscanerQr";
import { Pantalla } from "@componentes/templates/Pantalla";
import { useCobrador } from "@hooks/useCobrador";
import { useTurno } from "@hooks/useTurno";
import { calcularMonto, tabuladorVigente } from "@nucleo/tarifas/calcularMonto";
import { colors } from "@nucleo/theme";
import type { Tramo } from "@nucleo/types/paquete";

// Diseño de Jose sobre la lógica de Andy (useCobrador): el lector escucha mientras esta pantalla está abierta.
// El círculo central abre la cámara para cobrar el QR de los pasajeros sin NFC.
export function CobrarScreen() {
  const c = useCobrador();
  const turno = useTurno();
  const [escaneando, setEscaneando] = useState(false);

  const paquete = c.paquete;
  const precio = useCallback(
    (tramo: Tramo) => {
      const ahora = new Date();
      const base = {
        linea: paquete!.linea,
        tramo,
        tabulador: tabuladorVigente(paquete!.tabulador, paquete!.tabuladorProximo, ahora),
        ocurridoEn: ahora,
        feriados: paquete!.feriados,
      };
      return {
        completo: calcularMonto({ ...base, categoria: "general" }),
        descuento: calcularMonto({ ...base, categoria: "estudiante" }),
      };
    },
    [paquete]
  );

  const estado =
    !c.paquete
      ? { titulo: "Sin datos de la línea", detalle: "Conéctate a internet para descargarlos." }
      : c.nfc === "sin_nfc"
        ? { titulo: "Cobra por QR", detalle: "Este teléfono no tiene NFC. Toca el círculo y escanea el QR del pasajero." }
        : c.nfc === "apagado"
          ? { titulo: "El NFC está apagado", detalle: "Enciéndelo para cobrar con un toque. Mientras tanto puedes cobrar por QR." }
          : c.escuchando
            ? { titulo: "Acerca el teléfono", detalle: "El cobro se hace solo al tocar. Si el pasajero no tiene NFC, toca el círculo para escanear su QR." }
            : { titulo: "Preparando…", detalle: "Activando el lector NFC" };

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
          <SelectorTramo tramos={c.paquete.linea.tramos} modo={c.modo} onChange={c.setModo} precio={precio} />
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
            <CirculoNfc
              activo={c.escuchando}
              icono="qr-code-outline"
              pista={c.paquete ? "Escanear QR" : undefined}
              onPress={c.paquete ? () => setEscaneando(true) : undefined}
            />
            <View style={styles.textos}>
              <AppText variant="titulo" style={styles.centro}>{estado.titulo}</AppText>
              <AppText style={[styles.centro, styles.suave]}>{estado.detalle}</AppText>
            </View>
            {c.nfc === "apagado" && (
              <Boton titulo="Activar NFC" icono="radio-outline" onPress={() => void c.activarNfc()} />
            )}
          </>
        )
      )}
      <EscanerQr visible={escaneando} onCerrar={() => setEscaneando(false)} onLeido={(texto) => void c.cobrarQr(texto)} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: 6 },
  textos: { gap: 6, marginTop: -8 },
  centro: { textAlign: "center" },
  suave: { color: colors.textoSuave },
});
