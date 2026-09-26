const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// /shared vive fuera de /app y lo usan backend y app.
config.watchFolders = [path.resolve(__dirname, "../shared")];

module.exports = config;
