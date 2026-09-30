import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { boletosRestantes, hceSoportado, iniciarPago } from "@nucleo/hce/servicioPago";
import type { ReciboLocal } from "@nucleo/almacen/recibos";
import { renovarBoletos } from "@nucleo/boletos/renovarBoletos";
import { subirRecibos } from "@nucleo/sync/subirRecibos";

/** Activa la tarjeta emulada solo con la pantalla enfocada y la app en primer plano. */
export function usePagoHce(version = 0) {
  const enfocada = useIsFocused();
  const [enPrimerPlano, setEnPrimerPlano] = useState(AppState.currentState === "active");
  const [activo, setActivo] = useState(false);
  const [restantes, setRestantes] = useState(0);
  const [ultimoRecibo, setUltimoRecibo] = useState<ReciboLocal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => setEnPrimerPlano(s === "active"));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!enfocada || !enPrimerPlano) return;
    let detener: (() => Promise<void>) | null = null;
    let cancelado = false;

    boletosRestantes().then(setRestantes);
    // Con internet trae boletos nuevos antes de activar el HCE; sin internet paga con los guardados.
    subirRecibos()
      .catch(() => undefined)
      .then(() => renovarBoletos())
      .catch(() => undefined)
      .then(() => {
        if (cancelado) return null;
        void boletosRestantes().then(setRestantes);
        return iniciarPago((recibos) => {
          setUltimoRecibo(recibos[recibos.length - 1]);
          void boletosRestantes().then(setRestantes);
          // Confirma el cobro en el backend (§19). Sin conexión se reintenta al volver a Inicio o Pagar.
          void subirRecibos().catch(() => undefined);
        });
      })
      .then((d) => {
        if (!d) return;
        if (cancelado) return void d();
        detener = d;
        setActivo(true);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));

    return () => {
      cancelado = true;
      setActivo(false);
      void detener?.();
    };
    // `version` reinicia la sesión cuando cambian los boletos (p. ej. al cargar uno de prueba).
  }, [enfocada, enPrimerPlano, version]);

  return { activo, restantes, ultimoRecibo, error, soportado: hceSoportado() };
}
