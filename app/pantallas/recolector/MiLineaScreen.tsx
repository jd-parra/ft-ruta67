import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { Tarjeta } from "@componentes/atoms/Tarjeta";
import { BannerAviso } from "@componentes/molecules/BannerAviso";
import { FilaTramo } from "@componentes/molecules/FilaTramo";
import { Pantalla } from "@componentes/templates/Pantalla";
import { obtenerPaquete } from "@nucleo/api/recolectorApi";
import { useAuth } from "@nucleo/auth/AuthContext";
import { esDomingoOFeriado, tabuladorVigente, tarifaCompleta } from "@nucleo/tarifas/calcularMonto";
import { colors, radius } from "@nucleo/theme";
import type { Categoria } from "@nucleo/types/auth";
import type { PaqueteRecolector, Tabulador } from "@nucleo/types/paquete";

const fecha = (iso: string) => new Date(iso).toLocaleDateString("es-VE", { day: "numeric", month: "long", year: "numeric" });

/** Mi línea (contrato sección 14): unidad, línea y tramos con sus tarifas. Solo lectura, sale del paquete. */
export function MiLineaScreen() {
  const { logout } = useAuth();
  const [paquete, setPaquete] = useState<PaqueteRecolector | null>(null);
  const [desactualizado, setDesactualizado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Sin internet devuelve el último paquete guardado.
  const cargar = useCallback(async () => {
    const r = await obtenerPaquete();
    setPaquete(r.paquete);
    setDesactualizado(r.desactualizado);
    setCargando(false);
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
    <Pantalla
      titulo="Mi línea"
      onRefrescar={() => void refrescar()}
      refrescando={refrescando}
      derecha={
        <Pressable onPress={() => void logout()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar sesión" style={styles.salir}>
          <Ionicons name="log-out-outline" size={22} color={colors.primarioOscuro} />
        </Pressable>
      }
    >
      {paquete ? (
        <Contenido paquete={paquete} desactualizado={desactualizado} />
      ) : cargando ? (
        <View style={styles.vacio}>
          <ActivityIndicator color={colors.primario} />
        </View>
      ) : (
        <Tarjeta style={styles.vacio}>
          <Ionicons name="cloud-offline-outline" size={32} color={colors.textoSuave} />
          <AppText style={styles.centro}>Conéctate a internet para descargar los datos de tu línea.</AppText>
          <Boton titulo="Reintentar" secundario icono="refresh" onPress={() => void refrescar()} />
        </Tarjeta>
      )}
    </Pantalla>
  );
}

function Contenido({ paquete, desactualizado }: { paquete: PaqueteRecolector; desactualizado: boolean }) {
  const { linea, unidad } = paquete;
  const ahora = new Date();
  const tab = tabuladorVigente(paquete.tabulador, paquete.tabuladorProximo, ahora);
  const proximo = paquete.tabuladorProximo && paquete.tabuladorProximo !== tab ? paquete.tabuladorProximo : null;
  const conRecargo = tab.recargoDomingoFeriado > 0;
  const recargoHoy = conRecargo && esDomingoOFeriado(ahora, paquete.feriados);

  return (
    <>
      <View style={styles.cabecera}>
        <AppText style={styles.etiquetaClara}>{linea.tipo === "urbana" ? "Línea urbana" : "Línea suburbana"}</AppText>
        <AppText style={styles.nombreLinea}>{linea.nombre}</AppText>
        <View style={styles.datosUnidad}>
          <Dato icono="bus-outline" texto={`Placa ${unidad.placa}`} />
          <Dato icono="pricetag-outline" texto={`Unidad ${unidad.codigo}`} />
          <Dato icono="git-branch-outline" texto={`${linea.tramos.length} ${linea.tramos.length === 1 ? "ruta" : "rutas"}`} />
        </View>
      </View>

      {desactualizado && (
        <BannerAviso
          tono="aviso"
          icono="cloud-offline-outline"
          titulo="Sin conexión"
          mensaje={`Mostrando los datos guardados el ${fecha(paquete.generadoEn)}.`}
        />
      )}

      {recargoHoy && (
        <BannerAviso
          tono="aviso"
          icono="calendar-outline"
          titulo="Hoy hay recargo"
          mensaje={`Domingo o feriado: se cobra un ${Math.round(tab.recargoDomingoFeriado * 100)} % más que lo que ves abajo.`}
        />
      )}

      {proximo && (
        <BannerAviso
          tono="info"
          icono="pricetag-outline"
          titulo="Cambio de tarifa"
          mensaje={`Desde el ${fecha(proximo.vigenteDesde)} se cobra con un tabulador nuevo. La app lo aplica sola.`}
        />
      )}

      <View style={styles.seccion}>
        <AppText variant="subtitulo">Rutas y tarifas</AppText>
        <Tarjeta style={styles.lista}>
          {linea.tramos.map((t, i) => {
            const base = tarifaCompleta(linea, t, tab);
            return (
              <View key={t.codigo} style={i > 0 && styles.separador}>
                <FilaTramo nombre={t.nombre} km={t.km} montos={montosPorCategoria(base, tab)} />
              </View>
            );
          })}
        </Tarjeta>
        <AppText variant="etiqueta" style={styles.nota}>
          {tab.fuente} · vigente desde el {fecha(tab.vigenteDesde)}
          {conRecargo ? ` · domingos y feriados +${Math.round(tab.recargoDomingoFeriado * 100)} %` : ""}
        </AppText>
      </View>
    </>
  );
}

/** Misma fórmula que el cobro (sección 7), sin el recargo de domingo. */
function montosPorCategoria(base: number, tab: Tabulador): Record<Categoria, number> {
  const monto = (c: Categoria) => Math.round(base * (1 - tab.descuentos[c]));
  return { general: monto("general"), estudiante: monto("estudiante"), exonerado: monto("exonerado") };
}

function Dato({ icono, texto }: { icono: keyof typeof Ionicons.glyphMap; texto: string }) {
  return (
    <View style={styles.dato}>
      <Ionicons name={icono} size={14} color={colors.blanco} />
      <AppText style={styles.datoTexto}>{texto}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  salir: { padding: 8, borderRadius: radius.pill, backgroundColor: colors.primarioClaro },
  cabecera: { backgroundColor: colors.primario, borderRadius: radius.lg, padding: 20, gap: 4 },
  etiquetaClara: { color: colors.primarioClaro, fontSize: 13, fontWeight: "600" },
  nombreLinea: { color: colors.blanco, fontSize: 26, fontWeight: "800" },
  datosUnidad: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  dato: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  datoTexto: { color: colors.blanco, fontSize: 13, fontWeight: "600" },
  seccion: { gap: 10 },
  lista: { paddingVertical: 2 },
  separador: { borderTopWidth: 1, borderTopColor: colors.borde },
  nota: { textAlign: "center" },
  vacio: { alignItems: "center", gap: 12, paddingVertical: 32 },
  centro: { textAlign: "center" },
});
