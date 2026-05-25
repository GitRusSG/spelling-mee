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
        <Text style={styles.title}>🐝 Spelling Mee</Text>

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
          <Text style={styles.sectionTitle}>📚 Built-in Lists</Text>
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
          <Text style={styles.sectionTitle}>✏️ My Lists</Text>
          {customLists.length === 0 ? (
            <Text style={styles.emptyText}>
              You haven't made any lists yet. Tap the button below to create your first one! 🌟
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
          <Text style={styles.createButtonText}>✨ Create New List</Text>
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
    backgroundColor: '#F3E5F5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4A148C',
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
    color: '#FF5252',
    fontWeight: '500',
  },
  signInText: {
    fontSize: 14,
    color: '#7C4DFF',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#7C4DFF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  createButton: {
    backgroundColor: '#7C4DFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  subscriptionLink: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 10,
  },
  subscriptionLinkText: {
    color: '#7C4DFF',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
