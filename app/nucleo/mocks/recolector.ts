import type { CobrosDelDia } from "@nucleo/types/cobros";

// Datos de prueba con la forma de bk-ruta67/mocks/recolector-cobros.json (unidad 102, línea 3).

const haceMin = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

export function cobrosDeHoyMock(): CobrosDelDia {
  const cobros: CobrosDelDia["cobros"] = [
    { nombre: "Ana Pasajera", categoria: "estudiante", tramo: 1, tramoNombre: "Centro – Ejido", monto: 14000, min: 12 },
    { nombre: "Pedro General", categoria: "general", tramo: 2, tramoNombre: "Centro – La Parroquia", monto: 28000, min: 47 },
    { nombre: "Rosa Mayor", categoria: "exonerado", tramo: 1, tramoNombre: "Centro – Ejido", monto: 0, min: 95 },
  ].map((c, i) => ({
    id: `mock-c${i}`,
    bid: `mock-b${i}`,
    pasajeroNombre: c.nombre,
    categoriaAplicada: c.categoria as CobrosDelDia["cobros"][number]["categoriaAplicada"],
    lineaCodigo: 3,
    tramoCodigo: c.tramo,
    tramoNombre: c.tramoNombre,
    unidadCodigo: 102,
    monto: c.monto,
    metodo: "nfc",
    ocurridoEn: haceMin(c.min),
    sincronizadoEn: haceMin(c.min),
    confirmadoPor: ["recolector"],
    estado: "ok",
  }));
  return { total: cobros.reduce((s, c) => s + c.monto, 0), cantidad: cobros.length, cobros };
}
