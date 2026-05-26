// Feature: dictation-voices-accounts, Property 10: Voice option rendering completeness
import React from 'react';
import { render } from '@testing-library/react-native';
import fc from 'fast-check';
import VoiceCard from '../VoiceCard';
import { VoiceOption } from '../../types';

/**
 * Property 10: Voice option rendering completeness
 *
 * For any VoiceOption object with non-empty name, language, and gender,
 * the rendered VoiceCard output SHALL contain the voice name, a language/accent
 * label, and a gender indicator.
 *
 * Validates: Requirements 7.2
 */
describe('VoiceCard property tests', () => {
  const voiceOptionArb = fc.record({
    name: fc.string({ minLength: 1 }),
    language: fc.constantFrom('en-GB', 'en-US', 'en-AU'),
    gender: fc.constantFrom('male' as const, 'female' as const, 'neutral' as const),
  });

  const languageLabelMap: Record<string, string> = {
    'en-GB': 'British English',
    'en-US': 'American English',
    'en-AU': 'Australian English',
  };

  const genderIndicatorMap: Record<string, { emoji: string; label: string }> = {
    female: { emoji: '♀', label: 'Female' },
    male: { emoji: '♂', label: 'Male' },
    neutral: { emoji: '⚪', label: 'Neutral' },
  };

  it('rendered output contains voice name, language label, and gender indicator for any valid VoiceOption', () => {
    fc.assert(
      fc.property(voiceOptionArb, ({ name, language, gender }) => {
        const voice: VoiceOption = {
          id: 'test-voice-id',
          name,
          language,
          gender,
          quality: 'default',
        };

        const { getByTestId } = render(
          <VoiceCard
            voice={voice}
            isSelected={false}
            onSelect={() => {}}
            onPreview={() => {}}
          />
        );

        // Verify voice name is rendered
        const nameEl = getByTestId('voice-card-name');
        expect(nameEl.props.children).toBe(name);

        // Verify language/accent label is rendered
        const languageEl = getByTestId('voice-card-language');
        const expectedLanguageLabel = languageLabelMap[language];
        expect(languageEl.props.children).toBe(expectedLanguageLabel);

        // Verify gender indicator is rendered
        const genderEl = getByTestId('voice-card-gender');
        const children = genderEl.props.children;
        const text = Array.isArray(children) ? children.join('') : String(children);
        const expectedGender = genderIndicatorMap[gender];
        expect(text).toContain(expectedGender.emoji);
        expect(text).toContain(expectedGender.label);
      }),
      { numRuns: 100 }
    );
  });
});
