import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWordList } from '../../../src/contexts/WordListContext';
import { useAuth } from '../../../src/contexts/AuthContext';
import { CustomWordList } from '../../../src/types';

export default function PreviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById } = useWordList();
  const { isAuthenticated, user } = useAuth();

  const list = id ? getById(id) : undefined;

  // Check if the current user owns this custom list
  const isOwnedCustomList =
    list?.type === 'custom' &&
    isAuthenticated &&
    user &&
    (list as CustomWordList).creatorUid === user.uid;

  if (!list) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredContent}>
          <Text style={styles.errorTitle}>List not found</Text>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Go home"
          >
            <Text style={styles.homeButtonText}>Go Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleStartTest = () => {
    router.push(`/test/${id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{list.name}</Text>
        <Text style={styles.subtitle}>
          {list.wordCount} {list.wordCount === 1 ? 'word' : 'words'}
        </Text>

        {/* Word List (read-only) */}
        <FlatList
          data={list.words}
          keyExtractor={(_, index) => index.toString()}
          style={styles.wordList}
          renderItem={({ item, index }) => (
            <View style={styles.wordItem}>
              <Text style={styles.wordIndex}>{index + 1}.</Text>
              <Text style={styles.wordText}>{item}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No words in this list.</Text>
          }
        />

        {/* Record Dictation Button — only for owned custom lists */}
        {isOwnedCustomList && (
          <TouchableOpacity
            style={styles.dictationButton}
            onPress={() => router.push(`/list/${id}/dictation`)}
            accessibilityRole="button"
            accessibilityLabel="Record Dictation"
            testID="record-dictation-button"
          >
            <Text style={styles.dictationButtonText}>🎙️ Record Dictation</Text>
          </TouchableOpacity>
        )}

        {/* Start Test Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartTest}
          accessibilityRole="button"
          accessibilityLabel="Start Test"
          testID="start-test-button"
        >
          <Text style={styles.startButtonText}>Start Test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E53935',
    marginBottom: 16,
  },
  wordList: {
    flex: 1,
    marginTop: 8,
  },
  wordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  wordIndex: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginRight: 10,
    minWidth: 24,
  },
  wordText: {
    fontSize: 16,
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  startButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dictationButton: {
    backgroundColor: '#7C4DFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  dictationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
