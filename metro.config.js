const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Block Metro from watching Android/iOS build folders inside node_modules.
// This prevents the "UNKNOWN: unknown error, scandir" crash on Windows.
config.resolver.blockList = [
  ...config.resolver.blockList,
  /.*\/android\/build\/.*/,
  /.*\/ios\/build\/.*/,
  /.*\/node_modules\/.*\/android\/build\/.*/,
  /.*\/node_modules\/.*\/ios\/build\/.*/,
  /.*\\android\\build\\.*/,
  /.*\\ios\\build\\.*/,
  /.*\\node_modules\\.*\\android\\build\\.*/,
  /.*\\node_modules\\.*\\ios\\build\\.*/
];

module.exports = config;
