import React, { useState } from 'react';
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
import { CustomWordList } from '../src/types';
import { BLITZ_LISTS, GRADE_LISTS } from '../src/data/builtinLists';

const GRADE_ORDER = ['K1', 'K2', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

export default function HomeScreen() {
  const { lists } = useWordList();
  const { isSubscribed } = useSubscription();
  const { isAuthenticated, user, signOut } = useAuth();
  const router = useRouter();

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    blitz: true,
    grades: true,
    other: true,
  });
  const [expandedGrades, setExpandedGrades] = useState<Record<string, boolean>>({});

  const builtinLists = lists.filter((list) => list.type === 'builtin');
  const customLists = lists.filter((list) => list.type === 'custom');

  // Separate built-in lists into categories
  const blitzIds = new Set(BLITZ_LISTS.map((l) => l.id));
  const gradeIds = new Set(Object.values(GRADE_LISTS).flat().map((l) => l.id));
  const otherBuiltinLists = builtinLists.filter(
    (l) => !blitzIds.has(l.id) && !gradeIds.has(l.id)
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleGrade = (grade: string) => {
    setExpandedGrades((prev) => ({ ...prev, [grade]: !prev[grade] }));
  };

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

          {/* Blitz Section */}
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('blitz')}
            accessibilityRole="button"
            accessibilityLabel={`Blitz section, ${expandedSections.blitz ? 'collapse' : 'expand'}`}
            testID="blitz-section-header"
          >
            <Text style={styles.collapsibleHeaderText}>
              {expandedSections.blitz ? '▼' : '▶'} ⚡ Blitz
            </Text>
          </TouchableOpacity>
          {expandedSections.blitz && (
            <View style={styles.collapsibleContent}>
              {BLITZ_LISTS.map((list) => (
                <WordListCard
                  key={list.id}
                  list={list}
                  onPress={() => router.push(`/test/${list.id}`)}
                />
              ))}
            </View>
          )}

          {/* By Grade Section */}
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('grades')}
            accessibilityRole="button"
            accessibilityLabel={`By Grade section, ${expandedSections.grades ? 'collapse' : 'expand'}`}
            testID="grades-section-header"
          >
            <Text style={styles.collapsibleHeaderText}>
              {expandedSections.grades ? '▼' : '▶'} 📚 By Grade
            </Text>
          </TouchableOpacity>
          {expandedSections.grades && (
            <View style={styles.collapsibleContent}>
              {GRADE_ORDER.map((grade) => (
                <View key={grade}>
                  <TouchableOpacity
                    style={styles.gradeHeader}
                    onPress={() => toggleGrade(grade)}
                    accessibilityRole="button"
                    accessibilityLabel={`Grade ${grade}, ${expandedGrades[grade] ? 'collapse' : 'expand'}`}
                    testID={`grade-${grade}-header`}
                  >
                    <Text style={styles.gradeHeaderText}>
                      {expandedGrades[grade] ? '▼' : '▶'} {grade}
                    </Text>
                  </TouchableOpacity>
                  {expandedGrades[grade] && GRADE_LISTS[grade] && (
                    <View style={styles.gradeContent}>
                      {GRADE_LISTS[grade].map((list) => (
                        <WordListCard
                          key={list.id}
                          list={list}
                          onPress={() => router.push(`/test/${list.id}`)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Other Section */}
          <TouchableOpacity
            style={styles.collapsibleHeader}
            onPress={() => toggleSection('other')}
            accessibilityRole="button"
            accessibilityLabel={`Other section, ${expandedSections.other ? 'collapse' : 'expand'}`}
            testID="other-section-header"
          >
            <Text style={styles.collapsibleHeaderText}>
              {expandedSections.other ? '▼' : '▶'} 📖 Other
            </Text>
          </TouchableOpacity>
          {expandedSections.other && (
            <View style={styles.collapsibleContent}>
              {otherBuiltinLists.map((list) => (
                <WordListCard
                  key={list.id}
                  list={list}
                  onPress={() => router.push(`/test/${list.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Custom Lists Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✏️ My Lists</Text>

          {/* Create New List Button — directly below My Lists header */}
          <TouchableOpacity
            style={[styles.createButton, !isAuthenticated && styles.createButtonDisabled]}
            onPress={handleCreateList}
            accessibilityRole="button"
            accessibilityLabel="Create new list"
            accessibilityState={{ disabled: !isAuthenticated }}
            testID="create-list-button"
          >
            <Text style={styles.createButtonText}>✨ Create New List</Text>
          </TouchableOpacity>
          {!isAuthenticated && (
            <Text style={styles.createDisabledMessage} testID="create-list-auth-message">
              Sign in to create and share custom word lists
            </Text>
          )}

          {customLists.length === 0 ? (
            <Text style={styles.emptyText}>
              You haven't made any lists yet. Tap the button above to create your first one! 🌟
            </Text>
          ) : (
            customLists.map((list) => {
              const customList = list as CustomWordList;
              const isOwned = isAuthenticated && user && customList.creatorUid === user.uid;
              return (
                <View key={list.id} style={styles.customListWrapper}>
                  <WordListCard
                    list={list}
                    onPress={() => router.push(`/list/${list.id}/preview`)}
                  />
                  {isOwned && (
                    <TouchableOpacity
                      style={styles.recordDictationLink}
                      onPress={() => router.push(`/list/${list.id}/dictation`)}
                      accessibilityRole="button"
                      accessibilityLabel={`Record dictation for ${list.name}`}
                      testID={`record-dictation-${list.id}`}
                    >
                      <Text style={styles.recordDictationText}>🎙️ Record Dictation</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Community Library Button — visible when authenticated */}
        {isAuthenticated && (
          <TouchableOpacity
            style={styles.communityButton}
            onPress={() => router.push('/community')}
            accessibilityRole="button"
            accessibilityLabel="Community Library"
            testID="community-library-button"
          >
            <Text style={styles.communityButtonText}>🌍 Community Library</Text>
          </TouchableOpacity>
        )}

        {/* Voice Settings Button */}
        <TouchableOpacity
          style={styles.voiceSettingsButton}
          onPress={() => router.push('/settings/voice')}
          accessibilityRole="button"
          accessibilityLabel="Voice Settings"
          testID="voice-settings-button"
        >
          <Text style={styles.voiceSettingsButtonText}>🎙️ Voice Settings</Text>
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
  collapsibleHeader: {
    backgroundColor: '#EDE7F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  collapsibleHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A148C',
  },
  collapsibleContent: {
    paddingLeft: 8,
    marginBottom: 8,
  },
  gradeHeader: {
    backgroundColor: '#F3E5F5',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  gradeHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6A1B9A',
  },
  gradeContent: {
    paddingLeft: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 15,
    color: '#7C4DFF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  communityButton: {
    backgroundColor: '#FF6D00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  communityButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  voiceSettingsButton: {
    backgroundColor: '#00BFA5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#00BFA5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  voiceSettingsButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  createButton: {
    backgroundColor: '#7C4DFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#B0B0B0',
    shadowColor: '#B0B0B0',
    shadowOpacity: 0.1,
    elevation: 1,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  createDisabledMessage: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
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
  customListWrapper: {
    marginBottom: 4,
  },
  recordDictationLink: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  recordDictationText: {
    fontSize: 13,
    color: '#7C4DFF',
    fontWeight: '500',
  },
});
