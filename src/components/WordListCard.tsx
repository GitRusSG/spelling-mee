import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { WordList } from '../types';

interface WordListCardProps {
  list: WordList;
  onPress: () => void;
}

/**
 * Displays a word list card with name, word count, and a type badge (Built-in / Custom).
 */
export default function WordListCard({ list, onPress }: WordListCardProps) {
  const badgeLabel = list.type === 'builtin' ? 'Built-in' : 'Custom';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${list.name}, ${list.wordCount} words, ${badgeLabel}`}
      testID="word-list-card"
    >
      <View style={styles.content}>
        <Text style={styles.name} testID="word-list-card-name">{list.name}</Text>
        <Text style={styles.wordCount} testID="word-list-card-count">
          {list.wordCount} {list.wordCount === 1 ? 'word' : 'words'}
        </Text>
      </View>
      <View
        style={[styles.badge, list.type === 'builtin' ? styles.builtinBadge : styles.customBadge]}
        testID="word-list-card-badge"
      >
        <Text style={styles.badgeText}>{badgeLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  wordCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  badge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  builtinBadge: {
    backgroundColor: '#E3F2FD',
  },
  customBadge: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});
