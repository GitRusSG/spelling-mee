import { Platform } from 'react-native';
import { AudioUnavailableError } from '../types/errors';
import type { PlayWordOptions, VoiceProfile } from '../types/index';

// ─── Audio Source Resolution (Pure Function) ─────────────────────────────────

export interface AudioSourceConfig {
  hasDictation: boolean;
  dictationFailed: boolean;
  hasVoiceProfile: boolean;
  voiceProfileFailed: boolean;
}

export type AudioSourceType = 'dictation' | 'voice-profile' | 'default';

/**
 * Pure function that determines which audio source to use based on availability
 * and failure state. Follows priority: dictation > voice-profile > default.
 */
export function resolveAudioSource(config: AudioSourceConfig): AudioSourceType {
  if (config.hasDictation && !config.dictationFailed) {
    return 'dictation';
  }
  if (config.hasVoiceProfile && !config.voiceProfileFailed) {
    return 'voice-profile';
  }
  return 'default';
}

// ─── Internal Playback Helpers ───────────────────────────────────────────────

/**
 * Plays a dictation recording from a remote URL using expo-audio player.
 */
async function playDictation(url: string): Promise<void> {
  const { createAudioPlayer } = require('expo-audio');

  const player = createAudioPlayer({ uri: url });
  await new Promise<void>((resolve, reject) => {
    const subscription = player.addListener('playbackStatusUpdate', (status: any) => {
      if (status.didJustFinish) {
        subscription.remove();
        resolve();
      }
      if (status.error) {
        subscription.remove();
        reject(new Error(status.error));
      }
    });
    player.play();
  });
}

/**
 * Plays a word using TTS with a specific voice profile (voiceId and speed).
 */
async function playWithVoiceProfile(word: string, profile: VoiceProfile): Promise<void> {
  if (Platform.OS === 'web') {
    return new Promise<void>((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported'));
        return;
      }
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-GB';
      utterance.rate = profile.speed * 0.85; // Slightly slower for clarity
      utterance.pitch = profile.pitch ?? 1.0;

      const voices = window.speechSynthesis.getVoices();
      // Try exact match first, then fall back to Google voices
      const selectedVoice = voices.find(v => v.voiceURI === profile.voiceId)
        || voices.find(v => v.name === profile.voiceId)
        || voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      window.speechSynthesis.speak(utterance);
    });
  }

  const Speech = require('expo-speech');
  return new Promise<void>((resolve, reject) => {
    Speech.speak(word, {
      language: 'en-GB',
      voice: profile.voiceId,
      rate: profile.speed,
      pitch: profile.pitch ?? 1.0,
      onDone: resolve,
      onError: (error: any) => reject(error),
    });
  });
}

/**
 * Falls back to default text-to-speech using Google's high-quality voice.
 * Prioritizes Google voices (same quality as Google Translate).
 */
async function playWithDefaultTTS(word: string): Promise<void> {
  if (Platform.OS === 'web') {
    return new Promise<void>((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported'));
        return;
      }

      // Ensure voices are loaded (Chrome loads them async)
      const attemptSpeak = () => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.7;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();

        // Priority: Google voices (Google Translate quality)
        const googleVoice = voices.find(v => v.name.includes('Google US English'))
          || voices.find(v => v.name.includes('Google UK English Female'))
          || voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
          || voices.find(v => v.lang === 'en-US')
          || voices.find(v => v.lang.startsWith('en'));

        if (googleVoice) {
          utterance.voice = googleVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = (e) => reject(e);
        window.speechSynthesis.speak(utterance);
      };

      // Chrome sometimes needs a moment to load voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          attemptSpeak();
        };
        // Fallback timeout in case event never fires
        setTimeout(attemptSpeak, 100);
      } else {
        attemptSpeak();
      }
    });
  }

  const Speech = require('expo-speech');
  return new Promise<void>((resolve, reject) => {
    Speech.speak(word, {
      language: 'en-US',
      onDone: resolve,
      onError: (error: any) => reject(error),
    });
  });
}

// ─── Public AudioService ─────────────────────────────────────────────────────

export interface PlayWordResult {
  sourceUsed: AudioSourceType;
}

export const AudioService = {
  /**
   * Plays the pronunciation of a word following the audio source priority:
   * 1. Dictation recording (if dictationUrl provided)
   * 2. TTS with voice profile (if voiceProfile provided)
   * 3. Default TTS (en-GB female)
   *
   * Falls back through the chain on failure at each level.
   * Throws AudioUnavailableError if all sources fail.
   */
  async playWord(word: string, options?: PlayWordOptions): Promise<PlayWordResult> {
    const dictationUrl = options?.dictationUrl;
    const voiceProfile = options?.voiceProfile;

    // Try dictation recording first
    if (dictationUrl) {
      try {
        await playDictation(dictationUrl);
        return { sourceUsed: 'dictation' };
      } catch {
        // Dictation failed — fall through to voice profile
      }
    }

    // Try TTS with voice profile
    if (voiceProfile) {
      try {
        await playWithVoiceProfile(word, voiceProfile);
        return { sourceUsed: 'voice-profile' };
      } catch {
        // Voice profile TTS failed — fall through to default
      }
    }

    // Try default TTS
    try {
      await playWithDefaultTTS(word);
      return { sourceUsed: 'default' };
    } catch {
      // All sources failed
    }

    throw new AudioUnavailableError(word, 'tts-failed');
  },
};
