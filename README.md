# Ruta 67

App móvil (React Native + Expo + TypeScript) con el mapa de restaurantes de Ejido, Mérida.

## Requisitos
- Node 20+ y pnpm 10
- App **Expo Go** en el teléfono, o emulador Android/iOS

## Comandos
```bash
pnpm install
pnpm start        # QR para Expo Go
pnpm android
pnpm ios
pnpm typecheck
```

## Arquitectura (Atomic Design)
```
src/components/
  atoms/       AppText, Dot, SearchField
  molecules/   LegendItem, WarningFilter, PlaceListItem, PlaceMarker
  organisms/   PlaceMap, Legend, PlacesPanel
  templates/   MapTemplate
  pages/       HomeScreen
src/{data,hooks,theme,types}
```
Alias `@/` apunta a `src/`. El mapa usa tiles de OpenStreetMap (sin API key).

`legacy-web/` conserva la versión web original en Leaflet.
