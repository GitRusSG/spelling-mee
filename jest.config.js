/**
 * Jest config for the Spelling Mee project.
 * Manually configures the jest environment to avoid jest-expo's setup.js
 * compatibility issue with Node.js v25.
 *
 * @type {import('jest').Config}
 */
const config = {
  haste: {
    defaultPlatform: 'ios',
    platforms: ['android', 'ios', 'native'],
  },
  transform: {
    '\\.[jt]sx?$': [
      'babel-jest',
      {
        caller: {
          name: 'metro',
          bundler: 'metro',
          platform: 'ios',
        },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-mmkv|react-native-iap|react-native-google-mobile-ads|@testing-library)',
  ],
  setupFiles: [
    require.resolve('react-native/jest/setup.js'),
  ],
  testEnvironment: require.resolve('react-native/jest/react-native-env.js'),
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/./$1',
  },
};

module.exports = config;
