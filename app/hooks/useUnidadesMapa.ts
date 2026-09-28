import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { mensajeDeError } from "@nucleo/api/errores";
import { obtenerUnidadesMapa } from "@nucleo/api/mapaApi";
import { useAuth } from "@nucleo/auth/AuthContext";
import { conectarSocket } from "@nucleo/realtime/socket";
import type { UbicacionUnidad, UnidadMapa } from "@nucleo/types/mapa";

// Igual que el backend: una unidad sin reportar en 5 min deja de estar en ruta.
const VIGENCIA_MS = 5 * 60_000;

/** Unidades del mapa: GET /mapa/unidades al abrir + «unidad:ubicacion» en tiempo real (sección 11). */
export function useUnidadesMapa() {
  const { sesion } = useAuth();
  const [unidades, setUnidades] = useState<UnidadMapa[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const unidadesRef = useRef(unidades);
  unidadesRef.current = unidades;

  const cargar = useCallback(async () => {
    try {
      setUnidades(await obtenerUnidadesMapa());
      setError(null);
    } catch (e) {
      setError(mensajeDeError(e, "No se pudieron cargar las unidades"));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar])
  );

  useEffect(() => {
    const socket = sesion ? conectarSocket(sesion.token) : null;
    if (!socket) return;
    const alMoverse = ({ unidadCodigo, lat, lng }: UbicacionUnidad) => {
      // El evento no trae placa ni línea: una unidad nueva obliga a pedir la lista otra vez.
      if (!unidadesRef.current?.some((u) => u.unidadCodigo === unidadCodigo)) {
        void cargar();
        return;
      }
      const actualizadoEn = new Date().toISOString();
      setUnidades((prev) => prev?.map((u) => (u.unidadCodigo === unidadCodigo ? { ...u, lat, lng, actualizadoEn } : u)) ?? prev);
    };
    socket.on("unidad:ubicacion", alMoverse);
    return () => void socket.off("unidad:ubicacion", alMoverse);
  }, [sesion, cargar]);

  useEffect(() => {
    const id = setInterval(() => {
      setUnidades((prev) => prev?.filter((u) => Date.now() - Date.parse(u.actualizadoEn) < VIGENCIA_MS) ?? prev);
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  return { unidades, error, recargar: cargar };
}
