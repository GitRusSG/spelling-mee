import { AudioUnavailableError } from '../../types/errors';
import { AudioService, resolveAudioSource } from '../AudioService';
import type { AudioSourceConfig, AudioSourceType } from '../AudioService';

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
    it('falls back to TTS when no dictation URL is provided', async () => {
      mockSpeak.mockImplementation((_word: string, opts: any) => {
        opts.onDone?.();
      });

      const result = await AudioService.playWord('cat');
      expect(result.sourceUsed).toBe('default');
      expect(mockSpeak).toHaveBeenCalledWith(
        'cat',
        expect.objectContaining({ language: 'en-GB' })
      );
    });

    it('throws AudioUnavailableError when all sources fail', async () => {
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

  describe('playWord — dictation priority', () => {
    it('uses dictation URL when provided and playback succeeds', async () => {
      mockCreateAudioPlayer.mockReturnValue({
        addListener: (_event: string, callback: any) => {
          // Simulate successful playback
          setTimeout(() => callback({ didJustFinish: true }), 0);
          return { remove: jest.fn() };
        },
        play: jest.fn(),
      });

      const result = await AudioService.playWord('hello', {
        dictationUrl: 'https://storage.example.com/hello.m4a',
      });

      expect(result.sourceUsed).toBe('dictation');
      expect(mockCreateAudioPlayer).toHaveBeenCalledWith({ uri: 'https://storage.example.com/hello.m4a' });
      expect(mockSpeak).not.toHaveBeenCalled();
    });

    it('falls back to voice profile when dictation fails', async () => {
      mockCreateAudioPlayer.mockReturnValue({
        addListener: (_event: string, callback: any) => {
          setTimeout(() => callback({ error: 'Network error' }), 0);
          return { remove: jest.fn() };
        },
        play: jest.fn(),
      });

      mockSpeak.mockImplementation((_word: string, opts: any) => {
        opts.onDone?.();
      });

      const result = await AudioService.playWord('hello', {
        dictationUrl: 'https://storage.example.com/hello.m4a',
        voiceProfile: { voiceId: 'en-gb-male', speed: 1.0, label: 'British Male' },
      });

      expect(result.sourceUsed).toBe('voice-profile');
      expect(mockSpeak).toHaveBeenCalledWith(
        'hello',
        expect.objectContaining({ voice: 'en-gb-male', rate: 1.0 })
      );
    });

    it('falls back to default TTS when dictation and voice profile both fail', async () => {
      mockCreateAudioPlayer.mockReturnValue({
        addListener: (_event: string, callback: any) => {
          setTimeout(() => callback({ error: 'Network error' }), 0);
          return { remove: jest.fn() };
        },
        play: jest.fn(),
      });

      // First call (voice profile) fails, second call (default) succeeds
      let callCount = 0;
      mockSpeak.mockImplementation((_word: string, opts: any) => {
        callCount++;
        if (callCount === 1) {
          opts.onError?.(new Error('Voice not available'));
        } else {
          opts.onDone?.();
        }
      });

      const result = await AudioService.playWord('hello', {
        dictationUrl: 'https://storage.example.com/hello.m4a',
        voiceProfile: { voiceId: 'en-gb-male', speed: 1.0, label: 'British Male' },
      });

      expect(result.sourceUsed).toBe('default');
    });
  });

  describe('playWord — voice profile without dictation', () => {
    it('uses voice profile when no dictation URL is provided', async () => {
      mockSpeak.mockImplementation((_word: string, opts: any) => {
        opts.onDone?.();
      });

      const result = await AudioService.playWord('spell', {
        voiceProfile: { voiceId: 'en-gb-female', speed: 0.8, label: 'British Female' },
      });

      expect(result.sourceUsed).toBe('voice-profile');
      expect(mockSpeak).toHaveBeenCalledWith(
        'spell',
        expect.objectContaining({ voice: 'en-gb-female', rate: 0.8 })
      );
    });

    it('falls back to default TTS when voice profile fails', async () => {
      let callCount = 0;
      mockSpeak.mockImplementation((_word: string, opts: any) => {
        callCount++;
        if (callCount === 1) {
          opts.onError?.(new Error('Voice not available'));
        } else {
          opts.onDone?.();
        }
      });

      const result = await AudioService.playWord('spell', {
        voiceProfile: { voiceId: 'en-gb-female', speed: 0.8, label: 'British Female' },
      });

      expect(result.sourceUsed).toBe('default');
    });
  });
});

describe('resolveAudioSource', () => {
  it('returns dictation when available and not failed', () => {
    const config: AudioSourceConfig = {
      hasDictation: true,
      dictationFailed: false,
      hasVoiceProfile: true,
      voiceProfileFailed: false,
    };
    expect(resolveAudioSource(config)).toBe('dictation');
  });

  it('returns voice-profile when dictation not available', () => {
    const config: AudioSourceConfig = {
      hasDictation: false,
      dictationFailed: false,
      hasVoiceProfile: true,
      voiceProfileFailed: false,
    };
    expect(resolveAudioSource(config)).toBe('voice-profile');
  });

  it('returns voice-profile when dictation failed', () => {
    const config: AudioSourceConfig = {
      hasDictation: true,
      dictationFailed: true,
      hasVoiceProfile: true,
      voiceProfileFailed: false,
    };
    expect(resolveAudioSource(config)).toBe('voice-profile');
  });

  it('returns default when no dictation and no voice profile', () => {
    const config: AudioSourceConfig = {
      hasDictation: false,
      dictationFailed: false,
      hasVoiceProfile: false,
      voiceProfileFailed: false,
    };
    expect(resolveAudioSource(config)).toBe('default');
  });

  it('returns default when both dictation and voice profile failed', () => {
    const config: AudioSourceConfig = {
      hasDictation: true,
      dictationFailed: true,
      hasVoiceProfile: true,
      voiceProfileFailed: true,
    };
    expect(resolveAudioSource(config)).toBe('default');
  });

  it('returns default when voice profile not available and dictation failed', () => {
    const config: AudioSourceConfig = {
      hasDictation: true,
      dictationFailed: true,
      hasVoiceProfile: false,
      voiceProfileFailed: false,
    };
    expect(resolveAudioSource(config)).toBe('default');
  });
});
