import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWordList } from '../src/contexts/WordListContext';
import { useSubscription } from '../src/contexts/SubscriptionContext';
import WordListCard from '../src/components/WordListCard';

export default function HomeScreen() {
  const { lists } = useWordList();
  const { isSubscribed } = useSubscription();
  const router = useRouter();

  const builtinLists = lists.filter((list) => list.type === 'builtin');
  const customLists = lists.filter((list) => list.type === 'custom');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Spelling Mee</Text>

        {/* Built-in Lists Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Built-in Lists</Text>
          {builtinLists.map((list) => (
            <WordListCard
              key={list.id}
              list={list}
              onPress={() => router.push(`/test/${list.id}`)}
            />
          ))}
        </View>

        {/* Custom Lists Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Lists</Text>
          {customLists.length === 0 ? (
            <Text style={styles.emptyText}>
              No custom lists yet. Create one to get started!
            </Text>
          ) : (
            customLists.map((list) => (
              <WordListCard
                key={list.id}
                list={list}
                onPress={() => router.push(`/test/${list.id}`)}
              />
            ))
          )}
        </View>

        {/* Create New List Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/list/create')}
          accessibilityRole="button"
          accessibilityLabel="Create new list"
          testID="create-list-button"
        >
          <Text style={styles.createButtonText}>+ Create New List</Text>
        </TouchableOpacity>

        {/* Subscription link */}
        <TouchableOpacity
          style={styles.subscriptionLink}
          onPress={() => router.push('/subscription')}
          accessibilityRole="button"
          accessibilityLabel={isSubscribed ? 'Manage subscription' : 'Remove ads'}
          testID="subscription-link"
        >
          <Text style={styles.subscriptionLinkText}>
            {isSubscribed ? 'Manage subscription' : 'Remove ads'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  createButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  subscriptionLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
  },
  subscriptionLinkText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
