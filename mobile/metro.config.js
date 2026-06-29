const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Include font files in the bundle
config.resolver.assetExts.push('ttf', 'otf', 'woff', 'woff2');

module.exports = config;