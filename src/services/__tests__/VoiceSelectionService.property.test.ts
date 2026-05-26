// Feature: dictation-voices-accounts, Property 9: Voice profile persistence round-trip
import * as fc from 'fast-check';
import { VoiceProfile } from '../../types';
import {
  VoiceSelectionService,
  _setStorage,
} from '../VoiceSelectionService';
import { KVStorage } from '../storage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('expo-speech', () => ({
  getAvailableVoicesAsync: jest.fn().mockResolvedValue([]),
  VoiceQuality: { Enhanced: 'Enhanced' },
}));

jest.mock('../storage', () => ({
  createStorage: jest.fn(),
}));

// In-memory mock storage
function createMockStorage(): KVStorage {
  const store = new Map<string, string>();
  return {
    getString(key: string): string | undefined {
      return store.get(key);
    },
    set(key: string, value: string): void {
      store.set(key, value);
    },
    delete(key: string): void {
      store.delete(key);
    },
  };
}

// ─── Property Test ────────────────────────────────────────────────────────────

/**
 * **Validates: Requirements 7.4, 8.3**
 *
 * Property 9: Voice profile persistence round-trip
 *
 * For any valid voice profile (non-empty voiceId, speed between 0.5 and 1.5
 * inclusive, non-empty label), saving it to storage and then loading the active
 * profile SHALL produce a profile equal to the one saved.
 */
describe('Property 9: Voice profile persistence round-trip', () => {
  let mockStorage: KVStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    _setStorage(mockStorage);
  });

  afterEach(() => {
    _setStorage(null);
  });

  it('saving a valid voice profile and loading it back produces an equal profile', () => {
    fc.assert(
      fc.property(
        fc.record({
          voiceId: fc.string({ minLength: 1 }),
          speed: fc.double({ min: 0.5, max: 1.5, noNaN: true }),
          label: fc.string({ minLength: 1 }),
        }),
        (profile: VoiceProfile) => {
          // Save the profile
          VoiceSelectionService.saveProfile(profile);

          // Load it back
          const loaded = VoiceSelectionService.getActiveProfile();

          // The loaded profile must equal the saved one
          expect(loaded.voiceId).toBe(profile.voiceId);
          expect(loaded.speed).toBe(profile.speed);
          expect(loaded.label).toBe(profile.label);
        }
      ),
      { numRuns: 100 }
    );
  });
});
