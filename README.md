# Pasaje

Pago de pasaje por NFC/QR en Mérida, Venezuela. Fuente de verdad: `CONTRATO.md` (v2).

```
/app            app Expo (dev build), un solo binario con modo pasajero y modo recolector
  /nucleo       NFC/HCE, boletos, almacén local, sync, api, auth, navegación  (Andy)
  /pantallas    pasajero/, recolector/, comunes/, auth/                         (Jose)
  /componentes  Atomic Design: atoms, molecules, organisms, templates
  /hooks        useBilletera, useCobrador, usePagoHce, useTurno, useUnidadesMapa
/backend        Node + Express + Socket.IO + PostgreSQL                         (Juan)
/panel-central  React + Vite                                                    (Jose)
/shared         boleto.js, tarifa.js, codigos.js, dev-keys.json
/mocks          JSON con la forma de la API
```

## App
Expo Go **no sirve** (NFC/HCE son nativos): hace falta dev build.
```bash
cd app
pnpm install
eas build --profile development --platform android   # o: pnpm exec expo run:android
pnpm start
pnpm typecheck
```
- Por defecto habla con el backend (`EXPO_PUBLIC_API_HOST=<ip>:3001` o `EXPO_PUBLIC_API_URL`). Datos de prueba solo con `EXPO_PUBLIC_USE_MOCKS=true`.
- Cobro por QR (pasajeros sin NFC): el recolector toca el círculo de Cobrar y escanea el QR que el pasajero abre en Pagar. Necesita un dev build nuevo (`expo-camera`, `react-native-svg`).
- Login mock (clave `1234`): `04140000001` pasajero, `04140000002` recolector.
- Alias: `@nucleo`, `@pantallas`, `@componentes`, `@hooks`, `@shared`.
- Tests: `pnpm test` (formato de boleto, tarifa, reglas 8.3, APDU y un cobro completo contra un pasajero simulado). `pnpm dev:boleto [categoria] [dias]` genera boletos firmados con la llave fija de desarrollo (la que usa el paquete mock).
- HCE: módulo nativo propio `app/modules/pasaje-hce` (HostApduService con el protocolo v2, AID `F0504153450002`). `react-native-hce` no sirve: solo emula tags NDEF.
