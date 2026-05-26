import { VoiceProfile, VoiceOption } from '../../types';
import {
  VoiceSelectionService,
  DEFAULT_VOICE_PROFILE,
  FALLBACK_VOICES,
  VOICE_PROFILE_KEY,
  _setStorage,
} from '../VoiceSelectionService';
import { KVStorage } from '../storage';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetAvailableVoicesAsync = jest.fn();

jest.mock('expo-speech', () => ({
  getAvailableVoicesAsync: (...args: any[]) => mockGetAvailableVoicesAsync(...args),
  VoiceQuality: { Enhanced: 'Enhanced' },
}));

jest.mock('../storage', () => ({
  createStorage: jest.fn(),
}));

// In-memory mock storage
function createMockStorage(): KVStorage & { _store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    _store: store,
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VoiceSelectionService', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = createMockStorage();
    _setStorage(mockStorage);
  });

  afterEach(() => {
    _setStorage(null);
  });

  // ─── getAvailableVoices ───────────────────────────────────────────────────

  describe('getAvailableVoices', () => {
    it('returns mapped English voices from the platform', async () => {
      mockGetAvailableVoicesAsync.mockResolvedValue([
        { identifier: 'com.apple.voice.en-GB.kate', name: 'Kate (Female)', language: 'en-GB', quality: 'Default' },
        { identifier: 'com.apple.voice.en-GB.daniel', name: 'Daniel (Male)', language: 'en-GB', quality: 'Default' },
        { identifier: 'com.apple.voice.en-US.samantha', name: 'Samantha (Female)', language: 'en-US', quality: 'Enhanced' },
      ]);

      const voices = await VoiceSelectionService.getAvailableVoices();

      expect(voices).toHaveLength(3);
      expect(voices[0]).toEqual<VoiceOption>({
        id: 'com.apple.voice.en-GB.kate',
        name: 'Kate (Female)',
        language: 'en-GB',
        gender: 'female',
        quality: 'default',
      });
      expect(voices[1]).toEqual<VoiceOption>({
        id: 'com.apple.voice.en-GB.daniel',
        name: 'Daniel (Male)',
        language: 'en-GB',
        gender: 'male',
        quality: 'default',
      });
      expect(voices[2]).toEqual<VoiceOption>({
        id: 'com.apple.voice.en-US.samantha',
        name: 'Samantha (Female)',
        language: 'en-US',
        gender: 'female',
        quality: 'enhanced',
      });
    });

    it('filters out non-English voices', async () => {
      mockGetAvailableVoicesAsync.mockResolvedValue([
        { identifier: 'en-GB-1', name: 'English Voice 1 (Female)', language: 'en-GB', quality: 'Default' },
        { identifier: 'fr-FR-1', name: 'French Voice', language: 'fr-FR', quality: 'Default' },
        { identifier: 'en-US-1', name: 'English Voice 2 (Male)', language: 'en-US', quality: 'Default' },
        { identifier: 'de-DE-1', name: 'German Voice', language: 'de-DE', quality: 'Default' },
        { identifier: 'en-AU-1', name: 'Australian Voice (Female)', language: 'en-AU', quality: 'Default' },
      ]);

      const voices = await VoiceSelectionService.getAvailableVoices();

      expect(voices).toHaveLength(3);
      expect(voices.every(v => v.language.startsWith('en'))).toBe(true);
    });

    it('includes fallback voices when fewer than 3 English voices are available', async () => {
      mockGetAvailableVoicesAsync.mockResolvedValue([
        { identifier: 'en-GB-single', name: 'Single Voice (Female)', language: 'en-GB', quality: 'Default' },
      ]);

      const voices = await VoiceSelectionService.getAvailableVoices();

      // 1 platform voice + fallbacks to reach at least 3
      expect(voices.length).toBeGreaterThanOrEqual(3);
      // The platform voice should be first
      expect(voices[0].id).toBe('en-GB-single');
    });

    it('includes all fallback voices when platform returns no English voices', async () => {
      mockGetAvailableVoicesAsync.mockResolvedValue([
        { identifier: 'fr-FR-1', name: 'French Voice', language: 'fr-FR', quality: 'Default' },
      ]);

      const voices = await VoiceSelectionService.getAvailableVoices();

      expect(voices).toHaveLength(3);
      expect(voices).toEqual(FALLBACK_VOICES);
    });

    it('includes all fallback voices when platform returns empty array', async () => {
      mockGetAvailableVoicesAsync.mockResolvedValue([]);

      const voices = await VoiceSelectionService.getAvailableVoices();

      expect(voices).toHaveLength(3);
      expect(voices).toEqual(FALLBACK_VOICES);
    });

    it('does not duplicate fallback voices that match platform voice ids', async () => {
      mockGetAvailableVoicesAsync.mockResolvedValue([
        { identifier: 'en-GB-female-default', name: 'British English Female', language: 'en-GB', quality: 'Default' },
      ]);

      const voices = await VoiceSelectionService.getAvailableVoices();

      const ids = voices.map(v => v.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('infers gender as neutral when name has no gender indicators', async () => {
      mockGetAvailableVoicesAsync.mockResolvedValue([
        { identifier: 'en-GB-1', name: 'Siri', language: 'en-GB', quality: 'Default' },
        { identifier: 'en-GB-2', name: 'Google UK', language: 'en-GB', quality: 'Default' },
        { identifier: 'en-GB-3', name: 'Cortana', language: 'en-GB', quality: 'Default' },
      ]);

      const voices = await VoiceSelectionService.getAvailableVoices();

      expect(voices[0].gender).toBe('neutral');
      expect(voices[1].gender).toBe('neutral');
      expect(voices[2].gender).toBe('neutral');
    });
  });

  // ─── getActiveProfile ─────────────────────────────────────────────────────

  describe('getActiveProfile', () => {
    it('returns the default profile when nothing is stored', () => {
      const profile = VoiceSelectionService.getActiveProfile();

      expect(profile).toEqual(DEFAULT_VOICE_PROFILE);
    });

    it('returns the stored profile when valid JSON is saved', () => {
      const savedProfile: VoiceProfile = {
        voiceId: 'com.apple.voice.en-GB.daniel',
        speed: 0.8,
        label: 'Daniel Slow',
      };
      mockStorage.set(VOICE_PROFILE_KEY, JSON.stringify(savedProfile));

      const profile = VoiceSelectionService.getActiveProfile();

      expect(profile).toEqual(savedProfile);
    });

    it('returns the default profile when stored JSON is invalid', () => {
      mockStorage.set(VOICE_PROFILE_KEY, 'not-valid-json');

      const profile = VoiceSelectionService.getActiveProfile();

      expect(profile).toEqual(DEFAULT_VOICE_PROFILE);
    });

    it('returns the default profile when stored data is missing required fields', () => {
      mockStorage.set(VOICE_PROFILE_KEY, JSON.stringify({ voiceId: '', speed: 1.0, label: 'Test' }));

      const profile = VoiceSelectionService.getActiveProfile();

      expect(profile).toEqual(DEFAULT_VOICE_PROFILE);
    });

    it('returns the default profile when speed is not a number', () => {
      mockStorage.set(VOICE_PROFILE_KEY, JSON.stringify({ voiceId: 'test', speed: 'fast', label: 'Test' }));

      const profile = VoiceSelectionService.getActiveProfile();

      expect(profile).toEqual(DEFAULT_VOICE_PROFILE);
    });

    it('returns the default profile when label is empty', () => {
      mockStorage.set(VOICE_PROFILE_KEY, JSON.stringify({ voiceId: 'test', speed: 1.0, label: '' }));

      const profile = VoiceSelectionService.getActiveProfile();

      expect(profile).toEqual(DEFAULT_VOICE_PROFILE);
    });
  });

  // ─── saveProfile ──────────────────────────────────────────────────────────

  describe('saveProfile', () => {
    it('persists the profile to storage as JSON', () => {
      const profile: VoiceProfile = {
        voiceId: 'com.apple.voice.en-GB.kate',
        speed: 1.2,
        label: 'Kate Fast',
      };

      VoiceSelectionService.saveProfile(profile);

      const stored = mockStorage.getString(VOICE_PROFILE_KEY);
      expect(stored).toBeDefined();
      expect(JSON.parse(stored!)).toEqual(profile);
    });

    it('overwrites a previously saved profile', () => {
      const first: VoiceProfile = { voiceId: 'voice-1', speed: 1.0, label: 'First' };
      const second: VoiceProfile = { voiceId: 'voice-2', speed: 0.7, label: 'Second' };

      VoiceSelectionService.saveProfile(first);
      VoiceSelectionService.saveProfile(second);

      const stored = mockStorage.getString(VOICE_PROFILE_KEY);
      expect(JSON.parse(stored!)).toEqual(second);
    });

    it('round-trips correctly with getActiveProfile', () => {
      const profile: VoiceProfile = {
        voiceId: 'en-GB-male-default',
        speed: 0.5,
        label: 'British Male Slow',
      };

      VoiceSelectionService.saveProfile(profile);
      const loaded = VoiceSelectionService.getActiveProfile();

      expect(loaded).toEqual(profile);
    });
  });
});
