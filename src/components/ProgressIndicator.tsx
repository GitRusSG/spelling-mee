import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

interface ProgressIndicatorProps {
  current: number;
  total: number;
}

/**
 * Displays the current spelling test progress as a colorful progress bar
 * with "Word {current} of {total} ⭐" text.
 */
export default function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  const progress = total > 0 ? current / total : 0;

  return (
    <View style={styles.container}>
      <Text
        style={styles.text}
        accessibilityRole="text"
        accessibilityLabel={`Word ${current} of ${total}`}
      >
        Word {current} of {total} ⭐
      </Text>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    color: '#4A148C',
    marginBottom: 8,
  },
  barBackground: {
    width: '100%',
    height: 12,
    backgroundColor: '#EDE7F6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#7C4DFF',
    borderRadius: 6,
  },
});
