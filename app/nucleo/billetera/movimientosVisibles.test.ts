import { test } from "node:test";
import assert from "node:assert/strict";
import type { Movimiento } from "../types/billetera";
import { movimientosVisibles } from "./movimientosVisibles";

const viaje = { monto: 10000, lineaNombre: "Chorros de Milla", tramoNombre: "Centro – Milla", unidadCodigo: 101 };
const libro: Movimiento[] = [
  { id: "m4", tipo: "liberacion", monto: 4000, saldoDisponibleDespues: 48000, cobroId: "c1", viaje, creadoEn: "2026-10-01T12:00:01Z" },
  { id: "m3", tipo: "cobro", monto: 0, saldoDisponibleDespues: 44000, cobroId: "c1", viaje, creadoEn: "2026-10-01T12:00:00Z" },
  { id: "m2", tipo: "reserva", monto: -14000, saldoDisponibleDespues: 44000, creadoEn: "2026-10-01T11:00:00Z" },
  { id: "m1", tipo: "recarga", monto: 58000, saldoDisponibleDespues: 58000, creadoEn: "2026-10-01T10:00:00Z" },
];

test("solo recargas y viajes, con lo que costó el viaje de verdad", () => {
  assert.deepEqual(movimientosVisibles(libro), [
    { tipo: "viaje", id: "m3", monto: 10000, lineaNombre: "Chorros de Milla", tramoNombre: "Centro – Milla", unidadCodigo: 101, fecha: "2026-10-01T12:00:00Z" },
    { tipo: "recarga", id: "m1", monto: 58000, fecha: "2026-10-01T10:00:00Z" },
  ]);
});

test("un cobro sin detalle (backend viejo) sigue apareciendo como viaje", () => {
  const [v] = movimientosVisibles([{ ...libro[1], viaje: undefined }]);
  assert.equal(v.tipo, "viaje");
  assert.equal(v.tipo === "viaje" && v.monto, null);
});

test("la liberación de un boleto vencido no se muestra: el saldo total no cambia", () => {
  const vencido: Movimiento = { id: "m9", tipo: "liberacion", monto: 14000, saldoDisponibleDespues: 62000, creadoEn: "2026-10-09T00:00:00Z" };
  assert.deepEqual(movimientosVisibles([vencido]), []);
});
