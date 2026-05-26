import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { SharedListSummary } from '../types';

interface SharedListCardProps {
  list: SharedListSummary;
  onPress: () => void;
}

/**
 * Displays a shared community list card with name, word count, and creator display name.
 * Kid-friendly design consistent with WordListCard styling.
 */
export default function SharedListCard({ list, onPress }: SharedListCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${list.name}, ${list.wordCount} ${list.wordCount === 1 ? 'word' : 'words'}, by ${list.creatorDisplayName}`}
      testID="shared-list-card"
    >
      <View style={styles.content}>
        <Text style={styles.name} testID="shared-list-card-name">
          🌍 {list.name}
        </Text>
        <Text style={styles.wordCount} testID="shared-list-card-word-count">
          {list.wordCount} {list.wordCount === 1 ? 'word' : 'words'}
        </Text>
        <Text style={styles.creator} testID="shared-list-card-creator">
          by {list.creatorDisplayName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6D00',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  creator: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});
