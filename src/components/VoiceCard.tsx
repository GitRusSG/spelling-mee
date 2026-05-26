import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { VoiceOption } from '../types';

interface VoiceCardProps {
  voice: VoiceOption;
  isSelected: boolean;
  onSelect: () => void;
  onPreview: () => void;
}

/**
 * Displays a voice option card with name, language/accent label, gender indicator,
 * selected state, and a preview button.
 * Kid-friendly design with rounded corners, colorful accents, and clear visual states.
 */
export default function VoiceCard({
  voice,
  isSelected,
  onSelect,
  onPreview,
}: VoiceCardProps) {
  const genderIndicator = getGenderIndicator(voice.gender);
  const languageLabel = getLanguageLabel(voice.language);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`${voice.name}, ${languageLabel}, ${genderIndicator.label}${isSelected ? ', selected' : ''}`}
      accessibilityState={{ selected: isSelected }}
      testID="voice-card"
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, isSelected && styles.selectedName]} testID="voice-card-name">
            {voice.name}
          </Text>
          {isSelected && (
            <Text style={styles.checkmark} testID="voice-card-checkmark">
              ✓
            </Text>
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.language} testID="voice-card-language">
            {languageLabel}
          </Text>
          <Text style={styles.gender} testID="voice-card-gender">
            {genderIndicator.emoji} {genderIndicator.label}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.previewButton}
        onPress={onPreview}
        accessibilityRole="button"
        accessibilityLabel={`Preview ${voice.name}`}
        testID="voice-card-preview"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.previewIcon}>🔊</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function getGenderIndicator(gender: VoiceOption['gender']): { emoji: string; label: string } {
  switch (gender) {
    case 'female':
      return { emoji: '♀', label: 'Female' };
    case 'male':
      return { emoji: '♂', label: 'Male' };
    case 'neutral':
      return { emoji: '⚪', label: 'Neutral' };
  }
}

function getLanguageLabel(language: string): string {
  const languageMap: Record<string, string> = {
    'en-GB': 'British English',
    'en-US': 'American English',
    'en-AU': 'Australian English',
    'en-NZ': 'New Zealand English',
    'en-IE': 'Irish English',
    'en-ZA': 'South African English',
    'en-IN': 'Indian English',
  };
  return languageMap[language] || language;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#7C4DFF',
    backgroundColor: '#F3EDFF',
    shadowOpacity: 0.15,
    elevation: 4,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4A148C',
  },
  selectedName: {
    color: '#7C4DFF',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7C4DFF',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  language: {
    fontSize: 14,
    color: '#666',
  },
  gender: {
    fontSize: 14,
    color: '#666',
  },
  previewButton: {
    backgroundColor: '#EDE7F6',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIcon: {
    fontSize: 22,
  },
});
