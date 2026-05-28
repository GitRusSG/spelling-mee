import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTestSession } from '../../src/contexts/TestSessionContext';
import { useWordList } from '../../src/contexts/WordListContext';
import { useSubscription } from '../../src/contexts/SubscriptionContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useVoiceProfile } from '../../src/contexts/VoiceProfileContext';
import { AudioService, AudioSourceType } from '../../src/services/AudioService';
import * as DictationStorageService from '../../src/services/DictationStorageService';
import { AudioUnavailableError } from '../../src/types/errors';
import { shouldShowAd } from '../../src/services/AdService';
import ProgressIndicator from '../../src/components/ProgressIndicator';
import AudioButton from '../../src/components/AudioButton';
import LetterKeyboard from '../../src/components/LetterKeyboard';
import QwertyKeyboard from '../../src/components/QwertyKeyboard';
import InterstitialAd from '../../src/components/InterstitialAd';
import ConfettiAnimation from '../../src/components/ConfettiAnimation';
import DrawingCanvas from '../../src/components/DrawingCanvas';
import { InputMode } from '../../src/types';
import { playCorrectSound, playIncorrectSound, playStreakSound, playButtonClickSound } from '../../src/utils/soundEffects';
import AnimatedBackground from '../../src/components/AnimatedBackground';
import RareEvent from '../../src/components/RareEvent';
import { getEquippedTextStyle } from '../../src/utils/textStyles';

const ENCOURAGEMENT_MESSAGES = [
  "You're on fire! 🔥",
  "Superstar! ⭐",
  "Keep going! 🚀",
  "Brilliant! 💫",
  "Unstoppable! 🌟",
  "Amazing! 🎉",
  "Fantastic! 💥",
];

const INCORRECT_ENCOURAGEMENT = "Almost! You'll get it next time 😊";

type AudioButtonState = 'idle' | 'loading' | 'playing' | 'error';

interface Feedback {
  correct: boolean;
  word: string;
  given: string;
}

const SOURCE_LABELS: Record<AudioSourceType, string> = {
  'dictation': '🎙️ Parent\'s voice',
  'voice-profile': '🗣️ Custom voice',
  'default': '🔊 Default',
};

export default function TestScreen() {
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const router = useRouter();
  const { getById } = useWordList();
  const { status: subscriptionStatus } = useSubscription();
  const { user } = useAuth();
  const { profile: voiceProfile } = useVoiceProfile();
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
  const [isDictating, setIsDictating] = useState(false);
  const [dictationFeedback, setDictationFeedback] = useState<string | null>(null);
  const [dictationOptions, setDictationOptions] = useState<string[] | null>(null);
  const [drawLetterCount, setDrawLetterCount] = useState(0);
  const dictationFeedbackOpacity = useRef(new Animated.Value(0)).current;
  const recognitionRef = useRef<any>(null);
  const [showAd, setShowAd] = useState(() => shouldShowAd(subscriptionStatus));
  const [audioSource, setAudioSource] = useState<AudioSourceType | null>(null);
  const [allSourcesFailed, setAllSourcesFailed] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const fallbackOpacity = useRef(new Animated.Value(0)).current;

  // Honey balance state
  const [honey, setHoney] = useState(0);

  // Gamification state
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [encouragementMessage, setEncouragementMessage] = useState<string | null>(null);
  const encouragementOpacity = useRef(new Animated.Value(0)).current;
  const streakGlow = useRef(new Animated.Value(0)).current;
  const [showStreakGlow, setShowStreakGlow] = useState(false);
  const [rareEventTrigger, setRareEventTrigger] = useState(false);

  const equippedTextStyle = getEquippedTextStyle();

  function getAutoContinueDelay(): number {
    try {
      const { createStorage } = require('../../src/services/storage');
      const storage = createStorage();
      const stored = storage.getString('auto_continue_delay');
      return stored ? parseInt(stored, 10) : 2000;
    } catch {
      return 2000;
    }
  }

  const handleAdClose = useCallback(() => {
    setShowAd(false);
  }, []);

  // Load honey balance on mount
  useEffect(() => {
    try {
      const storage = require('../../src/services/storage').createStorage();
      const currentHoney = parseInt(storage.getString('total_honey') || '0', 10);
      setHoney(currentHoney);
    } catch {}
  }, []);

  // Show encouragement message with fade animation
  const showEncouragement = useCallback((message: string) => {
    setEncouragementMessage(message);
    encouragementOpacity.setValue(1);
    Animated.timing(encouragementOpacity, {
      toValue: 0,
      duration: 500,
      delay: 1500,
      useNativeDriver: true,
    }).start(() => {
      setEncouragementMessage(null);
    });
  }, [encouragementOpacity]);

  // Animate streak glow for milestones
  const animateStreakGlow = useCallback(() => {
    setShowStreakGlow(true);
    streakGlow.setValue(0);
    Animated.sequence([
      Animated.timing(streakGlow, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(streakGlow, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowStreakGlow(false);
    });
  }, [streakGlow]);

  // Map spoken text to a single letter A-Z
  const mapSpokenToLetter = useCallback((spoken: string): string | null => {
    // Strip punctuation and extra spaces from the transcript
    const cleaned = spoken.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

    // Direct single letter match
    if (/^[a-z]$/.test(cleaned)) return cleaned.toUpperCase();

    // Common spoken forms of letters (expanded for better recognition)
    const spokenMap: Record<string, string> = {
      // A
      'ay': 'A', 'a': 'A', 'hey': 'A', 'eh': 'A', 'aye': 'A', 'eight': 'A',
      // B
      'bee': 'B', 'be': 'B', 'b': 'B', 'bea': 'B',
      // C
      'see': 'C', 'sea': 'C', 'c': 'C', 'si': 'C', 'cee': 'C',
      // D
      'dee': 'D', 'd': 'D', 'de': 'D', 'the': 'D',
      // E
      'ee': 'E', 'e': 'E',
      // F
      'ef': 'F', 'eff': 'F', 'f': 'F', 'if': 'F', 'four': 'F',
      // G
      'gee': 'G', 'g': 'G', 'ge': 'G', 'ji': 'G',
      // H
      'aitch': 'H', 'h': 'H', 'age': 'H', 'ach': 'H', 'each': 'H', 'ache': 'H',
      // I
      'eye': 'I', 'i': 'I', 'ai': 'I', 'aye': 'I',
      // J
      'jay': 'J', 'j': 'J', 'je': 'J', 'jae': 'J',
      // K
      'kay': 'K', 'k': 'K', 'ca': 'K', 'ke': 'K', 'okay': 'K',
      // L
      'el': 'L', 'ell': 'L', 'l': 'L', 'ale': 'L',
      // M
      'em': 'M', 'm': 'M', 'am': 'M',
      // N
      'en': 'N', 'n': 'N', 'an': 'N', 'and': 'N',
      // O
      'oh': 'O', 'o': 'O', 'owe': 'O',
      // P
      'pee': 'P', 'p': 'P', 'pe': 'P',
      // Q
      'cue': 'Q', 'queue': 'Q', 'q': 'Q', 'cu': 'Q', 'que': 'Q',
      // R
      'ar': 'R', 'are': 'R', 'r': 'R', 'our': 'R',
      // S
      'es': 'S', 'ess': 'S', 's': 'S', 'as': 'S', 'ass': 'S',
      // T
      'tee': 'T', 'tea': 'T', 't': 'T', 'te': 'T', 'two': 'T',
      // U
      'you': 'U', 'u': 'U', 'yu': 'U', 'ew': 'U',
      // V
      'vee': 'V', 'v': 'V', 've': 'V', 'we': 'V',
      // W
      'double u': 'W', 'double-u': 'W', 'w': 'W', 'double you': 'W', 'doubleyou': 'W', 'double': 'W', 'one': 'W',
      // X
      'ex': 'X', 'x': 'X', 'eggs': 'X',
      // Y
      'why': 'Y', 'y': 'Y', 'wie': 'Y', 'wye': 'Y',
      // Z
      'zee': 'Z', 'zed': 'Z', 'z': 'Z', 'said': 'Z', 'set': 'Z',
    };

    // Try the full cleaned text first
    if (spokenMap[cleaned]) return spokenMap[cleaned];

    // If the transcript contains multiple words, try each word individually
    const words = cleaned.split(' ');
    if (words.length > 1) {
      for (const word of words) {
        if (spokenMap[word]) return spokenMap[word];
      }
    }

    // Fallback: if the speech result starts with a single letter followed by common suffixes, extract it
    const firstLetterMatch = cleaned.match(/^([a-z])\s/);
    if (firstLetterMatch) {
      return firstLetterMatch[1].toUpperCase();
    }

    // Phonetic ending match — if it ends like a letter name, use that
    const endingMap: Record<string, string> = {
      'ee': 'E', 'ey': 'A', 'ay': 'A', 'ar': 'R', 'oh': 'O',
      'oo': 'U', 'ew': 'U', 'ex': 'X', 'em': 'M', 'en': 'N',
      'el': 'L', 'es': 'S',
    };
    for (const [ending, letter] of Object.entries(endingMap)) {
      if (cleaned.endsWith(ending) && cleaned.length <= 4) {
        return letter;
      }
    }

    // Last resort: just take the first character if it's a letter
    if (cleaned.length > 0 && /^[a-z]/.test(cleaned)) {
      return cleaned[0].toUpperCase();
    }

    return null;
  }, []);

  // Show dictation feedback briefly
  const showDictationFeedback = useCallback((message: string) => {
    setDictationFeedback(message);
    dictationFeedbackOpacity.setValue(1);
    Animated.timing(dictationFeedbackOpacity, {
      toValue: 0,
      duration: 300,
      delay: 800,
      useNativeDriver: Platform.OS !== 'web' ? true : false,
    }).start(() => {
      setDictationFeedback(null);
    });
  }, [dictationFeedbackOpacity]);

  // Start or stop voice dictation
  const handleDictate = useCallback(() => {
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Not Available',
        'Voice dictation is only available on web',
        [{ text: 'OK' }]
      );
      return;
    }

    // If already dictating, stop
    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      setIsDictating(false);
      return;
    }

    // Check browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      Alert.alert(
        'Not Supported',
        'Your browser does not support speech recognition. Try Chrome or Edge.',
        [{ text: 'OK' }]
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      // Gather all alternatives
      const alternatives: string[] = [];
      for (let i = 0; i < event.results[0].length; i++) {
        alternatives.push(event.results[0][i].transcript.trim().toLowerCase());
      }

      // Try to match each alternative to a letter
      const matchedLetters: string[] = [];
      for (const alt of alternatives) {
        const letter = mapSpokenToLetter(alt);
        if (letter && !matchedLetters.includes(letter)) {
          matchedLetters.push(letter);
        }
      }

      if (matchedLetters.length === 1) {
        // Clear match — auto-add
        setLetterSequence((prev) => prev + matchedLetters[0].toLowerCase());
        showDictationFeedback(`${matchedLetters[0]} ✓`);
        setDictationOptions(null);
      } else if (matchedLetters.length > 1) {
        // Ambiguous — show options for the child to pick
        setDictationOptions(matchedLetters.slice(0, 4));
        showDictationFeedback('Which letter did you mean?');
      } else {
        // No match at all — show first character fallback
        const firstAlt = alternatives[0] || '';
        if (firstAlt.length > 0 && /^[a-z]/.test(firstAlt)) {
          const fallback = firstAlt[0].toUpperCase();
          setLetterSequence((prev) => prev + fallback.toLowerCase());
          showDictationFeedback(`${fallback} ✓`);
          setDictationOptions(null);
        } else {
          showDictationFeedback("Say a letter clearly!");
          setDictationOptions(null);
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return;
      showDictationFeedback("Couldn't hear that, try again");
    };

    recognition.onend = () => {
      // Auto-restart if still in dictation mode
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          // Recognition may have been aborted
          setIsDictating(false);
          recognitionRef.current = null;
        }
      }
    };

    recognitionRef.current = recognition;
    setIsDictating(true);

    try {
      recognition.start();
    } catch {
      setIsDictating(false);
      recognitionRef.current = null;
      showDictationFeedback("Couldn't start listening");
    }
  }, [isDictating, mapSpokenToLetter, showDictationFeedback]);

  // Clean up recognition on unmount or mode switch
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Stop dictation when switching away from letter-by-letter mode
  useEffect(() => {
    if (inputMode !== 'letter-by-letter' && isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      setIsDictating(false);
    }
  }, [inputMode, isDictating]);

  // Show a brief fallback notification that fades after 2 seconds
  const showFallbackNotice = useCallback((message: string) => {
    setFallbackNotice(message);
    fallbackOpacity.setValue(1);
    Animated.timing(fallbackOpacity, {
      toValue: 0,
      duration: 500,
      delay: 1500,
      useNativeDriver: true,
    }).start(() => {
      setFallbackNotice(null);
    });
  }, [fallbackOpacity]);

  // Look up dictation URL for a word — skip if no user or on web (too slow)
  const getDictationUrl = useCallback(async (word: string): Promise<string | null> => {
    // Skip dictation lookup on web or when not authenticated — go straight to TTS
    if (!user?.uid || Platform.OS === 'web') return null;
    try {
      return await DictationStorageService.getDownloadUrl(user.uid, listId, word);
    } catch {
      return null;
    }
  }, [user, listId]);

  // Initialize session on mount
  useEffect(() => {
    if (initialized) return;
    const wordList = getById(listId);
    if (!wordList) return;

    initSession(wordList, 'text');
    setInitialized(true);
    // Only play the first word after ad is dismissed
    if (!showAd) {
      playWord(wordList.words[0]);
    }
  }, [listId, initialized]);

  // Play first word when ad closes
  useEffect(() => {
    if (!showAd && initialized && sessionWordList) {
      playWord(sessionWordList.words[0]);
    }
  }, [showAd]);

  // Navigate to results when test is complete
  useEffect(() => {
    if (status === 'complete') {
      router.replace('/test/results');
    }
  }, [status]);

  const playWord = useCallback(async (word: string) => {
    setAudioState('loading');
    setAllSourcesFailed(false);
    try {
      // Look up dictation URL
      const dictationUrl = await getDictationUrl(word);

      // Determine if we expected dictation but it will fail (for fallback notice)
      const hadDictation = !!dictationUrl;

      const result = await AudioService.playWord(word, {
        dictationUrl,
        voiceProfile,
      });

      setAudioSource(result.sourceUsed);
      setAudioState('idle');

      // If we had a dictation URL but ended up using TTS, show fallback notice
      if (hadDictation && result.sourceUsed !== 'dictation') {
        showFallbackNotice('Using TTS voice');
      }
    } catch (error) {
      if (error instanceof AudioUnavailableError) {
        setAudioState('error');
        setAllSourcesFailed(true);
        setAudioSource(null);
      } else {
        setAudioState('error');
        setAllSourcesFailed(true);
        setAudioSource(null);
      }
    }
  }, [getDictationUrl, voiceProfile, showFallbackNotice]);

  const handleAudioPress = useCallback(() => {
    if (!sessionWordList) return;
    const currentWord = sessionWordList.words[currentIndex];
    playWord(currentWord);
  }, [sessionWordList, currentIndex, playWord]);

  const handleRetry = useCallback(() => {
    if (!sessionWordList) return;
    const currentWord = sessionWordList.words[currentIndex];
    playWord(currentWord);
  }, [sessionWordList, currentIndex, playWord]);

  const handleSubmit = useCallback(() => {
    if (!sessionWordList || status !== 'active') return;

    const currentWord = sessionWordList.words[currentIndex];
    const currentAnswer = inputMode === 'text' ? answer : letterSequence;
    const trimmedAnswer = currentAnswer.trim().toLowerCase();
    const isCorrect = currentWord.trim().toLowerCase() === trimmedAnswer;

    // Show feedback
    setFeedback({
      correct: isCorrect,
      word: currentWord,
      given: currentAnswer.trim(),
    });

    // Gamification: confetti, streak, encouragement
    if (isCorrect) {
      playCorrectSound();

      // Trigger confetti
      setConfettiTrigger(false);
      setTimeout(() => setConfettiTrigger(true), 10);

      // Update streak
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Check for streak milestones (3, 5, 10)
      if (newStreak === 3 || newStreak === 5 || newStreak === 10) {
        playStreakSound();
        animateStreakGlow();
      }

      // Update total correct and show encouragement every 3rd correct
      const newTotalCorrect = totalCorrect + 1;
      setTotalCorrect(newTotalCorrect);

      // Award honey for correct answers
      try {
        const storage = require('../../src/services/storage').createStorage();
        const currentHoney = parseInt(storage.getString('total_honey') || '0', 10);
        const newHoney = currentHoney + 1;
        storage.set('total_honey', String(newHoney));
        setHoney(newHoney);
      } catch {}

      if (newTotalCorrect % 3 === 0) {
        const randomMsg = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];
        showEncouragement(randomMsg);
      }
    } else {
      playIncorrectSound();
      // Reset streak on incorrect
      setStreak(0);
      // Show gentle encouragement on incorrect
      showEncouragement(INCORRECT_ENCOURAGEMENT);
    }

    // Submit the answer (this advances the index or completes the session)
    submitAnswer(currentAnswer);
    setAnswer('');
    setLetterSequence('');

    // Auto-continue after delay for correct answers
    if (isCorrect) {
      const delay = getAutoContinueDelay();
      if (delay > 0) {
        setTimeout(() => {
          setRareEventTrigger(prev => !prev); // Trigger rare event check
          handleContinue();
        }, delay);
      }
    }

  }, [sessionWordList, currentIndex, answer, letterSequence, inputMode, status, submitAnswer, playWord, streak, totalCorrect, showEncouragement, animateStreakGlow]);

  const handleContinue = useCallback(() => {
    if (!sessionWordList) return;
    playButtonClickSound();
    setFeedback(null);
    setConfettiTrigger(false);
    setDrawLetterCount(0);
    setLetterSequence('');
    setAnswer('');
    setRareEventTrigger(prev => !prev);
    const nextIndex = currentIndex;
    if (nextIndex < sessionWordList.words.length) {
      playWord(sessionWordList.words[nextIndex]);
    }
  }, [sessionWordList, currentIndex, playWord]);

  // Listen for physical Enter key to submit or continue
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (feedback) {
          // If showing feedback, Enter = Continue
          handleContinue();
        } else if (inputMode === 'text' && answer.trim()) {
          handleSubmit();
        } else if ((inputMode === 'letter-by-letter' || inputMode === 'draw') && letterSequence) {
          handleSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback, answer, letterSequence, inputMode, handleSubmit, handleContinue]);

  const handleLetterPress = useCallback((letter: string) => {
    setLetterSequence((prev) => prev + letter.toLowerCase());
  }, []);

  const handleBackspace = useCallback(() => {
    setLetterSequence((prev) => prev.slice(0, -1));
  }, []);

  const handleModeToggle = useCallback(() => {
    const modeOrder: InputMode[] = ['text', 'letter-by-letter', 'draw'];
    const currentIdx = modeOrder.indexOf(inputMode);
    const newMode = modeOrder[(currentIdx + 1) % modeOrder.length];
    setInputMode(newMode);
    // Clear current input when switching modes
    setAnswer('');
    setLetterSequence('');
    setDrawLetterCount(0);
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
        {showAd && <InterstitialAd visible={showAd} onClose={handleAdClose} />}
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedBackground />
      <InterstitialAd visible={showAd} onClose={handleAdClose} />
      <ConfettiAnimation trigger={confettiTrigger} intensity="small" />
      <RareEvent trigger={rareEventTrigger} />
      <View style={styles.honeyBadge} testID="honey-badge">
        <Text style={styles.honeyBadgeText}>🍯 {honey}</Text>
      </View>
      <TouchableOpacity style={styles.homeIconButton} onPress={() => {
        if (typeof window !== 'undefined') {
          if (window.confirm('Leave test? Your progress will be lost.')) {
            router.replace('/');
          }
        } else {
          router.replace('/');
        }
      }} testID="home-icon-button">
        <Text style={styles.homeIconText}>🏠</Text>
      </TouchableOpacity>
      <ProgressIndicator
        current={currentIndex + 1}
        total={sessionWordList.words.length}
      />

      {/* Streak counter */}
      {streak >= 2 && (
        <Animated.View
          style={[
            styles.streakContainer,
            showStreakGlow && {
              opacity: streakGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1],
              }),
              transform: [{
                scale: streakGlow.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.3, 1],
                }),
              }],
            },
          ]}
          testID="streak-counter"
        >
          <Text style={styles.streakText}>🍯 {streak} honey streak!</Text>
        </Animated.View>
      )}

      {/* Encouragement message */}
      {encouragementMessage && (
        <Animated.View
          style={[styles.encouragementContainer, { opacity: encouragementOpacity }]}
          testID="encouragement-message"
        >
          <Text style={styles.encouragementText}>{encouragementMessage}</Text>
        </Animated.View>
      )}

      <View style={styles.audioSection}>
        <AudioButton onPress={handleAudioPress} state={audioState} />
        {audioSource && (
          <Text style={styles.audioSourceIndicator} testID="audio-source-indicator">
            {SOURCE_LABELS[audioSource]}
          </Text>
        )}
      </View>

      {/* Fallback notification */}
      {fallbackNotice && (
        <Animated.View style={[styles.fallbackNotice, { opacity: fallbackOpacity }]} testID="fallback-notice">
          <Text style={styles.fallbackNoticeText}>{fallbackNotice}</Text>
        </Animated.View>
      )}

      {/* All sources failed — error + retry */}
      {allSourcesFailed && (
        <View style={styles.errorContainer} testID="audio-error-container">
          <Text style={styles.audioErrorText}>Unable to play audio</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            testID="retry-button"
            accessibilityRole="button"
            accessibilityLabel="Retry audio playback"
          >
            <Text style={styles.retryButtonText}>Retry 🔄</Text>
          </TouchableOpacity>
        </View>
      )}

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
              : `Almost! 😅`}
          </Text>
          {!feedback.correct && (
            <View style={styles.comparisonContainer}>
              <Text style={styles.comparisonLabel}>You typed:</Text>
              <View style={styles.letterComparisonRow}>
                {feedback.given.split('').map((char, i) => {
                  const correctChar = feedback.word[i] || '';
                  const isWrong = char.toLowerCase() !== correctChar.toLowerCase();
                  return (
                    <Text key={i} style={[styles.comparisonChar, isWrong && styles.wrongChar]}>
                      {char}
                    </Text>
                  );
                })}
              </View>
              <Text style={styles.comparisonLabel}>Correct:</Text>
              <Text style={styles.comparisonCorrect}>{feedback.word}</Text>
            </View>
          )}
        </View>
      )}

      {feedback && !feedback.correct && status !== 'complete' && (
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          testID="continue-button"
          accessibilityRole="button"
          accessibilityLabel="Continue to next word"
        >
          <Text style={styles.continueButtonText}>Continue →</Text>
        </TouchableOpacity>
      )}

      <View style={styles.inputSection}>
        <TouchableOpacity
          style={styles.modeToggleButton}
          onPress={handleModeToggle}
          testID="mode-toggle-button"
          accessibilityRole="button"
          accessibilityLabel={`Switch to ${inputMode === 'text' ? 'dictation' : inputMode === 'letter-by-letter' ? 'draw' : 'text'} mode`}
        >
          <Text style={styles.modeToggleText}>
            {inputMode === 'text'
              ? '🔤 Switch to Dictation Mode'
              : inputMode === 'letter-by-letter'
              ? '✏️ Switch to Draw Mode'
              : '⌨️ Switch to Text Mode'}
          </Text>
        </TouchableOpacity>

        {inputMode === 'text' ? (
          <>
            <View style={styles.letterDisplay} testID="answer-display">
              <Text style={[styles.letterDisplayText, equippedTextStyle]} testID="answer-display-text">
                {answer || ' '}
              </Text>
            </View>

            <QwertyKeyboard
              onKeyPress={(key) => setAnswer((prev) => prev + key)}
              onBackspace={() => setAnswer((prev) => prev.slice(0, -1))}
              onSubmit={handleSubmit}
              submitDisabled={!answer.trim() || !!feedback}
            />
          </>
        ) : inputMode === 'draw' ? (
          <>
            <Text style={styles.dictationInstruction}>
              Draw each letter one at a time
            </Text>

            <View style={styles.letterDisplay} testID="letter-display">
              <Text style={[styles.letterDisplayText, equippedTextStyle]} testID="letter-display-text">
                {letterSequence || ' '}
              </Text>
            </View>

            <DrawingCanvas
              onLetterConfirmed={(letter) => {
                setLetterSequence((prev) => prev + letter);
                setDrawLetterCount((prev) => prev + 1);
              }}
              onClear={() => {}}
              letterIndex={drawLetterCount}
            />

            {letterSequence.length > 0 && (
              <TouchableOpacity
                style={styles.backspaceButton}
                onPress={() => {
                  setLetterSequence((prev) => prev.slice(0, -1));
                  setDrawLetterCount((prev) => Math.max(0, prev - 1));
                }}
                accessibilityRole="button"
                accessibilityLabel="Delete last letter"
                testID="backspace-button"
              >
                <Text style={styles.backspaceButtonText}>⬅️ Backspace</Text>
              </TouchableOpacity>
            )}

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
        ) : (
          <>
            <Text style={styles.dictationInstruction}>
              Spell it out, one letter at a time
            </Text>

            <View style={styles.letterDisplay} testID="letter-display">
              <Text style={[styles.letterDisplayText, equippedTextStyle]} testID="letter-display-text">
                {letterSequence || ' '}
              </Text>
            </View>

            {/* Dictate button — speak letters */}
            <TouchableOpacity
              style={[
                styles.dictateButton,
                isDictating && styles.dictateButtonListening,
              ]}
              onPress={handleDictate}
              accessibilityRole="button"
              accessibilityLabel={isDictating ? "Stop dictation" : "Dictate letters by speaking"}
              testID="dictate-button"
            >
              <Text style={styles.dictateButtonText}>
                {isDictating ? '🛑 Stop' : '🎤 Dictate'}
              </Text>
            </TouchableOpacity>

            {/* Dictation feedback */}
            {dictationFeedback && (
              <Animated.View
                style={[styles.dictationFeedbackContainer, { opacity: dictationFeedbackOpacity }]}
                testID="dictation-feedback"
              >
                <Text style={styles.dictationFeedbackText}>{dictationFeedback}</Text>
              </Animated.View>
            )}

            {/* Dictation options — when ambiguous, show letter choices */}
            {dictationOptions && (
              <View style={styles.dictationOptionsContainer} testID="dictation-options">
                <Text style={styles.dictationOptionsLabel}>Did you mean:</Text>
                <View style={styles.dictationOptionsRow}>
                  {dictationOptions.map((letter) => (
                    <TouchableOpacity
                      key={letter}
                      style={styles.dictationOptionButton}
                      onPress={() => {
                        setLetterSequence((prev) => prev + letter.toLowerCase());
                        setDictationOptions(null);
                        showDictationFeedback(`${letter} ✓`);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Select letter ${letter}`}
                      testID={`dictation-option-${letter}`}
                    >
                      <Text style={styles.dictationOptionText}>{letter}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Backspace button */}
            {letterSequence.length > 0 && (
              <TouchableOpacity
                style={styles.backspaceButton}
                onPress={() => setLetterSequence((prev) => prev.slice(0, -1))}
                accessibilityRole="button"
                accessibilityLabel="Delete last letter"
                testID="backspace-button"
              >
                <Text style={styles.backspaceButtonText}>⬅️ Backspace</Text>
              </TouchableOpacity>
            )}

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
  honeyBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#FFF8E1', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FFC107', zIndex: 10 },
  honeyBadgeText: { fontSize: 14, fontWeight: '700', color: '#F57F17' },
  homeIconButton: { position: 'absolute', top: 12, left: 12, zIndex: 10, backgroundColor: '#fff', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
  homeIconText: { fontSize: 20 },
  audioSection: {
    marginVertical: 24,
    alignItems: 'center',
  },
  audioSourceIndicator: {
    marginTop: 8,
    fontSize: 13,
    color: '#6A1B9A',
    fontWeight: '600',
  },
  fallbackNotice: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  fallbackNoticeText: {
    fontSize: 13,
    color: '#E65100',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  audioErrorText: {
    fontSize: 14,
    color: '#C62828',
    fontWeight: '600',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#FF6D00',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
  comparisonContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  comparisonLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  letterComparisonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  comparisonChar: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 2,
  },
  wrongChar: {
    color: '#C62828',
    textDecorationLine: 'underline',
    textDecorationColor: '#C62828',
  },
  comparisonWrong: {
    fontSize: 20,
    fontWeight: '700',
    color: '#C62828',
    textDecorationLine: 'line-through',
    marginBottom: 10,
    letterSpacing: 2,
  },
  comparisonCorrect: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 2,
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
  dictationInstruction: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A148C',
    textAlign: 'center',
    marginBottom: 12,
  },
  dictateButton: {
    backgroundColor: '#7C4DFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 8,
    minHeight: 48,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  dictateButtonListening: {
    backgroundColor: '#D32F2F',
    shadowColor: '#D32F2F',
  },
  dictateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  orText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  streakContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F57F17',
    textAlign: 'center',
  },
  encouragementContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  encouragementText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
  },
  dictationFeedbackContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  dictationFeedbackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
  },
  dictationOptionsContainer: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#FF6D00',
  },
  dictationOptionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 8,
  },
  dictationOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  dictationOptionButton: {
    backgroundColor: '#7C4DFF',
    borderRadius: 12,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  dictationOptionText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  backspaceButton: {
    backgroundColor: '#FF6D00',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
    minHeight: 44,
    alignItems: 'center',
  },
  backspaceButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
