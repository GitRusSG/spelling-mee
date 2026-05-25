import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTestSession } from '../../src/contexts/TestSessionContext';
import { useWordList } from '../../src/contexts/WordListContext';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
import { AudioService } from '../../src/services/AudioService';
import { AudioUnavailableError } from '../../src/types/errors';
import { shouldShowAd } from '../../src/services/AdService';
import ProgressIndicator from '../../src/components/ProgressIndicator';
import AudioButton from '../../src/components/AudioButton';
import LetterKeyboard from '../../src/components/LetterKeyboard';
import InterstitialAd from '../../src/components/InterstitialAd';
import { InputMode } from '../../src/types';

type AudioButtonState = 'idle' | 'loading' | 'playing' | 'error';

interface Feedback {
  correct: boolean;
  word: string;
  given: string;
}

export default function TestScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const { getById } = useWordList();
  const { status: subscriptionStatus } = useSubscription();
  const {
    wordList: sessionWordList,
    currentIndex,
    status,
    answers,
    initSession,
    submitAnswer,
  } = useTestSession();

  const [answer, setAnswer] = useState('');
  const [audioState, setAudioState] = useState<AudioButtonState>('idle');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [letterSequence, setLetterSequence] = useState('');
  const [showAd, setShowAd] = useState(() => shouldShowAd(subscriptionStatus));

  const handleAdClose = useCallback(() => {
    setShowAd(false);
  }, []);

  // Initialize session on mount (only after ad is dismissed)
  useEffect(() => {
    if (initialized || showAd) return;
    const wordList = getById(listId);
    if (!wordList) return;

    initSession(wordList, 'text');
    setInitialized(true);
    playWord(wordList.words[0]);
  }, [listId, initialized, showAd]);

  // Navigate to results when test is complete
  useEffect(() => {
    if (status === 'complete') {
      router.replace('/test/results');
    }
  }, [status]);

  const playWord = useCallback(async (word: string) => {
    setAudioState('loading');
    try {
      await AudioService.playWord(word);
      setAudioState('idle');
    } catch (error) {
      if (error instanceof AudioUnavailableError) {
        setAudioState('error');
      } else {
        setAudioState('error');
      }
    }
  }, []);

  const handleAudioPress = useCallback(() => {
    if (!sessionWordList) return;
    const currentWord = sessionWordList.words[currentIndex];
    playWord(currentWord);
  }, [sessionWordList, currentIndex, playWord]);

  const handleSubmit = useCallback(() => {
    if (!sessionWordList || status !== 'active') return;

    const currentWord = sessionWordList.words[currentIndex];
    const currentAnswer = inputMode === 'letter-by-letter' ? letterSequence : answer;
    const trimmedAnswer = currentAnswer.trim().toLowerCase();
    const isCorrect = currentWord.trim().toLowerCase() === trimmedAnswer;

    // Show feedback
    setFeedback({
      correct: isCorrect,
      word: currentWord,
      given: currentAnswer.trim(),
    });

    // Submit the answer (this advances the index or completes the session)
    submitAnswer(currentAnswer);
    setAnswer('');
    setLetterSequence('');

    // Play next word after a brief delay (if not complete)
    const nextIndex = currentIndex + 1;
    if (nextIndex < sessionWordList.words.length) {
      setTimeout(() => {
        setFeedback(null);
        playWord(sessionWordList.words[nextIndex]);
      }, 1500);
    }
  }, [sessionWordList, currentIndex, answer, letterSequence, inputMode, status, submitAnswer, playWord]);

  const handleLetterPress = useCallback((letter: string) => {
    setLetterSequence((prev) => prev + letter.toLowerCase());
  }, []);

  const handleBackspace = useCallback(() => {
    setLetterSequence((prev) => prev.slice(0, -1));
  }, []);

  const handleModeToggle = useCallback(() => {
    const newMode: InputMode = inputMode === 'text' ? 'letter-by-letter' : 'text';
    setInputMode(newMode);
    // Clear current input when switching modes
    setAnswer('');
    setLetterSequence('');
  }, [inputMode]);

  // Show loading state if word list not found
  if (!sessionWordList && !initialized) {
    const wordList = getById(listId);
    if (!wordList) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>Word list not found</Text>
        </View>
      );
    }
  }

  if (!sessionWordList) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <InterstitialAd visible={showAd} onClose={handleAdClose} />
      <ProgressIndicator
        current={currentIndex + 1}
        total={sessionWordList.words.length}
      />

      <View style={styles.audioSection}>
        <AudioButton onPress={handleAudioPress} state={audioState} />
      </View>

      {feedback && (
        <View
          style={[
            styles.feedbackContainer,
            feedback.correct ? styles.correctFeedback : styles.incorrectFeedback,
          ]}
          testID="feedback-container"
        >
          <Text
            style={[
              styles.feedbackText,
              feedback.correct ? styles.correctText : styles.incorrectText,
            ]}
            testID="feedback-text"
          >
            {feedback.correct
              ? '🎉 Awesome!'
              : `Almost! The word is "${feedback.word}" 😅`}
          </Text>
        </View>
      )}

      <View style={styles.inputSection}>
        <TouchableOpacity
          style={styles.modeToggleButton}
          onPress={handleModeToggle}
          testID="mode-toggle-button"
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${inputMode === 'text' ? 'letter-by-letter' : 'text'} mode`}
        >
          <Text style={styles.modeToggleText}>
            {inputMode === 'text' ? '🔤 Switch to Letter Mode' : '⌨️ Switch to Text Mode'}
          </Text>
        </TouchableOpacity>

        {inputMode === 'text' ? (
          <>
            <TextInput
              style={styles.textInput}
              value={answer}
              onChangeText={setAnswer}
              placeholder="Type your answer..."
              autoCapitalize="none"
              autoCorrect={false}
              testID="answer-input"
              accessibilityLabel="Type your spelling answer"
              editable={status === 'active' && !feedback}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!answer.trim() || !!feedback) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!answer.trim() || !!feedback}
              testID="submit-button"
              accessibilityRole="button"
              accessibilityLabel="Submit answer"
            >
              <Text style={styles.submitButtonText}>Submit ✨</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.letterDisplay} testID="letter-display">
              <Text style={styles.letterDisplayText} testID="letter-display-text">
                {letterSequence || ' '}
              </Text>
            </View>

            <LetterKeyboard
              onLetterPress={handleLetterPress}
              onBackspace={handleBackspace}
            />

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!letterSequence || !!feedback) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!letterSequence || !!feedback}
              testID="submit-button"
              accessibilityRole="button"
              accessibilityLabel="Submit answer"
            >
              <Text style={styles.submitButtonText}>Submit ✨</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#F3E5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioSection: {
    marginVertical: 24,
  },
  inputSection: {
    width: '100%',
    marginTop: 16,
    alignItems: 'center',
  },
  textInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#CE93D8',
    borderRadius: 16,
    padding: 14,
    fontSize: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
    color: '#4A148C',
  },
  submitButton: {
    backgroundColor: '#FF6D00',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 160,
    minHeight: 48,
    alignItems: 'center',
    shadowColor: '#FF6D00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#FFAB91',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  feedbackContainer: {
    width: '100%',
    padding: 14,
    borderRadius: 16,
    marginVertical: 12,
  },
  correctFeedback: {
    backgroundColor: '#C8E6C9',
  },
  incorrectFeedback: {
    backgroundColor: '#FFCDD2',
  },
  feedbackText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '600',
  },
  correctText: {
    color: '#2E7D32',
  },
  incorrectText: {
    color: '#C62828',
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
  },
  loadingText: {
    fontSize: 16,
    color: '#4A148C',
  },
  modeToggleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#CE93D8',
    minHeight: 48,
  },
  modeToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7C4DFF',
    textAlign: 'center',
  },
  letterDisplay: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#CE93D8',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    minHeight: 56,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  letterDisplayText: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 4,
    color: '#4A148C',
  },
});
