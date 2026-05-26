import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { WordList } from '../types';
import { createStorage } from '../services/storage';

interface WordListCardProps {
  list: WordList;
  onPress: () => void;
}

function getBestStars(listId: string): number {
  try {
    const storage = createStorage();
    const value = storage.getString(`best_stars_${listId}`);
    return value ? parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Displays a word list card with name, word count, and a type badge (Built-in / Custom).
 * Kid-friendly design with colored left border and emoji indicators.
 * Shows best star rating if available.
 */
export default function WordListCard({ list, onPress }: WordListCardProps) {
  const isBuiltin = list.type === 'builtin';
  const badgeLabel = isBuiltin ? 'Built-in' : 'Custom';
  const emoji = isBuiltin ? '📖' : '📝';
  const bestStars = getBestStars(list.id);

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
        <View style={styles.metaRow}>
          <Text style={styles.wordCount} testID="word-list-card-count">
            {list.wordCount} {list.wordCount === 1 ? 'word' : 'words'}
          </Text>
          {bestStars > 0 && (
            <Text style={styles.bestStars} testID="word-list-card-stars">
              {'⭐'.repeat(bestStars)}{'☆'.repeat(3 - bestStars)}
            </Text>
          )}
        </View>
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  wordCount: {
    fontSize: 14,
    color: '#666',
  },
  bestStars: {
    fontSize: 12,
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
