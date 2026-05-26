import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface QwertyKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
}

const ROWS = [
  'QWERTYUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  'ZXCVBNM'.split(''),
];

/**
 * On-screen QWERTY keyboard for typing mode.
 * Kid-friendly with colored keys and clear layout.
 */
export default function QwertyKeyboard({ onKeyPress, onBackspace, onSubmit, submitDisabled }: QwertyKeyboardProps) {
  return (
    <View style={styles.container} testID="qwerty-keyboard">
      {ROWS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((letter) => (
            <TouchableOpacity
              key={letter}
              style={styles.key}
              onPress={() => onKeyPress(letter.toLowerCase())}
              accessibilityRole="button"
              accessibilityLabel={letter}
              testID={`key-${letter}`}
            >
              <Text style={styles.keyText}>{letter}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.backspaceKey}
          onPress={onBackspace}
          accessibilityRole="button"
          accessibilityLabel="Backspace"
          testID="key-backspace"
        >
          <Text style={styles.specialKeyText}>⬅️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.spaceKey}
          onPress={() => onKeyPress(' ')}
          accessibilityRole="button"
          accessibilityLabel="Space"
          testID="key-space"
        >
          <Text style={styles.specialKeyText}>space</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitKey, submitDisabled && styles.submitKeyDisabled]}
          onPress={onSubmit}
          disabled={submitDisabled}
          accessibilityRole="button"
          accessibilityLabel="Submit"
          testID="key-submit"
        >
          <Text style={styles.submitKeyText}>Submit ✨</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 6,
    gap: 4,
  },
  key: {
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 34,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  keyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  backspaceKey: {
    backgroundColor: '#FFCDD2',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceKey: {
    backgroundColor: '#E8EAF6',
    borderRadius: 8,
    paddingHorizontal: 40,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  submitKey: {
    backgroundColor: '#FF6D00',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitKeyDisabled: {
    backgroundColor: '#FFAB91',
  },
  submitKeyText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  specialKeyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
