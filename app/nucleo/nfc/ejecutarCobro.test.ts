import { test } from "node:test";
import assert from "node:assert/strict";
import { crearBoleto, LLAVE_PUBLICA_DEV } from "../../scripts/devBoleto";
import { bytesDeBase64url } from "../boletos/boleto";
import { ejecutarCobro, type CobroPersistir, type OpcionesCobro } from "./ejecutarCobro";
import type { PaqueteRecolector } from "../types/paquete";

// Teléfono del pasajero simulado: mismo protocolo que PasajeCardService.kt.
function pasajero(o: { boletos: string[]; tramoSugerido?: number; sinPagar?: boolean; cortarAntesDeRecibo?: boolean }) {
  const recibos: number[][] = [];
  let seleccionado = false;
  let ofrecido: number[] | null = null;
  const transceive = async (c: number[]): Promise<number[]> => {
    if (o.sinPagar) return [0x6d, 0x00];
    if (c[1] === 0xa4) return (seleccionado = true), [0x90, 0x00];
    if (!seleccionado) return [0x69, 0x85];
    if (c[1] === 0x10 && c[0] === 0x80) {
      if (!o.boletos.length) return [0x6a, 0x82];
      const b = Array.from(bytesDeBase64url(o.boletos[0]));
      ofrecido = b.slice(1, 17);
      const t = o.tramoSugerido ?? 0;
      return [...b, t >> 8, t & 0xff, 0x90, 0x00];
    }
    if (c[1] === 0x20 && c[0] === 0x80) {
      if (o.cortarAntesDeRecibo) throw new Error("tag lost");
      if (JSON.stringify(c.slice(5, 21)) !== JSON.stringify(ofrecido)) return [0x6a, 0x80];
      recibos.push(c);
      return [0x90, 0x00];
    }
    return [0x6d, 0x00];
  };
  return { transceive, recibos };
}

const paquete: PaqueteRecolector = {
  llavePublica: LLAVE_PUBLICA_DEV,
  unidad: { id: "u", codigo: 102, placa: "AC456EF", lineaId: "l3", recolectorId: "r" },
  linea: {
    id: "l3", codigo: 3, nombre: "Mérida – Ejido", tipo: "suburbana",
    tramos: [
      { id: "a", codigo: 1, nombre: "Centro – Ejido", km: 9, tarifaCompleta: 28000, frecuencia: 2 },
      { id: "b", codigo: 2, nombre: "Centro – La Parroquia", km: 6, tarifaCompleta: 28000, frecuencia: 9 },
    ],
  },
  tabulador: {
    id: "t1", fuente: "prueba", vigenteDesde: "2026-09-01T04:00:00Z",
    descuentos: { general: 0, estudiante: 0.5, exonerado: 1 }, recargoDomingoFeriado: 0,
    urbanoMinimo: 20000, suburbano: [{ hastaKm: 10, monto: 28000 }, { hastaKm: 9999, monto: 99000 }],
  },
  tabuladorProximo: null, feriados: [], revocados: [], generadoEn: new Date().toISOString(),
};

function setup(extra: Partial<OpcionesCobro> = {}) {
  const guardados: CobroPersistir[] = [];
  const opciones: OpcionesCobro = {
    paquete, modo: { tipo: "automatico" }, yaCobrado: new Set(),
    persistir: async (c) => void guardados.push(c),
    ...extra,
  };
  return { guardados, opciones };
}

test("cobro feliz: usa el tramo sugerido, cobra con descuento y envía el RECIBO", async () => {
  const p = pasajero({ boletos: [crearBoleto({ categoria: 1 })], tramoSugerido: 1 });
  const { guardados, opciones } = setup();
  const r = await ejecutarCobro(p.transceive, opciones);
  assert.ok(r.ok);
  assert.equal(r.tramo.codigo, 1);
  assert.equal(r.categoriaAplicada, "estudiante");
  assert.equal(r.cobro.monto, 14000); // 28000 × 0.5
  assert.equal(r.reciboEnviado, true);
  assert.equal(guardados.length, 1);
  assert.equal(guardados[0].bid, r.boleto.bid);
  // El RECIBO trae tramo, monto y hora tal como se guardó el cobro
  const rec = p.recibos[0];
  assert.deepEqual(rec.slice(21, 23), [0, 1]);
  assert.equal(((rec[23] << 24) | (rec[24] << 16) | (rec[25] << 8) | rec[26]) >>> 0, 14000);
  const seg = ((rec[27] << 24) | (rec[28] << 16) | (rec[29] << 8) | rec[30]) >>> 0;
  assert.equal(new Date(seg * 1000).toISOString(), r.cobro.ocurridoEn);
});

test("sin sugerencia (00 00) usa el tramo más frecuente de la línea", async () => {
  const p = pasajero({ boletos: [crearBoleto()], tramoSugerido: 0 });
  const r = await ejecutarCobro(p.transceive, setup().opciones);
  assert.ok(r.ok);
  assert.equal(r.tramo.codigo, 2);
});

test("tramo fijo manda sobre la sugerencia", async () => {
  const p = pasajero({ boletos: [crearBoleto()], tramoSugerido: 2 });
  const r = await ejecutarCobro(p.transceive, setup({ modo: { tipo: "fijo", tramoCodigo: 1 } }).opciones);
  assert.ok(r.ok);
  assert.equal(r.tramo.codigo, 1);
});

test("«Cobrar como general» ignora la categoría del boleto", async () => {
  const p = pasajero({ boletos: [crearBoleto({ categoria: 2 })] });
  const r = await ejecutarCobro(p.transceive, setup({ cobrarComoGeneral: true }).opciones);
  assert.ok(r.ok);
  assert.equal(r.cobro.monto, 28000);
});

test("si se separan antes del RECIBO, el cobro se guarda igual", async () => {
  const p = pasajero({ boletos: [crearBoleto()], cortarAntesDeRecibo: true });
  const { guardados, opciones } = setup();
  const r = await ejecutarCobro(p.transceive, opciones);
  assert.ok(r.ok);
  assert.equal(r.reciboEnviado, false);
  assert.equal(guardados.length, 1);
});

test("el bid se guarda ANTES de enviar el RECIBO", async () => {
  const orden: string[] = [];
  const p = pasajero({ boletos: [crearBoleto()] });
  const base = p.transceive;
  const transceive = async (c: number[]) => (c[1] === 0x20 && orden.push("recibo"), base(c));
  await ejecutarCobro(transceive, setup({ persistir: async () => void orden.push("guardar") }).opciones);
  assert.deepEqual(orden, ["guardar", "recibo"]);
});

test("boleto ya cobrado: rechaza, no guarda y no envía RECIBO", async () => {
  const bid = "11111111-2222-4333-8444-555555555555";
  const p = pasajero({ boletos: [crearBoleto({ bid })] });
  const { guardados, opciones } = setup({ yaCobrado: new Set([bid]) });
  const r = await ejecutarCobro(p.transceive, opciones);
  assert.deepEqual([r.ok, !r.ok && r.codigo], [false, "BOLETO_USADO"]);
  assert.equal(guardados.length, 0);
  assert.equal(p.recibos.length, 0);
});

test("BOLETO_INSUFICIENTE cuando la tarifa supera lo reservado", async () => {
  const p = pasajero({ boletos: [crearBoleto({ montoReservado: 20000 })], tramoSugerido: 1 });
  const { guardados, opciones } = setup();
  const r = await ejecutarCobro(p.transceive, opciones);
  assert.equal(!r.ok && r.codigo, "BOLETO_INSUFICIENTE");
  assert.equal(guardados.length, 0);
});

test("errores de protocolo: sin Pagar abierta, sin boletos", async () => {
  const a = await ejecutarCobro(pasajero({ boletos: [], sinPagar: true }).transceive, setup().opciones);
  assert.equal(!a.ok && a.codigo, "PASAJERO_SIN_APP");
  const b = await ejecutarCobro(pasajero({ boletos: [] }).transceive, setup().opciones);
  assert.equal(!b.ok && b.codigo, "SIN_BOLETOS");
});

test("si no se puede guardar el cobro, no se envía el RECIBO", async () => {
  const p = pasajero({ boletos: [crearBoleto()] });
  const r = await ejecutarCobro(p.transceive, setup({ persistir: async () => { throw new Error("disco lleno"); } }).opciones);
  assert.equal(!r.ok && r.codigo, "ERROR_LOCAL");
  assert.equal(p.recibos.length, 0);
});
