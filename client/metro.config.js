const {
  withStorybook,
} = require('@storybook/react-native/withStorybook');

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

config.resolver.resolveRequest = (context, moduleName, platform) =>
  context.resolveRequest(
    context,
    moduleName === 'expo-file-system' &&
      context.originModulePath.includes('react-native-appwrite')
      ? 'expo-file-system/legacy'
      : moduleName,
    platform,
  );

module.exports = withStorybook(config);
