import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Boton } from "@componentes/atoms/Boton";
import { Tarjeta } from "@componentes/atoms/Tarjeta";
import { formatearBs, formatearFechaHora } from "@componentes/formato";
import { EstadoCargando, EstadoVacio } from "@componentes/molecules/EstadoVacio";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { FilaLista } from "@componentes/molecules/FilaLista";
import { Segmentado } from "@componentes/molecules/Segmentado";
import { Pantalla } from "@componentes/templates/Pantalla";
import type { ReciboLocal } from "@nucleo/almacen/recibos";
import { mensajeDeError } from "@nucleo/api/errores";
import { listarMovimientos, listarViajes, obtenerLineas } from "@nucleo/api/pasajeroApi";
import { movimientosVisibles } from "@nucleo/billetera/movimientosVisibles";
import { colors } from "@nucleo/theme";
import type { Movimiento } from "@nucleo/types/billetera";
import type { Linea } from "@nucleo/types/paquete";

type Vista = "viajes" | "movimientos";

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
          { valor: "movimientos", texto: "Recargas y pagos" },
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
  if (!viajes) return <EstadoCargando />;
  if (!viajes.length) {
    return <EstadoVacio icono="bus-outline" titulo="Aún no tienes viajes" mensaje="Cuando pagues un pasaje aparecerá aquí, aunque no tengas internet." />;
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
              subtitulo={`${tramo?.nombre ?? `Ruta ${v.tramoCodigo}`} · Unidad ${v.unidadCodigo}`}
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
      <EstadoVacio icono="cloud-offline-outline" titulo="Sin conexión" mensaje={error}>
        <Boton titulo="Reintentar" secundario icono="refresh" onPress={onReintentar} />
      </EstadoVacio>
    );
  }
  if (!movimientos) return <EstadoCargando />;
  const visibles = movimientosVisibles(movimientos);
  if (!visibles.length) {
    return <EstadoVacio icono="receipt-outline" titulo="Sin movimientos" mensaje="Tus recargas y pagos aparecerán aquí." />;
  }
  return (
    <View style={styles.bloque}>
      <BannerAviso
        tono="info"
        icono="information-circle-outline"
        titulo="¿Cómo se cobra?"
        mensaje="Cada viaje descuenta de tu saldo la tarifa de su ruta según la Gaceta Oficial. Los pagos por QR aparecen aquí cuando el recolector se conecta."
      />
      <Tarjeta style={styles.lista}>
        {visibles.map((m, i) => (
          <View key={m.id} style={i > 0 && styles.separador}>
            {m.tipo === "recarga" ? (
              <FilaLista
                icono="add-circle-outline"
                colorIcono={colors.exito}
                fondoIcono={colors.exitoClaro}
                titulo="Recarga"
                subtitulo={formatearFechaHora(m.fecha)}
                valor={`+${formatearBs(m.monto)}`}
                colorValor={colors.exito}
              />
            ) : (
              <FilaLista
                icono="bus-outline"
                colorIcono={colors.primarioOscuro}
                fondoIcono={colors.primarioClaro}
                titulo={m.lineaNombre ?? "Viaje pagado"}
                subtitulo={[m.tramoNombre, m.unidadCodigo && `Unidad ${m.unidadCodigo}`].filter(Boolean).join(" · ") || "Con boleto"}
                valor={m.monto === null ? "Con boleto" : `−${formatearBs(m.monto)}`}
                detalleValor={formatearFechaHora(m.fecha)}
              />
            )}
          </View>
        ))}
      </Tarjeta>
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: { gap: 12 },
  lista: { paddingVertical: 4 },
  separador: { borderTopWidth: 1, borderTopColor: colors.borde },
});
