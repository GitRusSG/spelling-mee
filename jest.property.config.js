'use strict';

/**
 * Minimal Jest config for pure TypeScript property-based tests.
 * Bypasses jest-expo's setup.js which fails in this environment
 * when running pure TS tests that don't need React Native mocks.
 */
module.exports = {
  testEnvironment: 'node',
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
  testMatch: ['**/__tests__/**/*.property.test.ts'],
};
