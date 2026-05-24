import React from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTestSession, buildResult } from '../../src/contexts/TestSessionContext';
import { TestSession } from '../../src/types';

export default function ResultsScreen() {
  const router = useRouter();
  const { wordList, answers, inputMode, initSession } = useTestSession();

  // If there's no completed session data, show a fallback
  if (!wordList || answers.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No test results available.</Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.replace('/')}
          testID="home-button"
          accessibilityRole="button"
          accessibilityLabel="Go to home screen"
        >
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Build the session object for buildResult
  const session: TestSession = {
    listId: wordList.id,
    startedAt: new Date().toISOString(),
    inputMode,
    answers,
  };

  const result = buildResult(session, wordList);

  const handleRetake = () => {
    initSession(wordList, inputMode);
    router.replace(`/test/${wordList.id}`);
  };

  const handleHome = () => {
    router.replace('/');
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.contentContainer}
      testID="results-screen"
    >
      <Text style={styles.title}>Test Results</Text>

      <View style={styles.percentageContainer} testID="percentage-container">
        <Text style={styles.percentageText} testID="percentage-text">
          {result.percentageCorrect}%
        </Text>
        <Text style={styles.percentageLabel}>
          {result.correctCount} of {result.totalWords} correct
        </Text>
      </View>

      <View style={styles.wordListContainer} testID="word-list-container">
        {answers.map((record, index) => (
          <View
            key={`${record.word}-${index}`}
            style={[
              styles.wordRow,
              record.correct ? styles.correctRow : styles.incorrectRow,
            ]}
            testID={`word-row-${index}`}
          >
            <View style={styles.wordInfo}>
              <Text style={styles.wordText}>{record.word}</Text>
              <Text
                style={[
                  styles.labelText,
                  record.correct ? styles.correctLabel : styles.incorrectLabel,
                ]}
                testID={`word-label-${index}`}
              >
                {record.correct ? 'correct' : 'incorrect'}
              </Text>
            </View>
            {!record.correct && (
              <View style={styles.incorrectDetails} testID={`incorrect-details-${index}`}>
                <Text style={styles.givenText}>
                  Your answer: {record.given || '(empty)'}
                </Text>
                <Text style={styles.correctSpelling}>
                  Correct spelling: {record.word}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={handleRetake}
          testID="retake-button"
          accessibilityRole="button"
          accessibilityLabel="Retake test"
        >
          <Text style={styles.retakeButtonText}>Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleHome}
          testID="home-button"
          accessibilityRole="button"
          accessibilityLabel="Go to home screen"
        >
          <Text style={styles.homeButtonText}>Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 24,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 24,
  },
  percentageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    width: '100%',
  },
  percentageText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#4A90D9',
  },
  percentageLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  wordListContainer: {
    width: '100%',
    marginBottom: 32,
  },
  wordRow: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  correctRow: {
    backgroundColor: '#E8F5E9',
  },
  incorrectRow: {
    backgroundColor: '#FFEBEE',
  },
  wordInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  correctLabel: {
    color: '#2E7D32',
  },
  incorrectLabel: {
    color: '#C62828',
  },
  incorrectDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FFCDD2',
  },
  givenText: {
    fontSize: 14,
    color: '#666',
  },
  correctSpelling: {
    fontSize: 14,
    color: '#2E7D32',
    marginTop: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  retakeButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  homeButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  homeButtonText: {
    color: '#333',
    fontSize: 18,
    fontWeight: '600',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
});
