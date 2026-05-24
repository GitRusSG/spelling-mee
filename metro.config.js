const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Provide empty shims for native-only modules on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    // Native-only modules that should be shimmed on web
    const nativeOnlyModules = [
      'react-native-google-mobile-ads',
      'react-native-iap',
      'react-native-mmkv',
    ];

    if (nativeOnlyModules.some((mod) => moduleName === mod || moduleName.startsWith(mod + '/'))) {
      return {
        type: 'empty',
      };
    }
  }

  // Fall back to default resolution
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
