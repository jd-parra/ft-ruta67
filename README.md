# Ruta 67

App móvil (React Native + Expo + TypeScript) con el mapa de restaurantes de Ejido, Mérida.

## Requisitos
- Node 20+ y pnpm 10
- **Dev build** (Expo Go no sirve: NFC/HCE son nativos): `eas build --profile development --platform android`, o local con `pnpm exec expo run:android`

## Comandos
```bash
pnpm install
pnpm start        # con dev client instalado
pnpm android
pnpm typecheck
```

## Estructura
```
src/app/nucleo/       núcleo (config, api, auth, db, realtime, navigation, theme, types)
  components/         Atomic Design: atoms / molecules / organisms / templates
src/app/pantallas/    pantallas (auth, pasajero, recolector) — las monta Jose
src/shared/           código compartido con el panel web (boleto, tarifa) — Juan
plugins/withHce.js    config plugin: permiso NFC, servicio HCE y aid_list.xml
```
Alias: `@nucleo/*`, `@pantallas/*`, `@shared/*`.

- El rol del login decide el modo (pasajero / recolector), con navegación separada.
- `USE_MOCKS` (por defecto `true`): `EXPO_PUBLIC_USE_MOCKS=false` y `EXPO_PUBLIC_API_URL` para el backend real.
- Mock login: usuario que empiece con `rec` = recolector, otro = pasajero.
- Mapa con tiles de OpenStreetMap (sin API key).

`legacy-web/` conserva la versión web original en Leaflet.
