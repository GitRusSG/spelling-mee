import React, { useEffect, useState, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';

type RecordButtonStatus = 'idle' | 'recording';

interface RecordButtonProps {
  status: RecordButtonStatus;
  onStart: () => void;
  onStop: () => void;
  maxDurationMs?: number;
}

/**
 * Record/stop toggle button with countdown timer.
 * Kid-friendly design with large touch target, rounded corners, and colorful states.
 */
export default function RecordButton({
  status,
  onStart,
  onStop,
  maxDurationMs = 10000,
}: RecordButtonProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    Math.ceil(maxDurationMs / 1000)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'recording') {
      setRemainingSeconds(Math.ceil(maxDurationMs / 1000));

      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setRemainingSeconds(Math.ceil(maxDurationMs / 1000));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [status, maxDurationMs]);

  const handlePress = () => {
    if (status === 'idle') {
      onStart();
    } else {
      onStop();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, status === 'recording' && styles.recordingButton]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel(status, remainingSeconds)}
      testID="record-button"
    >
      {status === 'idle' && (
        <View style={styles.content}>
          <Text style={styles.icon}>🎙️</Text>
          <Text style={styles.label}>Record</Text>
        </View>
      )}
      {status === 'recording' && (
        <View style={styles.content}>
          <Text style={styles.icon}>⏹️</Text>
          <Text style={styles.label} testID="record-button-timer">
            {remainingSeconds}s
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function getAccessibilityLabel(
  status: RecordButtonStatus,
  remainingSeconds: number
): string {
  switch (status) {
    case 'idle':
      return 'Start recording';
    case 'recording':
      return `Recording, ${remainingSeconds} seconds remaining. Tap to stop.`;
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
  recordingButton: {
    backgroundColor: '#FF5252',
    shadowColor: '#FF5252',
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
});
