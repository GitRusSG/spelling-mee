import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface LetterKeyboardProps {
  onLetterPress: (letter: string) => void;
  onBackspace: () => void;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * Alphabet keyboard for letter-by-letter spelling mode.
 *
 * Renders 26 letter buttons (A–Z) plus a backspace button.
 * Each letter button fires `onLetterPress` with the tapped letter.
 * The backspace button fires `onBackspace` to delete the last entered letter.
 */
export default function LetterKeyboard({ onLetterPress, onBackspace }: LetterKeyboardProps) {
  return (
    <View style={styles.container} testID="letter-keyboard">
      <View style={styles.lettersGrid}>
        {LETTERS.map((letter) => (
          <TouchableOpacity
            key={letter}
            style={styles.letterButton}
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
        <Text style={styles.backspaceText}>⌫ Backspace</Text>
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
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backspaceButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    alignSelf: 'center',
  },
  backspaceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
