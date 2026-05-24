import React from 'react';
import { Text, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

/**
 * Displays the current spelling test progress as "Word {current} of {total}".
 */
export default function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <Text style={styles.text} accessibilityRole="text" accessibilityLabel={`Word ${current} of ${total}`}>
      Word {current} of {total}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
});
