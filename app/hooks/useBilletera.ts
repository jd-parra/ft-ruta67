import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { mensajeDeError } from "@nucleo/api/errores";
import { obtenerBilletera } from "@nucleo/api/pasajeroApi";
import { renovarBoletos } from "@nucleo/boletos/renovarBoletos";
import { subirRecibos } from "@nucleo/sync/subirRecibos";
import { useAuth } from "@nucleo/auth/AuthContext";
import type { Billetera } from "@nucleo/types/billetera";

/** Billetera del pasajero; se vuelve a pedir cada vez que la pantalla recibe el foco. */
export function useBilletera() {
  const { sesion } = useAuth();
  const categoria = sesion?.usuario.categoria ?? "general";
  const [billetera, setBilletera] = useState<Billetera | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    // Con internet: sube los recibos pendientes y deja los boletos listos para pagar después sin conexión.
    await subirRecibos().catch(() => undefined);
    await renovarBoletos().catch(() => undefined);
    try {
      setBilletera(await obtenerBilletera(categoria));
      setError(null);
    } catch (e) {
      setError(mensajeDeError(e, "No se pudo cargar tu saldo"));
    }
  }, [categoria]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar])
  );

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }, [cargar]);

  return { billetera, error, refrescando, refrescar };
}
