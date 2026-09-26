import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { boletosRestantes, hceSoportado, iniciarPago } from "./servicioPago";
import type { ReciboLocal } from "@nucleo/almacen/recibos";

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
    iniciarPago((recibos) => {
      setUltimoRecibo(recibos[recibos.length - 1]);
      void boletosRestantes().then(setRestantes);
    })
      .then((d) => {
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
