import { test } from "node:test";
import assert from "node:assert/strict";
import nacl from "tweetnacl";
import { crearBoleto, LLAVE_PUBLICA_DEV } from "../scripts/devBoleto";
import { validarBoleto, cubreMonto } from "./boletos/validar";
import { decodificarBoleto, bytesDeBase64url } from "./boletos/boleto";
import { calcularMonto, esDomingoOFeriado, tabuladorVigente } from "./tarifas/calcularMonto";
import { elegirTramo } from "./tarifas/elegirTramo";
import { cmdSelect, cmdPedirBoleto, cmdRecibo, parsearBoletoOfrecido, parsearRespuesta } from "./nfc/apdu";
import type { Linea, Tabulador } from "./types/paquete";

const tab: Tabulador = {
  id: "t1", fuente: "prueba", vigenteDesde: "2026-09-01T04:00:00Z",
  descuentos: { general: 0, estudiante: 0.5, exonerado: 1 }, recargoDomingoFeriado: 0.2,
  urbanoMinimo: 20000, suburbano: [{ hastaKm: 10, monto: 28000 }, { hastaKm: 9999, monto: 99000 }],
};
const linea: Linea = {
  id: "l3", codigo: 3, nombre: "Mérida – Ejido", tipo: "suburbana",
  tramos: [
    { id: "a", codigo: 1, nombre: "Centro – Ejido", km: 9, tarifaCompleta: 28000, frecuencia: 2 },
    { id: "b", codigo: 2, nombre: "Centro – La Parroquia", km: 6, tarifaCompleta: 28000, frecuencia: 9 },
  ],
};
const paquete = { llavePublica: LLAVE_PUBLICA_DEV, revocados: [] as string[] };
const ahora = new Date();

test("boleto válido pasa las reglas 1-3", () => {
  const r = validarBoleto(crearBoleto(), paquete, new Set(), ahora);
  assert.equal(r.ok, true);
});

test("firma alterada → BOLETO_INVALIDO", () => {
  const b = bytesDeBase64url(crearBoleto());
  b[35] ^= 0xff; // cambia el monto reservado
  const raw = Buffer.from(b).toString("base64url");
  assert.deepEqual(validarBoleto(raw, paquete, new Set(), ahora), { ok: false, codigo: "BOLETO_INVALIDO" });
});

test("firmado con otra llave → BOLETO_INVALIDO", () => {
  const otra = nacl.sign.keyPair();
  const r = validarBoleto(crearBoleto(), { ...paquete, llavePublica: Buffer.from(otra.publicKey).toString("base64url") }, new Set(), ahora);
  assert.equal(r.ok === false && r.codigo, "BOLETO_INVALIDO");
});

test("basura / largo incorrecto → BOLETO_INVALIDO", () => {
  assert.equal(validarBoleto("AAAA", paquete, new Set(), ahora).ok, false);
  assert.equal(validarBoleto("***", paquete, new Set(), ahora).ok, false);
});

test("vencido; tolerancia de reloj de 10 min", () => {
  const seg = (delta: number) => Math.floor(ahora.getTime() / 1000) + delta;
  const venc = validarBoleto(crearBoleto({ expira: seg(-11 * 60) }), paquete, new Set(), ahora);
  assert.equal(venc.ok === false && venc.codigo, "BOLETO_VENCIDO");
  assert.equal(validarBoleto(crearBoleto({ expira: seg(-5 * 60) }), paquete, new Set(), ahora).ok, true);
});

test("revocado o ya cobrado → BOLETO_USADO", () => {
  const bid = "11111111-2222-4333-8444-555555555555";
  const raw = crearBoleto({ bid });
  const a = validarBoleto(raw, { ...paquete, revocados: [bid] }, new Set(), ahora);
  const b = validarBoleto(raw, paquete, new Set([bid]), ahora);
  assert.equal(a.ok === false && a.codigo, "BOLETO_USADO");
  assert.equal(b.ok === false && b.codigo, "BOLETO_USADO");
});

test("el orden de las reglas: inválido gana sobre vencido y usado", () => {
  const b = bytesDeBase64url(crearBoleto({ expira: 1 }));
  b[100] ^= 1;
  const r = validarBoleto(Buffer.from(b).toString("base64url"), paquete, new Set(), ahora);
  assert.equal(r.ok === false && r.codigo, "BOLETO_INVALIDO");
});

test("regla 4: monto ≤ reservado", () => {
  const r = validarBoleto(crearBoleto({ montoReservado: 10000 }), paquete, new Set(), ahora);
  assert.ok(r.ok);
  assert.equal(cubreMonto(10000, r.boleto), true);
  assert.equal(cubreMonto(10001, r.boleto), false);
});

test("decodifica categoría y monto", () => {
  const d = decodificarBoleto(bytesDeBase64url(crearBoleto({ categoria: 1, montoReservado: 123456 })))!;
  assert.equal(d.categoria, "estudiante");
  assert.equal(d.montoReservado, 123456);
});

test("tarifa: semilla del contrato (céntimos)", () => {
  const dia = new Date("2026-09-23T15:00:00Z"); // miércoles
  const m = (categoria: "general" | "estudiante" | "exonerado", km: number, tipo: "urbana" | "suburbana") =>
    calcularMonto({ linea: { tipo }, tramo: { ...linea.tramos[0], km, tarifaCompleta: 0 }, tabulador: tab, categoria, ocurridoEn: dia, feriados: [] });
  assert.equal(m("general", 5, "urbana"), 20000);
  assert.equal(m("estudiante", 5, "urbana"), 10000);
  assert.equal(m("exonerado", 5, "urbana"), 0);
  assert.equal(m("general", 9, "suburbana"), 28000);
  assert.equal(m("general", 12, "suburbana"), 99000);
});

test("tarifa: tarifaManual gana; recargo domingo/feriado", () => {
  const tramo = { ...linea.tramos[0], tarifaManual: 15000 };
  const base = { linea, tramo, tabulador: tab, categoria: "general" as const, feriados: ["2026-10-12"] };
  assert.equal(calcularMonto({ ...base, ocurridoEn: new Date("2026-09-23T15:00:00Z") }), 15000);
  assert.equal(calcularMonto({ ...base, ocurridoEn: new Date("2026-09-27T15:00:00Z") }), 18000); // domingo
  assert.equal(calcularMonto({ ...base, ocurridoEn: new Date("2026-10-12T15:00:00Z") }), 18000); // feriado
});

test("domingo se decide en hora de Mérida (UTC-4), no UTC", () => {
  // sábado 22:00 en Mérida = domingo 02:00 UTC → NO es domingo
  assert.equal(esDomingoOFeriado(new Date("2026-09-27T02:00:00Z"), []), false);
  // domingo 22:00 en Mérida = lunes 02:00 UTC → SÍ es domingo
  assert.equal(esDomingoOFeriado(new Date("2026-09-28T02:00:00Z"), []), true);
});

test("tabulador próximo rige desde su vigenteDesde", () => {
  const prox = { ...tab, id: "t2", vigenteDesde: "2026-10-01T04:00:00Z" };
  assert.equal(tabuladorVigente(tab, prox, new Date("2026-09-30T00:00:00Z")).id, "t1");
  assert.equal(tabuladorVigente(tab, prox, new Date("2026-10-01T04:00:00Z")).id, "t2");
  assert.equal(tabuladorVigente(tab, null, new Date("2030-01-01")).id, "t1");
});

test("elegir tramo: automático usa sugerido, si no el más frecuente; fijo manda", () => {
  assert.equal(elegirTramo(linea, { tipo: "automatico" }, 1)?.codigo, 1);
  assert.equal(elegirTramo(linea, { tipo: "automatico" }, 0)?.codigo, 2);
  assert.equal(elegirTramo(linea, { tipo: "automatico" }, 77)?.codigo, 2); // sugerido de otra línea
  assert.equal(elegirTramo(linea, { tipo: "fijo", tramoCodigo: 1 }, 2)?.codigo, 1);
  assert.equal(elegirTramo(linea, { tipo: "fijo", tramoCodigo: 99 }, 2), null);
});

test("APDU: bytes exactos del contrato", () => {
  assert.deepEqual(cmdSelect(), [0x00, 0xa4, 0x04, 0x00, 0x07, 0xf0, 0x50, 0x41, 0x53, 0x45, 0x00, 0x02, 0x00]);
  assert.deepEqual(cmdPedirBoleto(3, 102), [0x80, 0x10, 0, 0, 4, 0, 3, 0, 102]);
  const bid = Array.from({ length: 16 }, (_, i) => i);
  const r = cmdRecibo(bid, 0x0102, 0x00006d60, 0x6a000001);
  assert.equal(r.length, 5 + 26);
  assert.equal(r[4], 0x1a);
  assert.deepEqual(r.slice(21, 31), [0x01, 0x02, 0, 0, 0x6d, 0x60, 0x6a, 0, 0, 1]);
});

test("APDU: parseo de respuestas", () => {
  const boleto = Array.from({ length: 106 }, (_, i) => i);
  const resp = parsearRespuesta([...boleto, 0x00, 0x02, 0x90, 0x00]);
  assert.equal(resp.sw, 0x9000);
  const of = parsearBoletoOfrecido(resp.datos)!;
  assert.equal(of.tramoSugerido, 2);
  assert.equal(of.boleto.length, 106);
  assert.equal(parsearRespuesta([0x6a, 0x82]).sw, 0x6a82);
  assert.equal(parsearBoletoOfrecido([1, 2, 3]), null);
});
