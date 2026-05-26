'use strict';

/**
 * Jest config for pure TypeScript tests (property-based and unit tests
 * that don't require a full React Native environment).
 * Bypasses jest-expo's setup.js which fails outside a simulator.
 */
module.exports = {
  testEnvironment: 'node',
  globals: {
    __DEV__: true,
  },
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        caller: { name: 'metro', bundler: 'metro', platform: 'ios' },
        configFile: './babel.config.js',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|fast-check)',
  ],
  testMatch: [
    '**/__tests__/**/*.property.test.ts',
    '**/__tests__/**/*.test.ts',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    'AudioService\\.test\\.ts$',
  ],
};
