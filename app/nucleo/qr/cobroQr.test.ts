import { test } from "node:test";
import assert from "node:assert/strict";
import { crearBoleto, LLAVE_PUBLICA_DEV } from "../../scripts/devBoleto";
import type { CobroPersistir, OpcionesCobro } from "../nfc/ejecutarCobro";
import type { PaqueteRecolector } from "../types/paquete";
import { ejecutarCobroQr, leerTextoQr, textoQr } from "./cobroQr";

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
    descuentos: { general: 0, estudiante: 0.5, exonerado: 0.5 }, recargoDomingoFeriado: 0,
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

test("textoQr y leerTextoQr van y vuelven", () => {
  const raw = crearBoleto();
  assert.deepEqual(leerTextoQr(textoQr(raw, 2)), { raw, tramoSugerido: 2 });
  assert.deepEqual(leerTextoQr(textoQr(raw)), { raw, tramoSugerido: 0 });
});

test("un QR ajeno no es un boleto", () => {
  for (const t of ["https://ruta67.app", "P2:", "P2:abc.-1", "P2:a b.1", "P1:abc.1"]) {
    assert.equal(leerTextoQr(t), null, t);
  }
});

test("cobro por QR: mismas reglas que NFC, metodo qr y sin recibo", async () => {
  const { guardados, opciones } = setup();
  const r = await ejecutarCobroQr(textoQr(crearBoleto({ categoria: 2 }), 1), opciones);
  assert.ok(r.ok);
  assert.equal(r.tramo.codigo, 1);
  assert.equal(r.categoriaAplicada, "exonerado");
  assert.equal(r.cobro.monto, 14000); // exonerados pagan la mitad
  assert.equal(r.cobro.metodo, "qr");
  assert.equal(r.reciboEnviado, false);
  assert.equal(guardados[0].cobro.metodo, "qr");
});

test("QR de un boleto ya cobrado → BOLETO_USADO y no guarda nada", async () => {
  const raw = crearBoleto();
  const primero = await ejecutarCobroQr(textoQr(raw), setup().opciones);
  assert.ok(primero.ok);
  const { guardados, opciones } = setup({ yaCobrado: new Set([primero.boleto.bid]) });
  const r = await ejecutarCobroQr(textoQr(raw), opciones);
  assert.equal(r.ok, false);
  assert.equal(!r.ok && r.codigo, "BOLETO_USADO");
  assert.equal(guardados.length, 0);
});

test("QR que no es de Ruta67 → QR_INVALIDO", async () => {
  const r = await ejecutarCobroQr("hola", setup().opciones);
  assert.equal(!r.ok && r.codigo, "QR_INVALIDO");
});
