import * as Speech from 'expo-speech';
import { createStorage, KVStorage } from './storage';
import { VoiceOption, VoiceProfile } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const VOICE_PROFILE_KEY = 'voice_profile';

const DEFAULT_VOICE_PROFILE: VoiceProfile = {
  voiceId: 'en-GB-female-default',
  speed: 1.0,
  label: 'British English Female',
};

/**
 * Fallback voice options surfaced when the platform provides fewer than 3 English voices.
 */
const FALLBACK_VOICES: VoiceOption[] = [
  {
    id: 'en-GB-female-default',
    name: 'British English Female',
    language: 'en-GB',
    gender: 'female',
    quality: 'default',
  },
  {
    id: 'en-GB-male-default',
    name: 'British English Male',
    language: 'en-GB',
    gender: 'male',
    quality: 'default',
  },
  {
    id: 'en-GB-female-slow',
    name: 'British English Female (Slower)',
    language: 'en-GB',
    gender: 'female',
    quality: 'default',
  },
];

// ─── Storage ──────────────────────────────────────────────────────────────────

let storage: KVStorage | null = null;

function getStorage(): KVStorage {
  if (!storage) {
    storage = createStorage();
  }
  return storage;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Infers gender from a platform voice name/identifier.
 * Uses common naming patterns across iOS and Android TTS engines.
 */
function inferGender(voice: Speech.Voice): 'male' | 'female' | 'neutral' {
  const name = (voice.name || '').toLowerCase();
  const id = (voice.identifier || '').toLowerCase();
  const combined = `${name} ${id}`;

  if (combined.includes('female') || combined.includes('woman')) {
    return 'female';
  }
  if (combined.includes('male') || combined.includes('man')) {
    return 'male';
  }
  return 'neutral';
}

/**
 * Maps a platform Speech.Voice to our VoiceOption interface.
 */
function mapToVoiceOption(voice: Speech.Voice): VoiceOption {
  return {
    id: voice.identifier,
    name: voice.name || voice.identifier,
    language: voice.language,
    gender: inferGender(voice),
    quality: voice.quality === Speech.VoiceQuality?.Enhanced ? 'enhanced' : 'default',
  };
}

/**
 * Filters voices to English-language only.
 */
function isEnglishVoice(voice: Speech.Voice): boolean {
  return voice.language.startsWith('en');
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const VoiceSelectionService = {
  /**
   * Returns available English TTS voices from the platform.
   * If fewer than 3 are available, includes fallback options to ensure
   * at least British English female, male, and slower rate are surfaced.
   */
  async getAvailableVoices(): Promise<VoiceOption[]> {
    const platformVoices = await Speech.getAvailableVoicesAsync();
    const englishVoices = platformVoices.filter(isEnglishVoice);
    const mapped = englishVoices.map(mapToVoiceOption);

    if (mapped.length >= 3) {
      return mapped;
    }

    // Merge platform voices with fallbacks, avoiding duplicates by id
    const existingIds = new Set(mapped.map(v => v.id));
    const merged = [...mapped];

    for (const fallback of FALLBACK_VOICES) {
      if (!existingIds.has(fallback.id)) {
        merged.push(fallback);
        existingIds.add(fallback.id);
      }
    }

    return merged;
  },

  /**
   * Returns the currently active voice profile from local storage.
   * Falls back to the default British English female at normal speed.
   */
  getActiveProfile(): VoiceProfile {
    const stored = getStorage().getString(VOICE_PROFILE_KEY);
    if (!stored) {
      return { ...DEFAULT_VOICE_PROFILE };
    }

    try {
      const parsed = JSON.parse(stored) as VoiceProfile;
      // Validate essential fields
      if (parsed.voiceId && typeof parsed.speed === 'number' && parsed.label) {
        return parsed;
      }
      return { ...DEFAULT_VOICE_PROFILE };
    } catch {
      return { ...DEFAULT_VOICE_PROFILE };
    }
  },

  /**
   * Persists the given voice profile to local storage.
   */
  saveProfile(profile: VoiceProfile): void {
    getStorage().set(VOICE_PROFILE_KEY, JSON.stringify(profile));
  },
};

// ─── Exports for testing ──────────────────────────────────────────────────────

export { DEFAULT_VOICE_PROFILE, FALLBACK_VOICES, VOICE_PROFILE_KEY };

/**
 * Allows tests to inject a mock storage instance.
 * @internal
 */
export function _setStorage(mockStorage: KVStorage | null): void {
  storage = mockStorage;
}
