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
import { useAuth } from '../src/contexts/AuthContext';
import WordListCard from '../src/components/WordListCard';

export default function HomeScreen() {
  const { lists } = useWordList();
  const { isSubscribed } = useSubscription();
  const { isAuthenticated, user, signOut } = useAuth();
  const router = useRouter();

  const builtinLists = lists.filter((list) => list.type === 'builtin');
  const customLists = lists.filter((list) => list.type === 'custom');

  const handleCreateList = () => {
    if (isAuthenticated) {
      router.push('/list/create');
    } else {
      router.push('/auth/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Spelling Mee</Text>

        {/* Auth Status */}
        <View style={styles.authRow}>
          {isAuthenticated ? (
            <View style={styles.authInfo}>
              <Text style={styles.authEmail} numberOfLines={1}>{user?.email}</Text>
              <TouchableOpacity
                onPress={signOut}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                testID="sign-out-button"
              >
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/auth/login')}
              accessibilityRole="link"
              accessibilityLabel="Sign in"
              testID="sign-in-link"
            >
              <Text style={styles.signInText}>Sign in</Text>
            </TouchableOpacity>
          )}
        </View>

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
          onPress={handleCreateList}
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
    marginBottom: 12,
    textAlign: 'center',
  },
  authRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  authInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authEmail: {
    fontSize: 13,
    color: '#555',
    maxWidth: 200,
  },
  signOutText: {
    fontSize: 13,
    color: '#E53935',
    fontWeight: '500',
  },
  signInText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
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
