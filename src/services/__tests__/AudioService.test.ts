import { AudioUnavailableError } from '../../types/errors';
import { AudioService } from '../AudioService';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPlay = jest.fn();
const mockAddListenerFn = jest.fn();
const mockCreateAudioPlayer = jest.fn();

jest.mock('expo-audio', () => ({
  createAudioPlayer: (...args: any[]) => mockCreateAudioPlayer(...args),
}));

const mockSpeak = jest.fn();
jest.mock('expo-speech', () => ({
  speak: (...args: any[]) => mockSpeak(...args),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AudioService', () => {
  beforeEach(() => {
    mockPlay.mockReset();
    mockAddListenerFn.mockReset();
    mockCreateAudioPlayer.mockReset();
    mockSpeak.mockReset();
  });

  describe('playWord — TTS fallback (no pre-recorded asset in map)', () => {
    it('falls back to TTS when no pre-recorded asset is available', async () => {
      // No asset in the static map → TTS is called
      mockSpeak.mockImplementation((_word: string, opts: any) => {
        opts.onDone?.();
      });

      await expect(AudioService.playWord('cat')).resolves.toBeUndefined();
      expect(mockSpeak).toHaveBeenCalledWith(
        'cat',
        expect.objectContaining({ language: 'en-GB' })
      );
    });

    it('throws AudioUnavailableError when both asset and TTS fail', async () => {
      mockSpeak.mockImplementation((_word: string, opts: any) => {
        opts.onError?.(new Error('TTS failed'));
      });

      await expect(AudioService.playWord('cat')).rejects.toBeInstanceOf(
        AudioUnavailableError
      );
    });

    it('AudioUnavailableError carries the correct word and reason', async () => {
      mockSpeak.mockImplementation((_word: string, opts: any) => {
        opts.onError?.(new Error('TTS failed'));
      });

      let caught: unknown;
      try {
        await AudioService.playWord('rhythm');
      } catch (err) {
        caught = err;
      }

      expect(caught).toBeInstanceOf(AudioUnavailableError);
      const audioErr = caught as AudioUnavailableError;
      expect(audioErr.word).toBe('rhythm');
      expect(audioErr.reason).toBe('tts-failed');
    });
  });
});
