import { useCallback, useState, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { IconoCirculo } from "@componentes/atoms/IconoCirculo";
import { Tarjeta } from "@componentes/atoms/Tarjeta";
import { formatearBs, formatearFechaHora } from "@componentes/formato";
import { FilaLista } from "@componentes/molecules/FilaLista";
import { Segmentado } from "@componentes/molecules/Segmentado";
import { Pantalla } from "@componentes/templates/Pantalla";
import type { ReciboLocal } from "@nucleo/almacen/recibos";
import { mensajeDeError } from "@nucleo/api/errores";
import { listarMovimientos, listarViajes, obtenerLineas } from "@nucleo/api/pasajeroApi";
import { colors } from "@nucleo/theme";
import type { Movimiento } from "@nucleo/types/billetera";
import type { Linea } from "@nucleo/types/paquete";

type Vista = "viajes" | "movimientos";

const MOVIMIENTO: Record<
  Movimiento["tipo"],
  { titulo: string; icono: keyof typeof Ionicons.glyphMap; color: string; fondo: string }
> = {
  recarga: { titulo: "Recarga", icono: "add-circle-outline", color: colors.exito, fondo: colors.exitoClaro },
  reserva: { titulo: "Boletos emitidos", icono: "ticket-outline", color: colors.primario, fondo: colors.primarioClaro },
  cobro: { titulo: "Viaje pagado", icono: "bus-outline", color: colors.primarioOscuro, fondo: colors.primarioClaro },
  liberacion: { titulo: "Devolución de reserva", icono: "arrow-undo-outline", color: colors.exito, fondo: colors.exitoClaro },
};

/** Historial (contrato sección 14): viajes desde los recibos locales + movimientos del backend. */
export function HistorialScreen() {
  const [vista, setVista] = useState<Vista>("viajes");
  const [viajes, setViajes] = useState<ReciboLocal[] | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);
  const [errorMovimientos, setErrorMovimientos] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    // Los viajes son locales: se muestran aunque no haya conexión.
    const [v, l, m] = await Promise.allSettled([listarViajes(), obtenerLineas(), listarMovimientos(20)]);
    setViajes(v.status === "fulfilled" ? v.value : []);
    if (l.status === "fulfilled") setLineas(l.value);
    if (m.status === "fulfilled") {
      setMovimientos(m.value);
      setErrorMovimientos(null);
    } else {
      setErrorMovimientos(mensajeDeError(m.reason, "No se pudieron cargar los movimientos"));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar])
  );

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  return (
    <Pantalla titulo="Historial" onRefrescar={() => void refrescar()} refrescando={refrescando}>
      <Segmentado<Vista>
        opciones={[
          { valor: "viajes", texto: "Viajes" },
          { valor: "movimientos", texto: "Movimientos" },
        ]}
        valor={vista}
        onChange={setVista}
      />

      {vista === "viajes" ? (
        <ListaViajes viajes={viajes} lineas={lineas} />
      ) : (
        <ListaMovimientos movimientos={movimientos} error={errorMovimientos} onReintentar={() => void refrescar()} />
      )}
    </Pantalla>
  );
}

function ListaViajes({ viajes, lineas }: { viajes: ReciboLocal[] | null; lineas: Linea[] }) {
  if (!viajes) return <Cargando />;
  if (!viajes.length) {
    return <Vacio icono="bus-outline" titulo="Aún no tienes viajes" mensaje="Cuando pagues un pasaje aparecerá aquí, aunque no tengas internet." />;
  }
  return (
    <Tarjeta style={styles.lista}>
      {viajes.map((v, i) => {
        const linea = lineas.find((l) => l.codigo === v.lineaCodigo);
        const tramo = linea?.tramos.find((t) => t.codigo === v.tramoCodigo);
        return (
          <View key={v.bid} style={i > 0 && styles.separador}>
            <FilaLista
              icono="bus-outline"
              titulo={linea?.nombre ?? `Línea ${v.lineaCodigo}`}
              subtitulo={`${tramo?.nombre ?? `Tramo ${v.tramoCodigo}`} · Unidad ${v.unidadCodigo}`}
              valor={`−${formatearBs(v.monto)}`}
              detalleValor={formatearFechaHora(v.ocurridoEn)}
            />
          </View>
        );
      })}
    </Tarjeta>
  );
}

function ListaMovimientos({ movimientos, error, onReintentar }: { movimientos: Movimiento[] | null; error: string | null; onReintentar: () => void }) {
  if (error && !movimientos) {
    return (
      <Vacio icono="cloud-offline-outline" titulo="Sin conexión" mensaje={error}>
        <Boton titulo="Reintentar" secundario icono="refresh" onPress={onReintentar} />
      </Vacio>
    );
  }
  if (!movimientos) return <Cargando />;
  if (!movimientos.length) {
    return <Vacio icono="receipt-outline" titulo="Sin movimientos" mensaje="Tus recargas y pagos aparecerán aquí." />;
  }
  return (
    <Tarjeta style={styles.lista}>
      {movimientos.map((m, i) => {
        const t = MOVIMIENTO[m.tipo];
        // El cobro sale de lo reservado (monto 0): no cambia el disponible (§19).
        const valor = m.tipo === "cobro" ? "Con boleto" : `${m.monto > 0 ? "+" : "−"}${formatearBs(Math.abs(m.monto))}`;
        return (
          <View key={m.id} style={i > 0 && styles.separador}>
            <FilaLista
              icono={t.icono}
              colorIcono={t.color}
              fondoIcono={t.fondo}
              titulo={t.titulo}
              subtitulo={formatearFechaHora(m.creadoEn)}
              valor={valor}
              colorValor={m.monto > 0 ? colors.exito : colors.texto}
              detalleValor={`Saldo ${formatearBs(m.saldoDisponibleDespues)}`}
            />
          </View>
        );
      })}
    </Tarjeta>
  );
}

function Cargando() {
  return (
    <View style={styles.vacio}>
      <ActivityIndicator color={colors.primario} />
    </View>
  );
}

function Vacio({ icono, titulo, mensaje, children }: { icono: keyof typeof Ionicons.glyphMap; titulo: string; mensaje: string; children?: ReactNode }) {
  return (
    <View style={styles.vacio}>
      <IconoCirculo nombre={icono} tamano={64} />
      <AppText variant="subtitulo">{titulo}</AppText>
      <AppText style={styles.mensajeVacio}>{mensaje}</AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { paddingVertical: 4 },
  separador: { borderTopWidth: 1, borderTopColor: colors.borde },
  vacio: { alignItems: "center", gap: 10, paddingVertical: 48, paddingHorizontal: 24 },
  mensajeVacio: { textAlign: "center", color: colors.textoSuave },
});
