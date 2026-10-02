import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { obtenerPaquete } from "@nucleo/api/recolectorApi";
import { avisarCobro } from "@nucleo/avisos/avisoCobro";
import { resumenDelDia } from "@nucleo/almacen/colaCobros";
import { useAuth } from "@nucleo/auth/AuthContext";
import { conectarSocket } from "@nucleo/realtime/socket";
import { corregir, sincronizarCobros } from "@nucleo/sync/cobros";
import type { ModoTramo } from "@nucleo/tarifas/elegirTramo";
import type { PaqueteRecolector } from "@nucleo/types/paquete";
import { abrirAjustesNfc, cancelarLectura, estadoNfc, leerCobro, type EstadoNfc } from "@nucleo/nfc/lectorCobro";
import { bidsCobrados, encolarCobro } from "@nucleo/almacen/colaCobros";
import { ejecutarCobroQr } from "@nucleo/qr/cobroQr";
import type { ResultadoCobro } from "@nucleo/nfc/ejecutarCobro";

export const SEGUNDOS_TARJETA = 3;

export type EstadoSubida = "subiendo" | "pendiente" | "ok" | "rechazado";

export interface Tarjeta {
  id: number;
  res: ResultadoCobro;
  bid: string | null;
  /** Solo llega tras sincronizar: el boleto firmado no lleva el nombre. */
  nombre: string | null;
  subida: EstadoSubida;
  mensajeSubida?: string;
}

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Todo el comportamiento de la pantalla Cobrar (contrato 9, «¿Qué tramo se cobra?»). */
export function useCobrador() {
  const { sesion } = useAuth();
  const enfocada = useIsFocused();
  const [enPrimerPlano, setEnPrimerPlano] = useState(AppState.currentState === "active");

  const [paquete, setPaquete] = useState<PaqueteRecolector | null>(null);
  const [desactualizado, setDesactualizado] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [nfc, setNfc] = useState<EstadoNfc | null>(null);
  const [modo, setModo] = useState<ModoTramo>({ tipo: "automatico" });
  const [tarjeta, setTarjeta] = useState<Tarjeta | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resumen, setResumen] = useState({ cantidad: 0, total: 0 });

  // El lector lee siempre el valor más reciente, sin reiniciarse.
  const paqueteRef = useRef(paquete);
  const modoRef = useRef(modo);
  paqueteRef.current = paquete;
  modoRef.current = modo;
  const idTarjeta = useRef(0);
  const cierreTarjeta = useRef<(() => void) | null>(null);

  const refrescarResumen = useCallback(() => void resumenDelDia().then(setResumen), []);

  const refrescarPaquete = useCallback(async () => {
    const r = await obtenerPaquete();
    setPaquete(r.paquete);
    setDesactualizado(r.desactualizado);
    setCargando(false);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => setEnPrimerPlano(s === "active"));
    return () => sub.remove();
  }, []);

  // Al abrir: paquete (si hay internet; si no, el último guardado), NFC, contador y cobros pendientes.
  useEffect(() => {
    void refrescarPaquete();
    refrescarResumen();
    void sincronizarCobros();
  }, [refrescarPaquete, refrescarResumen]);

  // «paquete:actualizado» (sección 11)
  useEffect(() => {
    const socket = sesion ? conectarSocket(sesion.token) : null;
    socket?.on("paquete:actualizado", refrescarPaquete);
    return () => void socket?.off("paquete:actualizado", refrescarPaquete);
  }, [sesion, refrescarPaquete]);

  // NFC al entrar y cada vez que vuelve al frente: así, si lo encendió en los ajustes, empieza a cobrar solo.
  useEffect(() => {
    if (enPrimerPlano) void estadoNfc().then(setNfc).catch(() => setNfc("sin_nfc"));
  }, [enPrimerPlano]);

  const mostrar = useCallback((t: Omit<Tarjeta, "id">) => {
    cierreTarjeta.current?.(); // un cobro por QR puede llegar con otra tarjeta abierta
    const id = ++idTarjeta.current;
    setTarjeta({ ...t, id });
    setEligiendo(false);
    return new Promise<void>((resolver) => {
      cierreTarjeta.current = resolver;
    });
  }, []);

  const cerrarTarjeta = useCallback(() => {
    setTarjeta(null);
    setEligiendo(false);
    cierreTarjeta.current?.();
    cierreTarjeta.current = null;
  }, []);

  // La tarjeta dura 3 s, salvo mientras se corrige.
  useEffect(() => {
    if (!tarjeta || eligiendo || procesando) return;
    const t = setTimeout(cerrarTarjeta, SEGUNDOS_TARJETA * 1000);
    return () => clearTimeout(t);
  }, [tarjeta?.id, eligiendo, procesando, cerrarTarjeta]);

  const actualizarSubida = useCallback((bid: string, cambios: Partial<Tarjeta>) => {
    setTarjeta((t) => (t && t.bid === bid ? { ...t, ...cambios } : t));
  }, []);

  /** Fase 1: después de cada cobro se sube. Sin red, queda pendiente en cola_cobros. */
  const subir = useCallback(
    async (bid: string) => {
      const r = await sincronizarCobros();
      refrescarResumen();
      const m = r?.get(bid);
      if (!m) return actualizarSubida(bid, { subida: "pendiente" });
      if (m.estado === "ok" || m.estado === "duplicado") {
        return actualizarSubida(bid, { subida: "ok", nombre: m.cobro?.pasajeroNombre ?? null });
      }
      actualizarSubida(bid, { subida: "rechazado", mensajeSubida: m.codigo ?? m.estado });
    },
    [actualizarSubida, refrescarResumen]
  );

  // Lector siempre escuchando: solo con la pantalla enfocada, app en primer plano, paquete y NFC.
  const activo = enfocada && enPrimerPlano && !!paquete && nfc === "listo";
  useEffect(() => {
    if (!activo) return;
    let cancelado = false;
    (async () => {
      while (!cancelado) {
        const res = await leerCobro(() => ({ paquete: paqueteRef.current!, modo: modoRef.current }));
        if (cancelado) break;
        if (!res.ok && res.codigo === "NFC_CANCELADO") {
          await espera(500); // evita girar en vacío si NFC falla
          continue;
        }
        avisarCobro(res.ok);
        refrescarResumen();
        const bid = res.ok ? res.boleto.bid : null;
        const cierre = mostrar({ res, bid, nombre: null, subida: res.ok ? "subiendo" : "ok" });
        if (bid) void subir(bid);
        // El lector espera a que se cierre la tarjeta: con los teléfonos aún pegados no debe
        // leer el siguiente boleto del mismo pasajero.
        await cierre;
      }
    })();
    return () => {
      cancelado = true;
      void cancelarLectura();
      cierreTarjeta.current?.();
    };
  }, [activo, mostrar, subir, refrescarResumen]);

  /** Cobro por QR (pasajeros sin NFC): mismas reglas y la misma tarjeta que un toque. */
  const cobrarQr = useCallback(
    async (texto: string) => {
      const actual = paqueteRef.current;
      if (!actual) return;
      const res = await ejecutarCobroQr(texto, {
        paquete: actual,
        modo: modoRef.current,
        yaCobrado: await bidsCobrados(),
        persistir: encolarCobro,
      });
      avisarCobro(res.ok);
      refrescarResumen();
      const bid = res.ok ? res.boleto.bid : null;
      void mostrar({ res, bid, nombre: null, subida: res.ok ? "subiendo" : "ok" });
      if (bid) void subir(bid);
    },
    [mostrar, subir, refrescarResumen]
  );

  /** «Corregir» (otro tramo) o «Cobrar como general». */
  const corregirTarjeta = useCallback(
    async (cambios: { tramoCodigo?: number; comoGeneral?: boolean }) => {
      const actual = tarjeta;
      if (!actual?.bid || !paquete) return;
      setEligiendo(false);
      setProcesando(true);
      const r = await corregir(actual.bid, cambios, { paquete });
      setProcesando(false);
      refrescarResumen();
      if (!r.ok) {
        // La corrección falló y NO se tocó nada: el cobro original sigue en pie.
        setTarjeta({ ...actual, id: ++idTarjeta.current, mensajeSubida: r.mensaje });
        return;
      }
      setTarjeta({
        id: ++idTarjeta.current,
        res: { ...r, reciboEnviado: true },
        bid: r.boleto.bid,
        nombre: actual.nombre,
        subida: "subiendo",
      });
      void subir(r.boleto.bid);
    },
    [tarjeta, paquete, subir, refrescarResumen]
  );

  return {
    paquete, desactualizado, cargando, nfc, modo, setModo, tarjeta, resumen,
    escuchando: activo, corrigiendo: eligiendo || procesando, procesando,
    elegirCorreccion: () => setEligiendo(true),
    cancelarCorreccion: () => setEligiendo(false),
    corregirTarjeta, cobrarQr,
    activarNfc: abrirAjustesNfc,
  };
}
