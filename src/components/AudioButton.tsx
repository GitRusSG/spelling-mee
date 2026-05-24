import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

type AudioButtonState = 'idle' | 'loading' | 'playing' | 'error';

interface AudioButtonProps {
  onPress: () => void;
  state: AudioButtonState;
}

/**
 * Play/repeat button for audio pronunciation with loading and error states.
 *
 * - idle: Shows a play icon/label, ready to be pressed.
 * - loading: Shows a spinner; button is disabled.
 * - playing: Shows a playing indicator; button is disabled.
 * - error: Shows an inline error indicator with retry affordance.
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
          <Text style={styles.label}>Play</Text>
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
          <Text style={styles.errorIcon} testID="audio-button-error-indicator">⚠️</Text>
          <Text style={styles.errorLabel}>Retry</Text>
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
    backgroundColor: '#4A90D9',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  errorButton: {
    backgroundColor: '#D94A4A',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 18,
  },
  errorLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
