import { createAudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';
import { AudioUnavailableError } from '../types/errors';

/**
 * Attempts to play a pre-recorded MP3 asset for the given word.
 * Uses a static asset map — words without a pre-recorded file throw immediately.
 */
async function playWithAsset(word: string): Promise<void> {
  // Static asset map: add entries here as audio files are added to assets/audio/
  const assetMap: Record<string, ReturnType<typeof require>> = {
    // e.g. accommodate: require('../../assets/audio/accommodate.mp3'),
  };

  const source = assetMap[word.toLowerCase()];
  if (source === undefined) {
    throw new Error(`No audio asset for word: ${word}`);
  }

  const player = createAudioPlayer(source);
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
 * Falls back to text-to-speech using British English.
 */
async function playWithTTS(word: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    Speech.speak(word, {
      language: 'en-GB',
      onDone: resolve,
      onError: (error) => reject(error),
    });
  });
}

export const AudioService = {
  /**
   * Plays the pronunciation of a word.
   * 1. Tries a pre-recorded asset from assets/audio/{word}.mp3
   * 2. Falls back to expo-speech TTS with en-GB locale
   * 3. Throws AudioUnavailableError if both fail
   */
  async playWord(word: string): Promise<void> {
    try {
      await playWithAsset(word);
      return;
    } catch {
      // Asset not available — fall through to TTS
    }

    try {
      await playWithTTS(word);
      return;
    } catch {
      // TTS also failed
    }

    throw new AudioUnavailableError(word, 'tts-failed');
  },
};
