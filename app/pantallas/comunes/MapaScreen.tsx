import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { Chip } from "@componentes/atoms/Chip";
import { Tarjeta } from "@componentes/atoms/Tarjeta";
import { formatearFechaHora } from "@componentes/formato";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { EstadoCargando, EstadoVacio } from "@componentes/molecules/EstadoVacio";
import { FilaLista } from "@componentes/molecules/FilaLista";
import { MapaUnidades, mapaDisponible } from "@componentes/organisms/MapaUnidades";
import { useMiUbicacion } from "@hooks/useMiUbicacion";
import { useUnidadesMapa } from "@hooks/useUnidadesMapa";
import { leerPaquete } from "@nucleo/almacen/paquete";
import { obtenerLineas } from "@nucleo/api/pasajeroApi";
import { useAuth } from "@nucleo/auth/AuthContext";
import { colors } from "@nucleo/theme";
import type { UnidadMapa } from "@nucleo/types/mapa";

const TODAS = "Todas";

/** Mapa de unidades (contrato sección 14), compartido por los dos modos. El pasajero puede filtrar por línea. */
export function MapaScreen() {
  const { sesion } = useAuth();
  const esPasajero = sesion?.usuario.rol === "pasajero";
  const { unidades, error, recargar } = useUnidadesMapa();
  const [lineas, setLineas] = useState<string[]>([]);
  const [filtro, setFiltro] = useState(TODAS);
  const miUbicacion = useMiUbicacion();
  const [miUnidad, setMiUnidad] = useState<number | null>(null);

  // El recolector ve su propia unidad resaltada (sale del paquete guardado, sin pedir nada al backend).
  useEffect(() => {
    if (esPasajero) return;
    leerPaquete()
      .then((p) => setMiUnidad(p?.unidad.codigo ?? null))
      .catch(() => undefined);
  }, [esPasajero]);

  useEffect(() => {
    if (!esPasajero) return;
    obtenerLineas()
      .then((ls) => setLineas(ls.map((l) => l.nombre)))
      .catch(() => undefined);
  }, [esPasajero]);

  // /mapa/unidades trae el nombre de la línea, no su código: se filtra por nombre.
  const visibles = (unidades ?? []).filter((u) => filtro === TODAS || u.lineaNombre === filtro);
  const cantidad = unidades ? `${visibles.length} ${visibles.length === 1 ? "unidad en ruta" : "unidades en ruta"}` : "Buscando unidades…";

  return (
    <SafeAreaView style={styles.raiz} edges={["top"]}>
      <View style={styles.encabezado}>
        <AppText variant="titulo">Mapa</AppText>
        <AppText style={styles.suave}>{cantidad}</AppText>
      </View>

      {esPasajero && lineas.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtros} contentContainerStyle={styles.filtrosFila}>
          {[TODAS, ...lineas].map((l) => (
            <Chip key={l} texto={l} activo={filtro === l} onPress={() => setFiltro(l)} />
          ))}
        </ScrollView>
      )}

      <View style={styles.cuerpo}>
        {error && !unidades ? (
          <EstadoVacio icono="cloud-offline-outline" titulo="Sin conexión" mensaje={error}>
            <Boton titulo="Reintentar" secundario icono="refresh" onPress={() => void recargar()} />
          </EstadoVacio>
        ) : !mapaDisponible ? (
          <SinMapa unidades={unidades ? visibles : null} />
        ) : (
          <>
            <MapaUnidades unidades={visibles} enfoque={filtro} miUnidad={miUnidad} miUbicacion={miUbicacion} />
            {unidades && visibles.length === 0 && (
              <View style={styles.aviso}>
                <BannerAviso
                  titulo="No hay unidades en ruta"
                  mensaje={filtro === TODAS ? "Aparecerán cuando un recolector active «En turno»." : `Ninguna unidad de ${filtro} está en ruta ahora.`}
                  icono="bus-outline"
                />
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/** APK sin WebView (build viejo): la lista de unidades en lugar del mapa. */
function SinMapa({ unidades }: { unidades: UnidadMapa[] | null }) {
  return (
    <ScrollView contentContainerStyle={styles.sinMapa}>
      <BannerAviso tono="aviso" icono="map-outline" titulo="Actualiza la app para ver el mapa" mensaje="Esta versión no trae el mapa. Mientras tanto, estas son las unidades en ruta." />
      {!unidades ? (
        <EstadoCargando />
      ) : unidades.length === 0 ? (
        <EstadoVacio icono="bus-outline" titulo="No hay unidades en ruta" mensaje="Aparecerán cuando un recolector active «En turno»." />
      ) : (
        <Tarjeta style={styles.lista}>
          {unidades.map((u, i) => (
            <View key={u.unidadCodigo} style={i > 0 && styles.separador}>
              <FilaLista
                icono="bus-outline"
                titulo={u.placa}
                subtitulo={u.lineaNombre}
                valor={`${u.lat.toFixed(4)}, ${u.lng.toFixed(4)}`}
                detalleValor={formatearFechaHora(u.actualizadoEn)}
              />
            </View>
          ))}
        </Tarjeta>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colors.fondo },
  encabezado: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 2 },
  suave: { color: colors.textoSuave },
  filtros: { flexGrow: 0 },
  filtrosFila: { gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
  cuerpo: { flex: 1, paddingHorizontal: 20, paddingBottom: 16 },
  aviso: { position: "absolute", top: 12, left: 32, right: 32 },
  sinMapa: { gap: 16, paddingBottom: 16 },
  lista: { paddingVertical: 4 },
  separador: { borderTopWidth: 1, borderTopColor: colors.borde },
});
