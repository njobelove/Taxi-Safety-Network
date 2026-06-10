const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('web.js', 'js', 'json', 'ts', 'tsx');

module.exports = config;
