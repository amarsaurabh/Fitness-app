const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// MMKV requires this to resolve native modules correctly
config.resolver.assetExts.push('lottie');

module.exports = withNativeWind(config, { input: './global.css' });
