import { useEffect, useRef, useState } from "react";
import { NativeModules, Pressable, StyleSheet, TurboModuleRegistry, View } from "react-native";
import type { WebView as WebViewType } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { formatearBs } from "@componentes/formato";
import { colors, radius, sombra } from "@nucleo/theme";
import type { UnidadMapa } from "@nucleo/types/mapa";

// Centro de Mérida (tarea 3 del frontend).
export const CENTRO_MERIDA = { lat: 8.5897, lng: -71.1561 };

// react-native-webview lanza error al importarse si el APK no lo trae (build viejo).
export const mapaDisponible = (TurboModuleRegistry.get("RNCWebViewModule") ?? NativeModules.RNCWebViewModule) != null;
const cargarWebView = (): typeof WebViewType => require("react-native-webview").WebView;

/** Recorrido de una ruta para dibujar en morado (lo marca la central en el panel). */
export interface TrazoRuta {
  lineaNombre: string;
  tramoNombre: string;
  /** Pasaje completo según la gaceta, céntimos. */
  tarifa: number;
  trazo: [number, number][];
}

interface Props {
  unidades: UnidadMapa[];
  /** Recorridos a dibujar; al cambiar `enfoque` el mapa también se acerca a ellos. */
  trazos?: TrazoRuta[];
  /** Cuando cambia, el mapa se acerca a las unidades visibles (p. ej. al elegir una línea). */
  enfoque?: string;
  /** Código de la unidad del recolector: se dibuja resaltada. */
  miUnidad?: number | null;
  /** Ubicación del teléfono (punto azul). */
  miUbicacion?: { lat: number; lng: number } | null;
}

/** Mapa Leaflet (teselas de OpenStreetMap, sin clave) dentro de un WebView, con un autobús por unidad. */
export function MapaUnidades({ unidades, trazos = [], enfoque, miUnidad = null, miUbicacion = null }: Props) {
  const WebView = useRef(cargarWebView()).current;
  const web = useRef<WebViewType>(null);
  const [listo, setListo] = useState(false);
  const enfoqueAplicado = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!listo) return;
    const ajustar = enfoque !== enfoqueAplicado.current;
    enfoqueAplicado.current = enfoque;
    web.current?.injectJavaScript(`window.actualizar(${JSON.stringify(unidades)}, ${ajustar}, ${JSON.stringify(miUnidad)}); true;`);
  }, [listo, unidades, enfoque, miUnidad]);

  // Los recorridos van antes que las unidades: el encuadre de las unidades (si hay) manda.
  const enfoqueTrazos = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!listo) return;
    const ajustar = enfoque !== enfoqueTrazos.current && unidades.length === 0;
    enfoqueTrazos.current = enfoque;
    const lista = trazos.map((t) => ({ ...t, precio: formatearBs(t.tarifa) }));
    web.current?.injectJavaScript(`window.trazos(${JSON.stringify(lista)}, ${ajustar}); true;`);
  }, [listo, trazos, enfoque, unidades.length]);

  useEffect(() => {
    if (!listo || !miUbicacion) return;
    web.current?.injectJavaScript(`window.miUbicacion(${miUbicacion.lat}, ${miUbicacion.lng}); true;`);
  }, [listo, miUbicacion]);

  return (
    <View style={styles.contenedor}>
      <WebView
        ref={web}
        source={{ html: HTML, baseUrl: "https://pasaje.local/" }}
        originWhitelist={["*"]}
        onMessage={(e) => e.nativeEvent.data === "listo" && setListo(true)}
        style={styles.web}
      />
      <View style={styles.botones}>
        {miUbicacion && (
          <BotonMapa icono="navigate" etiqueta="Centrar en mi ubicación" onPress={() => web.current?.injectJavaScript("window.centrarEnMi(); true;")} />
        )}
        {miUnidad != null && (
          <BotonMapa icono="bus" etiqueta="Centrar en mi unidad" onPress={() => web.current?.injectJavaScript("window.centrarEnMiUnidad(); true;")} />
        )}
        <BotonMapa icono="locate-outline" etiqueta="Centrar en Mérida" onPress={() => web.current?.injectJavaScript("window.centrar(); true;")} />
      </View>
    </View>
  );
}

function BotonMapa({ icono, etiqueta, onPress }: { icono: keyof typeof Ionicons.glyphMap; etiqueta: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.boton, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={etiqueta}>
      <Ionicons name={icono} size={22} color={colors.primarioOscuro} />
    </Pressable>
  );
}

// Morado de la marca para los recorridos (mismo que el panel).
const COLOR_TRAZO = "#7C3AED";

// Un color fijo por línea (por nombre, que es lo que trae /mapa/unidades).
const COLORES_LINEA = ["#6D28D9", "#0E7490", "#C2410C", "#15803D", "#BE185D", "#1D4ED8", "#A16207"];

const HTML = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #mapa { margin: 0; height: 100%; background: ${colors.fondo}; }
  .unidad { display: flex; align-items: center; gap: 6px; transform: translate(-16px, -16px); white-space: nowrap; }
  .bus { width: 32px; height: 32px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35); box-sizing: border-box; display: flex; align-items: center; justify-content: center; }
  .bus svg { width: 16px; height: 16px; fill: #fff; }
  .mia .bus { width: 40px; height: 40px; border-width: 4px; box-shadow: 0 0 0 4px rgba(109,40,217,.35), 0 1px 6px rgba(0,0,0,.4); }
  .mia { transform: translate(-20px, -20px); }
  .etiqueta { background: #fff; border-radius: 10px; padding: 3px 8px; box-shadow: 0 1px 4px rgba(0,0,0,.2); font: 12px -apple-system, Roboto, sans-serif; color: ${colors.texto}; line-height: 1.25; }
  .etiqueta b { display: block; }
  .yo { width: 18px; height: 18px; border-radius: 50%; background: #2563EB; border: 3px solid #fff; box-shadow: 0 0 0 6px rgba(37,99,235,.25); box-sizing: border-box; }
  .leaflet-popup-content { font: 13px -apple-system, Roboto, sans-serif; margin: 10px 12px; }
  .leaflet-popup-content b { font-size: 15px; }
  .suave { color: ${colors.textoSuave}; }
</style>
</head>
<body>
<div id="mapa"></div>
<script>
  var centro = [${CENTRO_MERIDA.lat}, ${CENTRO_MERIDA.lng}];
  var COLORES = ${JSON.stringify(COLORES_LINEA)};
  var BUS = '<svg viewBox="0 0 24 24"><path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm1.5-6H6V6h12v5z"/></svg>';

  var mapa = L.map('mapa', { zoomControl: false }).setView(centro, 14);
  // Teselas oficiales de OpenStreetMap: sin clave (CARTO empezó a pedir una).
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(mapa);

  // Recorridos de las rutas en morado, debajo de los autobuses.
  var capaTrazos = L.layerGroup().addTo(mapa);
  window.trazos = function (lista, ajustar) {
    capaTrazos.clearLayers();
    var puntos = [];
    lista.forEach(function (t) {
      var linea = L.polyline(t.trazo, { color: '${COLOR_TRAZO}', weight: 6, opacity: 0.8 }).addTo(capaTrazos);
      linea.bindPopup('<b>' + esc(t.lineaNombre) + '</b><br>' + esc(t.tramoNombre) +
        '<br><span class="suave">Pasaje ' + esc(t.precio) + '</span>');
      puntos = puntos.concat(t.trazo);
    });
    if (ajustar && puntos.length) mapa.fitBounds(puntos, { padding: [40, 40], maxZoom: 15 });
  };

  var marcadores = {};
  var datos = {};
  var miUnidad = null;
  var yo = null;

  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function colorDe(nombre) {
    var h = 0;
    for (var i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0;
    return COLORES[h % COLORES.length];
  }
  function haceCuanto(iso) {
    var s = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
    if (s < 60) return 'hace ' + s + ' s';
    return 'hace ' + Math.round(s / 60) + ' min';
  }
  function icono(u) {
    var mia = u.unidadCodigo === miUnidad;
    return L.divIcon({
      className: '', iconSize: null,
      html: '<div class="unidad' + (mia ? ' mia' : '') + '">' +
            '<div class="bus" style="background:' + colorDe(u.lineaNombre) + '">' + BUS + '</div>' +
            '<div class="etiqueta"><b>' + (mia ? 'Tu unidad' : esc(u.placa)) + '</b>' + esc(u.lineaNombre) + '</div></div>'
    });
  }
  function detalle(u) {
    return '<b>' + esc(u.placa) + '</b><br>' + esc(u.lineaNombre) +
           '<br><span class="suave">Unidad ' + u.unidadCodigo + ' · ' + haceCuanto(u.actualizadoEn) + '</span>';
  }

  // Desliza el marcador en 1 s en vez de saltar a la nueva posición.
  function mover(m, destino) {
    var origen = m.getLatLng();
    if (origen.lat === destino[0] && origen.lng === destino[1]) return;
    var inicio = performance.now();
    if (m._anim) cancelAnimationFrame(m._anim);
    function paso(t) {
      var k = Math.min(1, (t - inicio) / 1000);
      k = k * (2 - k);
      m.setLatLng([origen.lat + (destino[0] - origen.lat) * k, origen.lng + (destino[1] - origen.lng) * k]);
      if (k < 1) m._anim = requestAnimationFrame(paso);
    }
    m._anim = requestAnimationFrame(paso);
  }

  window.actualizar = function (unidades, ajustar, codigoMiUnidad) {
    var cambioMia = codigoMiUnidad !== miUnidad;
    miUnidad = codigoMiUnidad;
    var vivas = {};
    unidades.forEach(function (u) {
      vivas[u.unidadCodigo] = true;
      var previo = datos[u.unidadCodigo];
      datos[u.unidadCodigo] = u;
      var m = marcadores[u.unidadCodigo];
      if (m) {
        mover(m, [u.lat, u.lng]);
        if (cambioMia || !previo || previo.placa !== u.placa || previo.lineaNombre !== u.lineaNombre) m.setIcon(icono(u));
        if (cambioMia) m.setZIndexOffset(u.unidadCodigo === miUnidad ? 1000 : 0);
        m.setPopupContent(detalle(u));
      } else {
        m = L.marker([u.lat, u.lng], { icon: icono(u), zIndexOffset: u.unidadCodigo === miUnidad ? 1000 : 0 }).addTo(mapa);
        m.bindPopup(detalle(u));
        // El "hace cuánto" se calcula al abrir, no cuando llegó el dato.
        m.on('popupopen', function () { m.setPopupContent(detalle(datos[u.unidadCodigo])); });
        marcadores[u.unidadCodigo] = m;
      }
    });
    Object.keys(marcadores).forEach(function (k) {
      if (!vivas[k]) { mapa.removeLayer(marcadores[k]); delete marcadores[k]; delete datos[k]; }
    });
    if (ajustar && unidades.length) {
      mapa.fitBounds(unidades.map(function (u) { return [u.lat, u.lng]; }), { padding: [60, 60], maxZoom: 15 });
    }
  };

  window.miUbicacion = function (lat, lng) {
    if (yo) { mover(yo, [lat, lng]); return; }
    yo = L.marker([lat, lng], { icon: L.divIcon({ className: '', iconSize: [18, 18], html: '<div class="yo"></div>' }), zIndexOffset: 2000 }).addTo(mapa);
  };
  window.centrar = function () { mapa.setView(centro, 14); };
  window.centrarEnMi = function () { if (yo) mapa.setView(yo.getLatLng(), 16); };
  window.centrarEnMiUnidad = function () {
    var m = marcadores[miUnidad];
    if (m) { mapa.setView(m.getLatLng(), 16); m.openPopup(); }
  };
  window.ReactNativeWebView.postMessage('listo');
</script>
</body>
</html>`;

const styles = StyleSheet.create({
  contenedor: { flex: 1, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.primarioClaro },
  web: { flex: 1, backgroundColor: colors.fondo },
  botones: { position: "absolute", right: 12, bottom: 12, gap: 10 },
  boton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.blanco,
    alignItems: "center",
    justifyContent: "center",
    ...sombra,
  },
});
