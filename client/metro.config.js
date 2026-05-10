const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  'reanimated-color-picker': path.resolve(
    __dirname,
    'node_modules/reanimated-color-picker/lib/commonjs',
  ),
};

module.exports = config;
