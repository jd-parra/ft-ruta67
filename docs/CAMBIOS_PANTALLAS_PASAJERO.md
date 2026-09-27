# Pantallas del modo pasajero (Jose)

Rama: `feat/pantallas-pasajero` · Tarea 1 del frontend (contrato §14)

Este documento resume qué cambió en la app, cómo estaba antes y qué hace falta para probarla en otro equipo o teléfono.

---

## 1. Resumen

| Pantalla | Antes | Ahora |
|---|---|---|
| **Login** | Formulario básico. Los errores salían en un `Alert` | Rediseñado: logo, campos con icono, botón para ver la clave, error dentro de la pantalla, enlace a **Registro** |
| **Registro** | ❌ No existía | Nombre, teléfono, clave y categoría (🧑 General · 🎓 Estudiante · 👴 Exonerado). Si no es general: aviso **"pendiente de verificación"**. Al registrarse entra directo |
| **Inicio** | Placeholder (nombre + cerrar sesión) | Saludo con categoría, tarjeta de saldo (disponible, reservado, **≈ N viajes**, **🎫 N boletos listos**), accesos rápidos y avisos. Se actualiza al deslizar hacia abajo |
| **Recargar** | ❌ No existía | Montos rápidos 500 / 1.000 / 2.000 Bs, campo libre (acepta `1.500,50`), máximo 100.000 Bs, pantalla de **"¡Recarga confirmada!"**. Usa `POST /recargas` |
| **Historial** | ❌ No existía | Dos pestañas: **Viajes** (recibos guardados en el teléfono, con nombre de línea y tramo) y **Movimientos** (`GET /movimientos`) |
| **Pagar** | Versión mínima de Andy para probar el protocolo | **Solo diseño nuevo**: círculo con ondas animadas, mensaje según el estado y tarjeta de "¡Pago registrado!". **La lógica (`usePagoHce`) no se tocó** |

La barra de pestañas del pasajero ahora es **Inicio · Pagar · Historial**, con iconos. **Recargar** se abre encima de las pestañas.

---

## 2. Cómo se probaron

- `pnpm typecheck` ✅
- Tests del núcleo: 39/39 ✅ (con Node 20 hay que pasar los archivos a mano; ver §7)
- El bundle de Android compila en Metro ✅
- Probado en un teléfono **sin NFC** en modo mocks. Contra el backend real está pendiente (ver §3.2)

---

## 3. Qué necesitas para correr la app

### 3.1 La app "Pasaje" (dev build), no Expo Go

**Expo Go no sirve para este proyecto.** La app usa código nativo que Expo Go no trae:

- `react-native-nfc-manager`: el recolector **lee** el teléfono del pasajero.
- `app/modules/pasaje-hce`: el teléfono del pasajero **se hace pasar por una tarjeta** (HCE). Es un módulo propio del equipo.

Por eso hay que instalar **nuestra propia app** (el *dev build*). Hace lo mismo que Expo Go (se conecta a `pnpm start` y recarga los cambios al instante), pero con el código nativo incluido. Si abres el proyecto con Expo Go, sale el mensaje *"debe tener dev build"*.

**Instalarla:**
- Enlace directo al APK (no pide iniciar sesión):
  `https://expo.dev/artifacts/eas/37yp71Vu8L6qcv2Gm2nSk8Phduj4f7_EFG36uGnVdIs.apk`
- O la página del build, que requiere ser miembro de `josedev2004s-team` en expo.dev:
  `https://expo.dev/accounts/josedev2004s-team/projects/pasaje/builds/9853c593-7346-4f1b-b251-268dcdbf14a5`

**Solo hace falta compilar otra vez** (`eas build --profile development --platform android`) cuando cambia algo **nativo**: una librería con código Android, el módulo `pasaje-hce` o los `plugins` de `app.json`. Los cambios de pantallas, estilos y lógica **no** requieren build nuevo.

> Si `eas build` pregunta *"Install and run on an emulator?"*, responde **no**. Sin Android SDK en el PC falla con `spawn adb ENOENT`, aunque el build ya haya salido bien.

### 3.2 Conectar la app al backend (`app/.env`)

Sin `app/.env`, la app funciona en **modo mocks**: todo es de mentira y **no llega nada a la base de datos**. Por ejemplo, las recargas solo viven en la memoria del teléfono.

Crea `app/.env`. Está en `.gitignore`, así que **cada uno lo crea en su equipo**:

```
EXPO_PUBLIC_USE_MOCKS=false
EXPO_PUBLIC_API_HOST=<IP-del-PC-con-el-backend>:3000
```

- Usa la **IP del PC** en la red Wi-Fi, no `localhost`. En el teléfono, `localhost` es el propio teléfono.
- Después, reinicia Metro limpiando la caché: `pnpm start --clear`.
- El teléfono y el PC tienen que estar en la **misma Wi-Fi**.
- El backend tiene que estar corriendo: `npm run dev` en `bk-ruta67`.

### 3.3 Arrancar

```bash
cd app
pnpm install
pnpm start          # o: pnpm start --clear si cambiaste el .env
```

En el teléfono, abre **Pasaje** (no Expo Go) y elige el servidor `http://<IP-del-PC>:8081`, o escanea el QR **desde dentro de Pasaje**.

Cuentas de prueba (clave `1234`): `04140000001` pasajera estudiante · `04140000004` pasajero general · `04140000005` pasajera exonerada · `04140000002` recolector.

---

## 4. ⚠️ Problema encontrado: el HCE (Pagar) no está en el repositorio

Al abrir **Pagar** aparece *"Módulo NFC no disponible: hace falta el dev build"*. **No lo causan estas pantallas.**

- La regla `android/` del `.gitignore` ignoraba **cualquier** carpeta llamada `android`, incluida `app/modules/pasaje-hce/android/`, donde está el código Kotlin del HCE.
- Por eso en git solo existe `app/modules/pasaje-hce/expo-module.config.json`, y el APK compilado desde el repo **no incluye el módulo** (se comprobó inspeccionando el APK).
- Andy lo tiene en su PC. Le funciona porque compila localmente.

**En esta rama:** el `.gitignore` ahora ignora solo las carpetas que genera el prebuild (`/app/android/`, `/app/ios/`).

**Falta:**
1. **Andy** sube `app/modules/pasaje-hce/android/`.
2. Se compila un **dev build nuevo** y todos lo reinstalan.

Hasta entonces, el pago por NFC no funciona con el APK de EAS. El cobro (modo recolector) sí, en teléfonos con NFC.

### Teléfonos sin NFC

En un teléfono sin NFC, **Pagar** muestra *"Este teléfono no puede pagar por NFC"* y **Cobrar** muestra *"El NFC está apagado o no está disponible"*. Es el comportamiento correcto. Todas las demás pantallas funcionan igual. El cobro real necesita **dos Android con NFC**.

---

## 5. Archivos

### Nuevos
| Dónde | Qué |
|---|---|
| `pantallas/auth/RegistroScreen.tsx` | Registro de pasajeros |
| `pantallas/pasajero/RecargarScreen.tsx` | Recargar saldo |
| `pantallas/pasajero/HistorialScreen.tsx` | Viajes + movimientos |
| `pantallas/pasajero/useBilletera.ts` | Carga la billetera cada vez que la pantalla recibe el foco |
| `nucleo/api/pasajeroApi.ts` | `obtenerBilletera`, `recargar`, `listarMovimientos`, `obtenerLineas`, `listarViajes`. Cambia sola entre mocks y backend |
| `nucleo/api/errores.ts` | `mensajeDeError`: muestra el `mensaje` del backend tal cual (contrato §4) |
| `nucleo/mocks/pasajero.ts` | Mocks con la forma de `bk-ruta67/mocks`. Guardan estado en memoria (recargar suma saldo) |
| `nucleo/types/billetera.ts` | `Billetera`, `Aviso`, `Recarga`, `Movimiento` |
| `componentes/formato.ts` | `formatearBs`, `formatearFechaHora`, `bsACentimos` y los datos de las categorías |
| `componentes/atoms/` | `Tarjeta`, `Chip`, `IconoCirculo` |
| `componentes/molecules/` | `CampoFormulario`, `SelectorCategoria`, `FilaLista`, `BannerAviso`, `AccesoRapido`, `Segmentado`, `EncabezadoMarca` |
| `componentes/organisms/TarjetaSaldo.tsx` | Tarjeta morada de saldo del Inicio |
| `componentes/templates/Pantalla.tsx` | Plantilla: área segura, encabezado, "tirar para refrescar" y pie fijo. Deja el espacio de los botones de Android fuera de las pestañas |

### Modificados (compartidos con Andy; solo se añadió, nada se quitó)
| Archivo | Cambio |
|---|---|
| `nucleo/api/authApi.ts` | + `registrar()` (`POST /auth/registro`, con mock) |
| `nucleo/auth/AuthContext.tsx` | + `registrar` en el contexto |
| `nucleo/navigation/RootNavigator.tsx` / `types.ts` | Registro, Historial y Recargar; iconos en las pestañas (también en Cobrar) |
| `nucleo/theme/index.ts` | + colores (`textoSuave`, `borde`, `exitoClaro`, `errorClaro`, `aviso`, `avisoClaro`), `radius.lg`, `spacing.xxl`, `sombra` |
| `componentes/atoms/AppText.tsx` | + variantes `subtitulo` y `cifra` |
| `componentes/atoms/Boton.tsx` | + props `icono` y `cargando` (opcionales) |
| `componentes/molecules/ContadorDia.tsx` | `formatearBs` se movió a `componentes/formato.ts`. Aquí se reexporta, así que los imports existentes siguen funcionando |
| `package.json` | + `@expo/vector-icons` (solo JavaScript; usa `expo-font`, que ya está en el build) |
| `app.json` | `projectId` de EAS (`josedev2004s-team`) y permiso `NFC`. **Hace falta** para que el resto del equipo compile en el mismo proyecto EAS |
| `.gitignore` (raíz) | `android/` → `/app/android/` (ver §4) |

---

## 6. Pendiente

- [ ] Andy sube `app/modules/pasaje-hce/android/` y se compila un dev build nuevo.
- [ ] Probar Pagar y Cobrar entre dos teléfonos con NFC.
- [ ] Invitar a Andy y Juan a `josedev2004s-team` en expo.dev (rol *Developer*) para que puedan descargar y compilar.
- [ ] "🎫 N boletos listos" usa `billetera.boletosActivos` del backend. Cuando Andy conecte la descarga de boletos, puede pasar a contar los guardados en el teléfono.
- [ ] Siguientes pantallas del contrato: Mapa (pasajero) y Mi línea, Cobros de hoy, Mapa y "En turno" (recolector).

---

## 7. Notas

- **`pnpm test` con Node 20:** el patrón `nucleo/**/*.test.ts` no se expande en Node 20 (sí desde Node 22). Mientras tanto:
  `pnpm exec tsx --test $(find nucleo -name '*.test.ts')`
- **Backend y base de datos:** revisa a dónde apunta `DATABASE_URL` en `bk-ruta67/.env` (Supabase o el Postgres local en `localhost:5433`). `npm run bd:reiniciar` **borra los datos** de la base a la que apunte.
