// Feature: dictation-voices-accounts, Property 8: Audio source priority resolution
import * as fc from 'fast-check';
import { resolveAudioSource, AudioSourceConfig, AudioSourceType } from '../AudioService';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// ─── Property Test ────────────────────────────────────────────────────────────

/**
 * **Validates: Requirements 6.1, 6.2, 6.4, 7.5, 8.4, 9.1, 9.2, 9.4**
 *
 * Property 8: Audio source priority resolution
 *
 * For any word configuration consisting of an optional dictation URL (available
 * or failed), an optional active voice profile, and a default TTS voice, the
 * audio source resolver SHALL return the highest-priority available source
 * following the order: (1) dictation recording, (2) TTS with active voice
 * profile, (3) default TTS. If a source is marked as failed, the resolver SHALL
 * skip it and try the next. The resolved source type indicator SHALL match the
 * source actually selected.
 */
describe('Property 8: Audio source priority resolution', () => {
  it('resolves the highest-priority available audio source for any configuration', () => {
    fc.assert(
      fc.property(
        fc.record({
          hasDictation: fc.boolean(),
          dictationFailed: fc.boolean(),
          hasVoiceProfile: fc.boolean(),
          voiceProfileFailed: fc.boolean(),
        }),
        (config: AudioSourceConfig) => {
          const result: AudioSourceType = resolveAudioSource(config);

          // Priority 1: dictation available and not failed
          if (config.hasDictation && !config.dictationFailed) {
            expect(result).toBe('dictation');
            return;
          }

          // Priority 2: voice profile available and not failed
          if (config.hasVoiceProfile && !config.voiceProfileFailed) {
            expect(result).toBe('voice-profile');
            return;
          }

          // Priority 3: default TTS (fallback)
          expect(result).toBe('default');
        }
      ),
      { numRuns: 100 }
    );
  });
});
