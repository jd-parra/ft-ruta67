import { requireOptionalNativeModule } from "expo";

// Módulo nativo local: app/modules/pasaje-hce (HostApduService propio con el protocolo v2).
// `react-native-hce` no sirve: solo emula tags NDEF y no admite comandos APDU propios.

export interface ReciboNativo {
  bid: string; // base64url de 16 bytes
  lineaCodigo: number;
  unidadCodigo: number;
  tramoCodigo: number;
  monto: number; // céntimos
  ocurridoEn: number; // uint32, segundos Unix
}

interface PasajeHceNativo {
  soportado(): boolean;
  setBoletos(boletos: string[]): void;
  setFrecuentes(frecuentes: Record<string, number>): void;
  setActivo(activo: boolean): void;
  drenarRecibos(): ReciboNativo[];
  addListener(evento: "onRecibo", cb: () => void): { remove(): void };
}

export const PasajeHce = requireOptionalNativeModule<PasajeHceNativo>("PasajeHce");
