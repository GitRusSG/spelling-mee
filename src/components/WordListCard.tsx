import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { WordList } from '../types';

interface WordListCardProps {
  list: WordList;
  onPress: () => void;
}

/**
 * Displays a word list card with name, word count, and a type badge (Built-in / Custom).
 * Kid-friendly design with colored left border and emoji indicators.
 */
export default function WordListCard({ list, onPress }: WordListCardProps) {
  const isBuiltin = list.type === 'builtin';
  const badgeLabel = isBuiltin ? 'Built-in' : 'Custom';
  const emoji = isBuiltin ? '📖' : '📝';

  return (
    <TouchableOpacity
      style={[styles.card, isBuiltin ? styles.builtinBorder : styles.customBorder]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${list.name}, ${list.wordCount} words, ${badgeLabel}`}
      testID="word-list-card"
    >
      <View style={styles.content}>
        <Text style={styles.name} testID="word-list-card-name">
          {emoji} {list.name}
        </Text>
        <Text style={styles.wordCount} testID="word-list-card-count">
          {list.wordCount} {list.wordCount === 1 ? 'word' : 'words'}
        </Text>
      </View>
      <View
        style={[styles.badge, isBuiltin ? styles.builtinBadge : styles.customBadge]}
        testID="word-list-card-badge"
      >
        <Text style={[styles.badgeText, isBuiltin ? styles.builtinBadgeText : styles.customBadgeText]}>
          {badgeLabel}
        </Text>
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
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  builtinBorder: {
    borderLeftColor: '#7C4DFF',
  },
  customBorder: {
    borderLeftColor: '#00C853',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#4A148C',
  },
  wordCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  badge: {
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  builtinBadge: {
    backgroundColor: '#EDE7F6',
  },
  customBadge: {
    backgroundColor: '#E8F5E9',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  builtinBadgeText: {
    color: '#7C4DFF',
  },
  customBadgeText: {
    color: '#00C853',
  },
});
