import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AuthGate from '../../src/components/AuthGate';
import * as CommunityListService from '../../src/services/CommunityListService';
import { useWordList } from '../../src/contexts/WordListContext';
import { SharedListDetail } from '../../src/types';

function SharedListPreviewContent() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const { adoptSharedList } = useWordList();

  const [list, setList] = useState<SharedListDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdopting, setIsAdopting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchList() {
      if (!listId) return;
      try {
        setIsLoading(true);
        setError(null);
        const result = await CommunityListService.getSharedListById(listId);
        setList(result);
      } catch (err) {
        setError('Unable to load this list. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchList();
  }, [listId]);

  const handleAdopt = async () => {
    if (!listId) return;

    try {
      setIsAdopting(true);
      await adoptSharedList(listId);
      router.replace('/');
    } catch (err) {
      Alert.alert('Error', 'Failed to add this list. Please try again.');
    } finally {
      setIsAdopting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered} testID="shared-list-loading">
        <ActivityIndicator size="large" color="#7C4DFF" />
        <Text style={styles.loadingText}>Loading list...</Text>
      </View>
    );
  }

  if (error || !list) {
    return (
      <View style={styles.centered} testID="shared-list-error">
        <Text style={styles.errorText}>{error ?? 'List not found.'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="shared-list-back-button"
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <Text style={styles.listName}>🌍 {list.name}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>
          {list.wordCount} {list.wordCount === 1 ? 'word' : 'words'}
        </Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText}>by {list.creatorDisplayName}</Text>
      </View>

      <View style={styles.wordsSection}>
        <Text style={styles.wordsSectionTitle}>Words in this list:</Text>
        {list.words.map((word, index) => (
          <View key={`${word}-${index}`} style={styles.wordRow}>
            <Text style={styles.wordNumber}>{index + 1}.</Text>
            <Text style={styles.wordText}>{word}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.adoptButton, isAdopting && styles.adoptButtonDisabled]}
        onPress={handleAdopt}
        disabled={isAdopting}
        accessibilityRole="button"
        accessibilityLabel="Use this list"
        testID="use-this-list-button"
      >
        {isAdopting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.adoptButtonText}>📥 Use this list</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function SharedListPreviewScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthGate>
        <SharedListPreviewContent />
      </AuthGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  errorText: {
    fontSize: 15,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#7C4DFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
  },
  metaDot: {
    fontSize: 14,
    color: '#999',
    marginHorizontal: 8,
  },
  wordsSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  wordsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A148C',
    marginBottom: 12,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  wordNumber: {
    fontSize: 14,
    color: '#999',
    width: 30,
  },
  wordText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  adoptButton: {
    backgroundColor: '#FF6D00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  adoptButtonDisabled: {
    opacity: 0.7,
  },
  adoptButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});
