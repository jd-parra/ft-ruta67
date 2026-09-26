// Genera boletos de prueba firmados con una llave FIJA de desarrollo (solo para probar sin backend).
// Uso: pnpm dev:boleto [categoria=general|estudiante|exonerado] [dias=7]
import nacl from "tweetnacl";
import { encodeBase64 } from "tweetnacl-util";
import { randomUUID } from "node:crypto";

export const SEMILLA_DEV = new Uint8Array(32).fill(7);
export const par = nacl.sign.keyPair.fromSeed(SEMILLA_DEV);
const b64url = (b: Uint8Array) => encodeBase64(b).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const LLAVE_PUBLICA_DEV = b64url(par.publicKey);

const uuidABytes = (u: string) => Uint8Array.from(Buffer.from(u.replace(/-/g, ""), "hex"));

export function crearBoleto(o: { categoria?: 0 | 1 | 2; montoReservado?: number; expira?: number; bid?: string } = {}) {
  const b = new Uint8Array(106);
  const dv = new DataView(b.buffer);
  b[0] = 1;
  b.set(uuidABytes(o.bid ?? randomUUID()), 1);
  b.set(uuidABytes(randomUUID()), 17);
  b[33] = o.categoria ?? 0;
  dv.setUint32(34, o.montoReservado ?? 99000, false);
  dv.setUint32(38, o.expira ?? Math.floor(Date.now() / 1000) + 7 * 86400, false);
  b.set(nacl.sign.detached(b.slice(0, 42), par.secretKey), 42);
  return b64url(b);
}

if (process.argv[1]?.endsWith("devBoleto.ts")) {
  const cat = ({ general: 0, estudiante: 1, exonerado: 2 } as Record<string, 0 | 1 | 2>)[process.argv[2] ?? "general"] ?? 0;
  const dias = Number(process.argv[3] ?? 7);
  console.log("llavePublica:", LLAVE_PUBLICA_DEV);
  console.log("boleto:", crearBoleto({ categoria: cat, expira: Math.floor(Date.now() / 1000) + dias * 86400 }));
}
