import { useEffect, useRef, useState } from "react";
import { NativeModules, Pressable, StyleSheet, TurboModuleRegistry, View } from "react-native";
import type { WebView as WebViewType } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, sombra } from "@nucleo/theme";
import type { UnidadMapa } from "@nucleo/types/mapa";

// Centro de Mérida (tarea 3 del frontend).
export const CENTRO_MERIDA = { lat: 8.5897, lng: -71.1561 };

// react-native-webview lanza error al importarse si el APK no lo trae (build viejo).
export const mapaDisponible = (TurboModuleRegistry.get("RNCWebViewModule") ?? NativeModules.RNCWebViewModule) != null;
const cargarWebView = (): typeof WebViewType => require("react-native-webview").WebView;

interface Props {
  unidades: UnidadMapa[];
  /** Cuando cambia, el mapa se acerca a las unidades visibles (p. ej. al elegir una línea). */
  enfoque?: string;
}

/** Mapa Leaflet (OpenStreetMap vía CARTO, sin clave) dentro de un WebView, con un marcador por unidad. */
export function MapaUnidades({ unidades, enfoque }: Props) {
  const WebView = useRef(cargarWebView()).current;
  const web = useRef<WebViewType>(null);
  const [listo, setListo] = useState(false);
  const enfoqueAplicado = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!listo) return;
    const ajustar = enfoque !== enfoqueAplicado.current;
    enfoqueAplicado.current = enfoque;
    web.current?.injectJavaScript(`window.actualizar(${JSON.stringify(unidades)}, ${ajustar}); true;`);
  }, [listo, unidades, enfoque]);

  return (
    <View style={styles.contenedor}>
      <WebView
        ref={web}
        source={{ html: HTML, baseUrl: "https://pasaje.local/" }}
        originWhitelist={["*"]}
        onMessage={(e) => e.nativeEvent.data === "listo" && setListo(true)}
        style={styles.web}
      />
      <Pressable
        onPress={() => web.current?.injectJavaScript("window.centrar(); true;")}
        style={({ pressed }) => [styles.centrar, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel="Centrar en Mérida"
      >
        <Ionicons name="locate-outline" size={22} color={colors.primarioOscuro} />
      </Pressable>
    </View>
  );
}

const HTML = `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html, body, #mapa { margin: 0; height: 100%; background: ${colors.fondo}; }
  .unidad { display: flex; align-items: center; gap: 6px; transform: translate(-9px, -9px); white-space: nowrap; }
  .punto { width: 18px; height: 18px; border-radius: 50%; background: ${colors.primario}; border: 3px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.3); box-sizing: border-box; }
  .etiqueta { background: #fff; border-radius: 10px; padding: 4px 8px; box-shadow: 0 1px 4px rgba(0,0,0,.2); font: 12px -apple-system, Roboto, sans-serif; color: ${colors.texto}; line-height: 1.25; }
  .etiqueta b { display: block; color: ${colors.primarioOscuro}; }
</style>
</head>
<body>
<div id="mapa"></div>
<script>
  var centro = [${CENTRO_MERIDA.lat}, ${CENTRO_MERIDA.lng}];
  var mapa = L.map('mapa', { zoomControl: false }).setView(centro, 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 19, subdomains: 'abcd',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(mapa);

  var marcadores = {};
  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function icono(u) {
    return L.divIcon({
      className: '', iconSize: null,
      html: '<div class="unidad"><div class="punto"></div><div class="etiqueta"><b>' + esc(u.placa) + '</b>' + esc(u.lineaNombre) + '</div></div>'
    });
  }

  window.actualizar = function (unidades, ajustar) {
    var vivas = {};
    unidades.forEach(function (u) {
      vivas[u.unidadCodigo] = true;
      var m = marcadores[u.unidadCodigo];
      if (m) { m.setLatLng([u.lat, u.lng]); m.setIcon(icono(u)); }
      else { marcadores[u.unidadCodigo] = L.marker([u.lat, u.lng], { icon: icono(u) }).addTo(mapa); }
    });
    Object.keys(marcadores).forEach(function (k) {
      if (!vivas[k]) { mapa.removeLayer(marcadores[k]); delete marcadores[k]; }
    });
    if (ajustar && unidades.length) {
      mapa.fitBounds(unidades.map(function (u) { return [u.lat, u.lng]; }), { padding: [60, 60], maxZoom: 15 });
    }
  };
  window.centrar = function () { mapa.setView(centro, 14); };
  window.ReactNativeWebView.postMessage('listo');
</script>
</body>
</html>`;

const styles = StyleSheet.create({
  contenedor: { flex: 1, borderRadius: radius.lg, overflow: "hidden", backgroundColor: colors.primarioClaro },
  web: { flex: 1, backgroundColor: colors.fondo },
  centrar: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.blanco,
    alignItems: "center",
    justifyContent: "center",
    ...sombra,
  },
});
