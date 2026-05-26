import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface LetterKeyboardProps {
  onLetterPress: (letter: string) => void;
  onBackspace: () => void;
}

// 3-row alphabetical layout for kid-friendly readability
const ROWS = [
  'ABCDEFGHI'.split(''),   // Row 1: A-I (9 letters)
  'JKLMNOPQR'.split(''),   // Row 2: J-R (9 letters)
  'STUVWXYZ'.split(''),    // Row 3: S-Z (8 letters)
];

const ROW_COLORS = [
  '#E8D5F5', // lavender for row 1
  '#D5F5E3', // mint for row 2
  '#FDE9D9', // peach for row 3
];

/**
 * Alphabet keyboard for letter-by-letter spelling mode.
 * Kid-friendly with colorful pastel buttons arranged in 3 neat rows.
 * Designed to work well on both mobile and web.
 */
export default function LetterKeyboard({ onLetterPress, onBackspace }: LetterKeyboardProps) {
  return (
    <View style={styles.container} testID="letter-keyboard">
      {ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((letter) => (
            <TouchableOpacity
              key={letter}
              style={[
                styles.letterButton,
                { backgroundColor: ROW_COLORS[rowIndex] },
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
      ))}
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
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 6,
  },
  letterButton: {
    borderRadius: 12,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  letterText: {
    fontSize: 18,
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
    marginTop: 8,
    alignSelf: 'center',
    minHeight: 48,
  },
  backspaceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
