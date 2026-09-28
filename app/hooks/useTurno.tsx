import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { requireOptionalNativeModule } from "expo";
import { enviarUbicacion } from "@nucleo/api/recolectorApi";

const INTERVALO_MS = 30_000;

// Un APK compilado antes de instalar expo-location no trae el GPS: importarlo lanzaría error.
// Por eso se comprueba el módulo nativo y la librería se carga solo si existe.
const gpsDisponible = requireOptionalNativeModule("ExpoLocation") != null;
const cargarLocation = (): typeof import("expo-location") => require("expo-location");

interface Turno {
  /** false = hace falta un dev build nuevo. */
  disponible: boolean;
  enTurno: boolean;
  activando: boolean;
  error: string | null;
  ultimoEnvio: Date | null;
  cambiar: (activar: boolean) => void;
}

const TurnoContext = createContext<Turno | null>(null);

/**
 * «En turno» (contrato 6.3): mientras esté activo, POST /ubicaciones cada 30 s.
 * Vive por encima de las pestañas del recolector para no apagarse al cambiar de pantalla.
 * Fase 1: solo con la app abierta (sin ubicación en segundo plano).
 */
export function TurnoProvider({ children }: { children: ReactNode }) {
  const [enTurno, setEnTurno] = useState(false);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultimoEnvio, setUltimoEnvio] = useState<Date | null>(null);

  const cambiar = useCallback(async (activar: boolean) => {
    setError(null);
    if (!activar) {
      setEnTurno(false);
      return;
    }
    if (!gpsDisponible) {
      setError("Esta versión de la app no trae el GPS. Instala el build nuevo.");
      return;
    }
    setActivando(true);
    try {
      const { granted } = await cargarLocation().requestForegroundPermissionsAsync();
      if (granted) setEnTurno(true);
      else setError("Sin permiso de ubicación. Actívalo en los ajustes del teléfono.");
    } catch {
      setError("No se pudo activar la ubicación.");
    } finally {
      setActivando(false);
    }
  }, []);

  useEffect(() => {
    if (!enTurno) return;
    const Location = cargarLocation();
    let cancelado = false;

    const enviar = async () => {
      try {
        const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelado) return;
        await enviarUbicacion(coords.latitude, coords.longitude);
        if (cancelado) return;
        setUltimoEnvio(new Date());
        setError(null);
      } catch {
        if (!cancelado) setError("No se pudo enviar tu ubicación. Revisa el GPS y la conexión; se reintenta en 30 s.");
      }
    };

    void enviar();
    const id = setInterval(() => void enviar(), INTERVALO_MS);
    return () => {
      cancelado = true;
      clearInterval(id);
    };
  }, [enTurno]);

  return (
    <TurnoContext.Provider value={{ disponible: gpsDisponible, enTurno, activando, error, ultimoEnvio, cambiar: (a) => void cambiar(a) }}>
      {children}
    </TurnoContext.Provider>
  );
}

export function useTurno(): Turno {
  const t = useContext(TurnoContext);
  if (!t) throw new Error("useTurno debe usarse dentro de TurnoProvider");
  return t;
}
