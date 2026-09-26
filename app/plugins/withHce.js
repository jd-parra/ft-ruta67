// Config plugin para react-native-hce (Android): permiso NFC, servicio
// HostApduService y aid_list.xml. Se aplica en cada `expo prebuild`.
const fs = require("fs");
const path = require("path");
const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require("@expo/config-plugins");

const AID = "F0504153450002"; // AID propietario (contrato sección 9)

const AID_LIST = `<?xml version="1.0" encoding="utf-8"?>
<host-apdu-service xmlns:android="http://schemas.android.com/apk/res/android"
    android:description="@string/app_name"
    android:requireDeviceUnlock="false">
  <aid-group android:category="other" android:description="@string/app_name">
    <aid-filter android:name="${AID}" />
  </aid-group>
</host-apdu-service>
`;

const withManifest = (config) =>
  withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    manifest["uses-permission"] = manifest["uses-permission"] ?? [];
    if (!manifest["uses-permission"].some((p) => p.$["android:name"] === "android.permission.NFC")) {
      manifest["uses-permission"].push({ $: { "android:name": "android.permission.NFC" } });
    }

    manifest["uses-feature"] = manifest["uses-feature"] ?? [];
    if (!manifest["uses-feature"].some((f) => f.$["android:name"] === "android.hardware.nfc.hce")) {
      manifest["uses-feature"].push({
        $: { "android:name": "android.hardware.nfc.hce", "android:required": "true" },
      });
    }

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    app.service = app.service ?? [];
    if (!app.service.some((s) => s.$["android:name"] === "com.reactnativehce.services.CardService")) {
      app.service.push({
        $: {
          "android:name": "com.reactnativehce.services.CardService",
          "android:exported": "true",
          "android:enabled": "false",
          "android:permission": "android.permission.BIND_NFC_SERVICE",
        },
        "intent-filter": [
          {
            action: [{ $: { "android:name": "android.nfc.cardemulation.action.HOST_APDU_SERVICE" } }],
            category: [{ $: { "android:name": "android.intent.category.DEFAULT" } }],
          },
        ],
        "meta-data": [
          {
            $: {
              "android:name": "android.nfc.cardemulation.host_apdu_service",
              "android:resource": "@xml/aid_list",
            },
          },
        ],
      });
    }
    return cfg;
  });

const withAidList = (config) =>
  withDangerousMod(config, [
    "android",
    async (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, "app/src/main/res/xml");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "aid_list.xml"), AID_LIST);
      return cfg;
    },
  ]);

module.exports = (config) => withAidList(withManifest(config));
