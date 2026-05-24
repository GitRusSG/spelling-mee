import { Platform } from 'react-native';

/**
 * Platform-agnostic key-value storage interface.
 * Uses MMKV on native and localStorage on web.
 */
export interface KVStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

/**
 * Creates the appropriate storage backend for the current platform.
 */
export function createStorage(): KVStorage {
  if (Platform.OS === 'web') {
    return {
      getString(key: string): string | undefined {
        const value = localStorage.getItem(key);
        return value ?? undefined;
      },
      set(key: string, value: string): void {
        localStorage.setItem(key, value);
      },
      delete(key: string): void {
        localStorage.removeItem(key);
      },
    };
  }

  // Native: use MMKV
  const { MMKV } = require('react-native-mmkv');
  return new MMKV();
}
