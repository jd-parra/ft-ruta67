import { test } from "node:test";
import assert from "node:assert/strict";
import { crearBoleto, LLAVE_PUBLICA_DEV } from "../../scripts/devBoleto";
import { bidDeRaw } from "../boletos/boleto";
import { corregirCobro, type DepsCorreccion } from "./corregirCobro";
import { subirPendientes, unaALaVez } from "./subirCobros";
import { inicioDelDia } from "../tarifas/zonaHoraria";
import type { EstadoCobro, FilaCobro } from "../types/cobros";
import type { PaqueteRecolector } from "../types/paquete";

const paquete: PaqueteRecolector = {
  llavePublica: LLAVE_PUBLICA_DEV,
  unidad: { id: "u", codigo: 102, placa: "AC456EF", lineaId: "l3", recolectorId: "r" },
  linea: {
    id: "l3", codigo: 3, nombre: "Mérida – Ejido", tipo: "suburbana",
    tramos: [
      { id: "a", codigo: 1, nombre: "Centro – Ejido", km: 9, tarifaCompleta: 0, frecuencia: 2 },
      { id: "b", codigo: 2, nombre: "Centro – Milla", km: 12, tarifaCompleta: 0, frecuencia: 9 },
    ],
  },
  tabulador: {
    id: "t", fuente: "p", vigenteDesde: "2026-09-01T04:00:00Z",
    descuentos: { general: 0, estudiante: 0.5, exonerado: 1 }, recargoDomingoFeriado: 0,
    urbanoMinimo: 20000, suburbano: [{ hastaKm: 10, monto: 28000 }, { hastaKm: 9999, monto: 99000 }],
  },
  tabuladorProximo: null, feriados: [], revocados: [], generadoEn: "",
};

const fila = (o: Partial<FilaCobro> & { raw: string }): FilaCobro => ({
  bid: bidDeRaw(o.raw), tramoCodigo: 1, monto: 28000, metodo: "nfc", ocurridoEn: new Date().toISOString(),
  categoria: "general", estado: "pendiente", codigo: null, pasajeroNombre: null, ...o,
});

// ---- subida ----
test("sube pendientes y marca el resultado con el nombre del pasajero", async () => {
  const raw = crearBoleto();
  const f = fila({ raw });
  const marcas: [string, EstadoCobro, unknown][] = [];
  const r = await subirPendientes({
    pendientes: async () => [f],
    subir: async (c) => {
      assert.equal(c.length, 1);
      assert.equal(c[0].raw, raw);
      assert.ok(!("bid" in c[0])); // CobroLocal no lleva bid: el backend lo saca del boleto
      return [{ bid: f.bid, estado: "ok", cobro: { pasajeroNombre: "Ana Pasajera" } }];
    },
    marcar: async (bid, e, x) => void marcas.push([bid, e, x]),
  });
  assert.equal(r?.get(f.bid)?.cobro?.pasajeroNombre, "Ana Pasajera");
  assert.deepEqual(marcas, [[f.bid, "ok", { codigo: undefined, nombre: "Ana Pasajera" }]]);
});

test("sin red: devuelve null y no toca la cola (queda pendiente)", async () => {
  let marcado = false;
  const r = await subirPendientes({
    pendientes: async () => [fila({ raw: crearBoleto() })],
    subir: async () => { throw new Error("Network Error"); },
    marcar: async () => void (marcado = true),
  });
  assert.equal(r, null);
  assert.equal(marcado, false);
});

test("rechazado / conflicto se guardan con su código", async () => {
  const f = fila({ raw: crearBoleto() });
  const marcas: unknown[] = [];
  await subirPendientes({
    pendientes: async () => [f],
    subir: async () => [{ bid: f.bid, estado: "conflicto", codigo: "BOLETO_USADO" }],
    marcar: async (...a) => void marcas.push(a),
  });
  assert.deepEqual(marcas[0], [f.bid, "conflicto", { codigo: "BOLETO_USADO", nombre: undefined }]);
});

test("sin pendientes no llama al backend", async () => {
  const r = await subirPendientes({ pendientes: async () => [], subir: async () => { throw new Error("no debe llamarse"); }, marcar: async () => {} });
  assert.equal(r?.size, 0);
});

test("unaALaVez: dos llamadas simultáneas comparten una sola subida", async () => {
  let n = 0;
  const f = unaALaVez(async () => { n++; await new Promise((r) => setTimeout(r, 10)); return n; });
  const [a, b] = await Promise.all([f(), f()]);
  assert.equal(n, 1);
  assert.equal(a, b);
  await f();
  assert.equal(n, 2); // terminada la primera, se puede volver a subir
});

// ---- corregir ----
function depsCorreccion(filas: FilaCobro[], o: { anularFalla?: string } = {}) {
  const log: string[] = [];
  const db = new Map(filas.map((f) => [f.bid, f]));
  const d: DepsCorreccion = {
    obtener: async (b) => db.get(b) ?? null,
    cobrados: async () => new Set(db.keys()),
    anular: async (b) => { log.push(`anular:${b}`); if (o.anularFalla) throw new Error(o.anularFalla); },
    eliminar: async (b) => { log.push(`eliminar:${b}`); db.delete(b); },
    persistir: async (c) => { log.push(`persistir:${c.cobro.tramoCodigo}:${c.cobro.monto}:${c.categoria}`); },
    esperarSubida: async () => { log.push("esperar"); },
  };
  return { d, log };
}
const opc = { paquete };

test("Corregir tramo (ya subido): anula en backend, borra y re-cobra con el otro tramo", async () => {
  const raw = crearBoleto();
  const f = fila({ raw, estado: "ok", tramoCodigo: 1, monto: 28000 });
  const { d, log } = depsCorreccion([f]);
  const r = await corregirCobro(d, f.bid, { tramoCodigo: 2 }, opc);
  assert.ok(r.ok);
  assert.equal(r.cobro.monto, 99000); // tramo 2 son 12 km
  assert.deepEqual(log, ["esperar", `anular:${f.bid}`, `eliminar:${f.bid}`, "persistir:2:99000:general"]);
  assert.equal(r.cobro.ocurridoEn, f.ocurridoEn.slice(0, 19) + ".000Z"); // conserva el momento (a segundos)
});

test("Corregir un cobro aún pendiente NO llama al backend", async () => {
  const f = fila({ raw: crearBoleto(), estado: "pendiente" });
  const { d, log } = depsCorreccion([f]);
  assert.ok((await corregirCobro(d, f.bid, { tramoCodigo: 2 }, opc)).ok);
  assert.ok(!log.some((l) => l.startsWith("anular")));
});

test("si el nuevo tramo no cabe en el boleto, NO se anula nada", async () => {
  const f = fila({ raw: crearBoleto({ montoReservado: 30000 }), estado: "ok" });
  const { d, log } = depsCorreccion([f]);
  const r = await corregirCobro(d, f.bid, { tramoCodigo: 2 }, opc);
  assert.equal(!r.ok && r.codigo, "BOLETO_INSUFICIENTE");
  assert.deepEqual(log, ["esperar"]);
});

test("si el backend rechaza la anulación (>2 min), no se toca el cobro local", async () => {
  const f = fila({ raw: crearBoleto(), estado: "ok" });
  const { d, log } = depsCorreccion([f], { anularFalla: "Pasaron más de 2 minutos" });
  const r = await corregirCobro(d, f.bid, { tramoCodigo: 2 }, opc);
  assert.equal(!r.ok && r.codigo, "CORRECCION_FALLIDA");
  assert.equal(!r.ok && r.mensaje, "Pasaron más de 2 minutos");
  assert.ok(!log.some((l) => l.startsWith("eliminar") || l.startsWith("persistir")));
});

test("«Cobrar como general» quita el descuento del boleto estudiante", async () => {
  const f = fila({ raw: crearBoleto({ categoria: 1 }), categoria: "estudiante", estado: "ok", monto: 14000 });
  const { d } = depsCorreccion([f]);
  const r = await corregirCobro(d, f.bid, { comoGeneral: true }, opc);
  assert.ok(r.ok);
  assert.equal(r.cobro.monto, 28000);
  assert.equal(r.categoriaAplicada, "general");
});

test("cambiar el tramo después de «como general» conserva el general", async () => {
  const f = fila({ raw: crearBoleto({ categoria: 1 }), categoria: "general", estado: "ok" });
  const { d } = depsCorreccion([f]);
  const r = await corregirCobro(d, f.bid, { tramoCodigo: 1 }, opc);
  assert.ok(r.ok);
  assert.equal(r.categoriaAplicada, "general");
});

test("cobro inexistente", async () => {
  const { d } = depsCorreccion([]);
  const r = await corregirCobro(d, "no-existe", {}, opc);
  assert.equal(!r.ok && r.codigo, "CORRECCION_FALLIDA");
});

// ---- día ----
test("el día del contador empieza a medianoche de Mérida (UTC-4)", () => {
  // 2026-09-25 01:00 UTC = 2026-09-24 21:00 en Mérida → el día empezó el 24 a las 04:00 UTC
  assert.equal(inicioDelDia(new Date("2026-09-25T01:00:00Z")), "2026-09-24T04:00:00.000Z");
  assert.equal(inicioDelDia(new Date("2026-09-25T15:00:00Z")), "2026-09-25T04:00:00.000Z");
});
