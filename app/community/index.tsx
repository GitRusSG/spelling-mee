import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AuthGate from '../../src/components/AuthGate';
import SharedListCard from '../../src/components/SharedListCard';
import * as CommunityListService from '../../src/services/CommunityListService';
import { SharedListSummary } from '../../src/types';

function CommunityLibraryContent() {
  const router = useRouter();
  const [lists, setLists] = useState<SharedListSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const PAGE_SIZE = 20;

  const fetchLists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await CommunityListService.getSharedLists({ limit: PAGE_SIZE });
      setLists(result);
      setHasMore(result.length >= PAGE_SIZE);
    } catch (err) {
      setError('Unable to load community lists. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || lists.length === 0) return;

    try {
      setIsLoadingMore(true);
      const lastList = lists[lists.length - 1];
      const result = await CommunityListService.getSharedLists({
        limit: PAGE_SIZE,
        startAfter: lastList.id,
      });
      setLists((prev) => [...prev, ...result]);
      setHasMore(result.length >= PAGE_SIZE);
    } catch (err) {
      setError('Unable to load more lists. Please try again.');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, lists]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  if (isLoading) {
    return (
      <View style={styles.centered} testID="community-loading">
        <ActivityIndicator size="large" color="#7C4DFF" />
        <Text style={styles.loadingText}>Loading community lists...</Text>
      </View>
    );
  }

  if (error && lists.length === 0) {
    return (
      <View style={styles.centered} testID="community-error">
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchLists}
          accessibilityRole="button"
          accessibilityLabel="Retry loading community lists"
          testID="community-retry-button"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (lists.length === 0) {
    return (
      <View style={styles.centered} testID="community-empty">
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyTitle}>No shared lists yet</Text>
        <Text style={styles.emptyText}>
          Be the first to share a word list with the community!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton} testID="back-button">
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>🌍 Community Library</Text>
      <Text style={styles.subtitle}>Word lists shared by other parents</Text>

      {lists.map((list) => (
        <SharedListCard
          key={list.id}
          list={list}
          onPress={() => router.push(`/community/${list.id}`)}
        />
      ))}

      {hasMore && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={loadMore}
          disabled={isLoadingMore}
          accessibilityRole="button"
          accessibilityLabel="Load more lists"
          testID="community-load-more-button"
        >
          {isLoadingMore ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loadMoreText}>Load More</Text>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

export default function CommunityLibraryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AuthGate>
        <CommunityLibraryContent />
      </AuthGate>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E5F5',
  },
  backButton: { alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 4, marginBottom: 8 },
  backButtonText: { fontSize: 15, color: '#7C4DFF', fontWeight: '600' },
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
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
  retryButton: {
    backgroundColor: '#7C4DFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#FF6D00',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
