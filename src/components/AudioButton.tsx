import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

type AudioButtonState = 'idle' | 'loading' | 'playing' | 'error';

interface AudioButtonProps {
  onPress: () => void;
  state: AudioButtonState;
}

/**
 * Play/repeat button for audio pronunciation with loading and error states.
 * Kid-friendly design with bigger size, purple background, and friendly messages.
 */
export default function AudioButton({ onPress, state }: AudioButtonProps) {
  const isDisabled = state === 'loading' || state === 'playing';

  return (
    <TouchableOpacity
      style={[styles.button, state === 'error' && styles.errorButton]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel(state)}
      accessibilityState={{ disabled: isDisabled }}
      testID="audio-button"
    >
      {state === 'loading' && (
        <View style={styles.content}>
          <ActivityIndicator size="small" color="#fff" testID="audio-button-loading" />
          <Text style={styles.label}>Loading…</Text>
        </View>
      )}
      {state === 'idle' && (
        <View style={styles.content}>
          <Text style={styles.icon}>🔊</Text>
          <Text style={styles.label}>Hear the word!</Text>
        </View>
      )}
      {state === 'playing' && (
        <View style={styles.content}>
          <Text style={styles.icon}>🔊</Text>
          <Text style={styles.label}>Playing…</Text>
        </View>
      )}
      {state === 'error' && (
        <View style={styles.content}>
          <Text style={styles.errorIcon} testID="audio-button-error-indicator">😕</Text>
          <Text style={styles.errorLabel}>Oops! Try again</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getAccessibilityLabel(state: AudioButtonState): string {
  switch (state) {
    case 'idle':
      return 'Play audio pronunciation';
    case 'loading':
      return 'Loading audio';
    case 'playing':
      return 'Audio is playing';
    case 'error':
      return 'Audio failed, tap to retry';
  }
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#7C4DFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 180,
    minHeight: 56,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  errorButton: {
    backgroundColor: '#FF5252',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 24,
  },
  label: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  errorIcon: {
    fontSize: 24,
  },
  errorLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
