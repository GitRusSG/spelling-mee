import React, { useEffect, useRef } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTestSession, buildResult } from '../../src/contexts/TestSessionContext';
import { TestSession } from '../../src/types';
import ConfettiAnimation from '../../src/components/ConfettiAnimation';
import QuizCompleteAnimation from '../../src/components/QuizCompleteAnimation';
import { createStorage } from '../../src/services/storage';

function getScoreEmoji(percentage: number): string {
  if (percentage === 100) return '🏆';
  if (percentage >= 80) return '🌟';
  if (percentage >= 50) return '👍';
  return '💪';
}

function getScoreMessage(percentage: number): string {
  if (percentage === 100) return 'Perfect score! Maximum honey! 🍯';
  if (percentage >= 80) return 'Amazing job! So much honey! 🍯';
  if (percentage >= 50) return 'Good effort! Keep collecting honey!';
  return 'Great effort! Keep practising for more honey! 💪';
}

export function getStarRating(percentage: number): number {
  if (percentage >= 90) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 50) return 1;
  return 0;
}

export default function ResultsScreen() {
  const router = useRouter();
  const { wordList, answers, inputMode, initSession } = useTestSession();

  // Star animation values
  const starScales = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

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
  const emoji = getScoreEmoji(result.percentageCorrect);
  const message = getScoreMessage(result.percentageCorrect);
  const stars = getStarRating(result.percentageCorrect);
  const showConfetti = result.percentageCorrect >= 80;

  // Calculate highest streak from answers
  let highestStreak = 0;
  let currentStreak = 0;
  for (const ans of answers) {
    if (ans.correct) {
      currentStreak++;
      if (currentStreak > highestStreak) highestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  // Persist best star rating and highest streak
  useEffect(() => {
    try {
      const storage = createStorage();
      // Persist best star rating
      const bestStarsKey = `best_stars_${wordList.id}`;
      const existingStars = storage.getString(bestStarsKey);
      const existingStarCount = existingStars ? parseInt(existingStars, 10) : 0;
      if (stars > existingStarCount) {
        storage.set(bestStarsKey, String(stars));
      }
      // Persist highest streak
      const bestStreakKey = `best_streak_${wordList.id}`;
      const existingStreak = storage.getString(bestStreakKey);
      const existingStreakCount = existingStreak ? parseInt(existingStreak, 10) : 0;
      if (highestStreak > existingStreakCount) {
        storage.set(bestStreakKey, String(highestStreak));
      }
    } catch {
      // Storage errors should not break the results screen
    }
  }, [wordList.id, stars, highestStreak]);

  // Animate stars appearing
  useEffect(() => {
    const animations = starScales.map((scale, index) => {
      if (index < stars) {
        return Animated.spring(scale, {
          toValue: 1,
          delay: index * 200,
          useNativeDriver: true,
          tension: 100,
          friction: 6,
        });
      }
      return Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        delay: index * 200,
        useNativeDriver: true,
      });
    });
    Animated.parallel(animations).start();
  }, [stars]);

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
      <ConfettiAnimation trigger={showConfetti} intensity="large" />
      <QuizCompleteAnimation trigger={true} score={result.percentageCorrect} />

      <Text style={styles.title}>{emoji} {message}</Text>

      {/* Honey Rating */}
      <View style={styles.starContainer} testID="star-rating">
        {[0, 1, 2].map((index) => (
          <Animated.Text
            key={index}
            style={[
              styles.star,
              {
                transform: [{ scale: starScales[index] }],
                opacity: starScales[index],
              },
              index >= stars && styles.emptyStar,
            ]}
            testID={`star-${index}`}
          >
            {index < stars ? '🍯' : '🫙'}
          </Animated.Text>
        ))}
      </View>

      <View style={styles.percentageContainer} testID="percentage-container">
        <Text style={styles.percentageText} testID="percentage-text">
          {result.percentageCorrect}%
        </Text>
        <Text style={styles.percentageLabel}>
          {result.correctCount} of {result.totalWords} correct
        </Text>
      </View>

      {/* Highest streak display */}
      {highestStreak >= 2 && (
        <View style={styles.streakResultContainer} testID="results-streak">
          <Text style={styles.streakResultText}>
            🍯 Best honey streak: {highestStreak} in a row!
          </Text>
        </View>
      )}

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
              <Text style={styles.wordText}>
                {record.correct ? '✅' : '❌'} {record.word}
              </Text>
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
          <Text style={styles.retakeButtonText}>🔄 Retake</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleHome}
          testID="home-button"
          accessibilityRole="button"
          accessibilityLabel="Go to home screen"
        >
          <Text style={styles.homeButtonText}>🏠 Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F3E5F5',
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
    backgroundColor: '#F3E5F5',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 24,
    textAlign: 'center',
  },
  percentageContainer: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  percentageText: {
    fontSize: 56,
    fontWeight: '700',
    color: '#7C4DFF',
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
    borderRadius: 12,
    marginBottom: 8,
  },
  correctRow: {
    backgroundColor: '#C8E6C9',
  },
  incorrectRow: {
    backgroundColor: '#FFCDD2',
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
    backgroundColor: '#7C4DFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  homeButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CE93D8',
    minHeight: 48,
  },
  homeButtonText: {
    color: '#4A148C',
    fontSize: 18,
    fontWeight: '700',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  star: {
    fontSize: 40,
  },
  emptyStar: {
    fontSize: 40,
    color: '#D1C4E9',
  },
  streakResultContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF6D00',
    width: '100%',
    alignItems: 'center',
  },
  streakResultText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E65100',
  },
});
