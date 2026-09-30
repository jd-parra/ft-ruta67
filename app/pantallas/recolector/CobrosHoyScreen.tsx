import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { Tarjeta } from "@componentes/atoms/Tarjeta";
import { CATEGORIAS, formatearBs, formatearFechaHora } from "@componentes/formato";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { EstadoCargando, EstadoVacio } from "@componentes/molecules/EstadoVacio";
import { FilaLista } from "@componentes/molecules/FilaLista";
import { ResumenCobros } from "@componentes/molecules/ResumenCobros";
import { fechaDe, SelectorDia } from "@componentes/molecules/SelectorDia";
import { Pantalla } from "@componentes/templates/Pantalla";
import { cobrosPendientes } from "@nucleo/almacen/colaCobros";
import { leerPaquete } from "@nucleo/almacen/paquete";
import { mensajeDeError } from "@nucleo/api/errores";
import { cobrosDelDia } from "@nucleo/api/recolectorApi";
import { sincronizarCobros } from "@nucleo/sync/cobros";
import { colors, radius } from "@nucleo/theme";
import type { CobrosDelDia, FilaCobro } from "@nucleo/types/cobros";
import type { Tramo } from "@nucleo/types/paquete";

const fechaLarga = (diasAtras: number) =>
  fechaDe(diasAtras).toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" });

/** Cobros del día (contrato sección 14): lo registrado en el backend + lo que sigue en cola_cobros. Permite ver días anteriores. */
export function CobrosHoyScreen() {
  const [diasAtras, setDiasAtras] = useState(0);
  const [dia, setDia] = useState<CobrosDelDia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendientes, setPendientes] = useState<FilaCobro[]>([]);
  const [tramos, setTramos] = useState<Tramo[]>([]);
  const [refrescando, setRefrescando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    // Los pendientes son locales: se muestran aunque no haya conexión.
    const [d, p, paquete] = await Promise.allSettled([cobrosDelDia(fechaDe(diasAtras)), cobrosPendientes(), leerPaquete()]);
    if (d.status === "fulfilled") {
      setDia(d.value);
      setError(null);
    } else {
      setError(mensajeDeError(d.reason, "No se pudieron cargar los cobros"));
    }
    if (p.status === "fulfilled") setPendientes(p.value);
    if (paquete.status === "fulfilled" && paquete.value) setTramos(paquete.value.linea.tramos);
  }, [diasAtras]);

  // Al cambiar de día se limpia la lista para no mostrar los cobros del día anterior mientras carga.
  useEffect(() => {
    setDia(null);
  }, [diasAtras]);

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

  const subirAhora = async () => {
    setSubiendo(true);
    await sincronizarCobros().catch(() => null);
    await cargar();
    setSubiendo(false);
  };

  const esHoy = diasAtras === 0;
  // Los pendientes son de hoy: todavía no están en el backend.
  const pendientesVisibles = esHoy ? pendientes : [];
  const totalPendiente = pendientesVisibles.reduce((s, c) => s + c.monto, 0);
  const nombreTramo = (codigo: number) => tramos.find((t) => t.codigo === codigo)?.nombre ?? `Ruta ${codigo}`;

  return (
    <Pantalla titulo="Cobros" subtitulo={fechaLarga(diasAtras)} onRefrescar={() => void refrescar()} refrescando={refrescando}>
      <SelectorDia diasAtras={diasAtras} onChange={setDiasAtras} />

      <View style={styles.resumen}>
        <AppText style={styles.resumenEtiqueta}>{esHoy ? "Total registrado hoy" : "Total registrado"}</AppText>
        <AppText variant="cifra" style={styles.resumenMonto}>{formatearBs(dia?.total ?? 0)}</AppText>
        <AppText style={styles.resumenDetalle}>
          {dia ? `${dia.cantidad} ${dia.cantidad === 1 ? "cobro" : "cobros"}` : "—"}
          {pendientesVisibles.length > 0 ? ` · ${formatearBs(totalPendiente)} sin subir` : ""}
        </AppText>
      </View>

      {pendientesVisibles.length > 0 && (
        <View style={styles.seccion}>
          <BannerAviso
            tono="aviso"
            icono="cloud-upload-outline"
            titulo={`${pendientesVisibles.length} ${pendientesVisibles.length === 1 ? "cobro sin subir" : "cobros sin subir"}`}
            mensaje="Están guardados en el teléfono. Se suben solos al tener conexión, o súbelos ahora."
          />
          <Tarjeta style={styles.lista}>
            {pendientesVisibles.map((c, i) => (
              <View key={c.bid} style={i > 0 && styles.separador}>
                <FilaLista
                  icono="cloud-upload-outline"
                  colorIcono={colors.aviso}
                  fondoIcono={colors.avisoClaro}
                  titulo={c.pasajeroNombre ?? CATEGORIAS[c.categoria].nombre}
                  subtitulo={`${nombreTramo(c.tramoCodigo)} · ${formatearFechaHora(c.ocurridoEn)}`}
                  valor={formatearBs(c.monto)}
                  detalleValor="Pendiente"
                />
              </View>
            ))}
          </Tarjeta>
          <Boton titulo="Subir ahora" secundario icono="cloud-upload-outline" cargando={subiendo} onPress={() => void subirAhora()} />
        </View>
      )}

      {dia && <ResumenCobros cobros={dia.cobros} />}

      <View style={styles.seccion}>
        <AppText variant="subtitulo">Registrados</AppText>
        <ListaCobros dia={dia} error={error} esHoy={esHoy} onReintentar={() => void refrescar()} />
      </View>
    </Pantalla>
  );
}

function ListaCobros({ dia, error, esHoy, onReintentar }: { dia: CobrosDelDia | null; error: string | null; esHoy: boolean; onReintentar: () => void }) {
  if (error && !dia) {
    return (
      <EstadoVacio icono="cloud-offline-outline" titulo="Sin conexión" mensaje={error}>
        <Boton titulo="Reintentar" secundario icono="refresh" onPress={onReintentar} />
      </EstadoVacio>
    );
  }
  if (!dia) return <EstadoCargando />;
  if (!dia.cobros.length) {
    return esHoy ? (
      <EstadoVacio icono="receipt-outline" titulo="Aún no hay cobros" mensaje="Los pasajes que cobres hoy aparecerán aquí." />
    ) : (
      <EstadoVacio icono="receipt-outline" titulo="Sin cobros" mensaje="No registraste cobros ese día." />
    );
  }
  return (
    <Tarjeta style={styles.lista}>
      {dia.cobros.map((c, i) => {
        const conflicto = c.estado === "conflicto";
        const categoria = CATEGORIAS[c.categoriaAplicada];
        // §19: el recibo del teléfono del pasajero confirma el cobro.
        const confirmado = c.confirmadoPor.includes("pasajero");
        return (
          <View key={c.id} style={i > 0 && styles.separador}>
            <FilaLista
              icono={conflicto ? "alert-circle-outline" : categoria.icono}
              colorIcono={conflicto ? colors.error : undefined}
              fondoIcono={conflicto ? colors.errorClaro : undefined}
              titulo={c.pasajeroNombre}
              subtitulo={`${categoria.nombre} · ${c.tramoNombre} · ${formatearFechaHora(c.ocurridoEn)}`}
              valor={c.monto === 0 ? "Gratis" : formatearBs(c.monto)}
              colorValor={conflicto ? colors.error : undefined}
              detalleValor={conflicto ? "Conflicto" : confirmado ? "✓ Confirmado" : "Sin confirmar"}
            />
          </View>
        );
      })}
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  resumen: { backgroundColor: colors.primario, borderRadius: radius.lg, padding: 20, gap: 2 },
  resumenEtiqueta: { color: colors.primarioClaro, fontSize: 13, fontWeight: "600" },
  resumenMonto: { color: colors.blanco },
  resumenDetalle: { color: colors.primarioClaro, fontSize: 14 },
  seccion: { gap: 10 },
  lista: { paddingVertical: 4 },
  separador: { borderTopWidth: 1, borderTopColor: colors.borde },
});
