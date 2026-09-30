import { useCallback, useState } from "react";
import { requireOptionalNativeModule } from "expo";
import { useFocusEffect } from "@react-navigation/native";

// Igual que useTurno: un APK sin expo-location no trae el GPS y la librería no se debe importar.
const gpsDisponible = requireOptionalNativeModule("ExpoLocation") != null;
const cargarLocation = (): typeof import("expo-location") => require("expo-location");

/** Ubicación del teléfono mientras la pantalla está enfocada (para el punto azul del mapa). null si no hay permiso. */
export function useMiUbicacion() {
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!gpsDisponible) return;
      const Location = cargarLocation();
      let cancelado = false;
      let sub: { remove(): void } | null = null;

      (async () => {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted || cancelado) return;
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 10, timeInterval: 5000 },
          (p) => setUbicacion({ lat: p.coords.latitude, lng: p.coords.longitude })
        );
        if (cancelado) sub.remove();
      })().catch(() => undefined);

      return () => {
        cancelado = true;
        sub?.remove();
      };
    }, [])
  );

  return ubicacion;
}
