import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface LetterKeyboardProps {
  onLetterPress: (letter: string) => void;
  onBackspace: () => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const PASTEL_COLORS = [
  '#E8D5F5', // lavender
  '#D5F5E3', // mint
  '#FDE9D9', // peach
  '#D5EEF5', // sky
  '#F5D5E8', // pink
  '#F5F0D5', // cream
];

/**
 * Alphabet keyboard for letter-by-letter spelling mode.
 * Kid-friendly with colorful pastel buttons and bigger touch targets.
 */
export default function LetterKeyboard({ onLetterPress, onBackspace }: LetterKeyboardProps) {
  return (
    <View style={styles.container} testID="letter-keyboard">
      <View style={styles.lettersGrid}>
        {LETTERS.map((letter, index) => (
          <TouchableOpacity
            key={letter}
            style={[
              styles.letterButton,
              { backgroundColor: PASTEL_COLORS[index % PASTEL_COLORS.length] },
            ]}
            onPress={() => onLetterPress(letter)}
            accessibilityRole="button"
            accessibilityLabel={letter}
            testID={`letter-button-${letter}`}
          >
            <Text style={styles.letterText}>{letter}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={styles.backspaceButton}
        onPress={onBackspace}
        accessibilityRole="button"
        accessibilityLabel="Backspace"
        testID="backspace-button"
      >
        <Text style={styles.backspaceText}>⬅️ Backspace</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  lettersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  letterButton: {
    borderRadius: 12,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  letterText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A148C',
  },
  backspaceButton: {
    backgroundColor: '#FF6D00',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    alignSelf: 'center',
    minHeight: 48,
  },
  backspaceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
