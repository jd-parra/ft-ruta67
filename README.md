# Pasaje

Pago de pasaje por NFC/QR en Mérida, Venezuela. Fuente de verdad: `CONTRATO.md` (v2).

```
/app            app Expo (dev build), un solo binario con modo pasajero y modo recolector
  /nucleo       NFC/HCE, boletos, almacén local, sync, api, auth, navegación  (Andy)
  /pantallas    pasajero/, recolector/, auth/                                   (Jose)
  /componentes  Atomic Design: atoms, molecules, organisms, templates
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
- `EXPO_PUBLIC_USE_MOCKS=false` y `EXPO_PUBLIC_API_HOST=<ip>:3000` para hablar con el backend.
- Login mock (clave `1234`): `04140000001` pasajero, `04140000002` recolector.
- Alias: `@nucleo`, `@pantallas`, `@componentes`, `@shared`.
- HCE: módulo nativo propio `app/modules/pasaje-hce` (HostApduService con el protocolo v2, AID `F0504153450002`). `react-native-hce` no sirve: solo emula tags NDEF.
