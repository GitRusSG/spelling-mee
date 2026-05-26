import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useLocalSearchParams: () => ({ listId: 'test-list-1' }),
}));

const mockInitSession = jest.fn();
const mockSubmitAnswer = jest.fn();
const mockRepeatWord = jest.fn();

let mockSessionState: any = {};

jest.mock('../../src/contexts/TestSessionContext', () => ({
  useTestSession: () => ({
    ...mockSessionState,
    initSession: mockInitSession,
    submitAnswer: mockSubmitAnswer,
    repeatWord: mockRepeatWord,
  }),
}));

const mockGetById = jest.fn();

jest.mock('../../src/contexts/WordListContext', () => ({
  useWordList: () => ({
    getById: mockGetById,
  }),
}));

const mockPlayWord = jest.fn();

jest.mock('../../src/services/AudioService', () => ({
  AudioService: {
    playWord: (...args: any[]) => mockPlayWord(...args),
  },
  AudioSourceType: {},
}));

jest.mock('../../src/contexts/SubscriptionContext', () => ({
  useSubscription: () => ({
    isSubscribed: false,
    status: 'none',
    expiresAt: null,
    purchase: jest.fn(),
    restore: jest.fn(),
  }),
}));

jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-123' },
    isAuthenticated: true,
    isLoading: false,
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
}));

jest.mock('../../src/contexts/VoiceProfileContext', () => ({
  useVoiceProfile: () => ({
    profile: { voiceId: 'en-GB-female', speed: 1.0, label: 'British Female' },
    availableVoices: [],
    isLoading: false,
    updateProfile: jest.fn(),
    previewVoice: jest.fn(),
  }),
}));

const mockGetDownloadUrl = jest.fn();

jest.mock('../../src/services/DictationStorageService', () => ({
  getDownloadUrl: (...args: any[]) => mockGetDownloadUrl(...args),
}));

jest.mock('../../src/services/AdService', () => ({
  shouldShowAd: () => false,
}));

jest.mock('../../src/types/errors', () => {
  class AudioUnavailableError extends Error {
    word: string;
    reason: string;
    constructor(word: string, reason: string) {
      super(`Audio unavailable for "${word}": ${reason}`);
      this.name = 'AudioUnavailableError';
      this.word = word;
      this.reason = reason;
      Object.setPrototypeOf(this, AudioUnavailableError.prototype);
    }
  }
  return { AudioUnavailableError };
});

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  TestIds: { BANNER: 'test-banner-id' },
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// ─── Import after mocks ──────────────────────────────────────────────────────

import TestScreen from '../test/[listId]';
import { AudioUnavailableError } from '../../src/types/errors';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TestScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockSessionState = {
      wordList: {
        id: 'test-list-1',
        name: 'Test List',
        type: 'builtin',
        words: ['apple', 'banana', 'cherry'],
        wordCount: 3,
      },
      currentIndex: 0,
      inputMode: 'text',
      answers: [],
      status: 'active',
    };

    mockGetById.mockReturnValue({
      id: 'test-list-1',
      name: 'Test List',
      type: 'builtin',
      words: ['apple', 'banana', 'cherry'],
      wordCount: 3,
    });

    mockPlayWord.mockResolvedValue({ sourceUsed: 'default' });
    mockGetDownloadUrl.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ─── Requirement 4.1: Audio plays on mount ──────────────────────────────────

  it('plays audio for the first word on mount', async () => {
    render(<TestScreen />);

    await waitFor(() => {
      expect(mockPlayWord).toHaveBeenCalledWith('apple', expect.objectContaining({
        voiceProfile: { voiceId: 'en-GB-female', speed: 1.0, label: 'British Female' },
      }));
    });
  });

  it('calls initSession on mount with the word list', async () => {
    render(<TestScreen />);

    await waitFor(() => {
      expect(mockInitSession).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-list-1',
          words: ['apple', 'banana', 'cherry'],
        }),
        'text'
      );
    });
  });

  // ─── Requirement 4.4, 4.5: Submitting correct answer shows feedback ─────────

  it('shows correct feedback when submitting the correct answer', async () => {
    const { getByTestId } = render(<TestScreen />);

    // Type the correct answer
    const input = getByTestId('answer-input');
    fireEvent.changeText(input, 'apple');

    // Submit
    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    // Feedback should show correct
    await waitFor(() => {
      const feedbackText = getByTestId('feedback-text');
      expect(feedbackText.props.children).toContain('Awesome');
    });

    // submitAnswer should have been called
    expect(mockSubmitAnswer).toHaveBeenCalledWith('apple');
  });

  // ─── Requirement 4.4, 4.5: Submitting incorrect answer shows feedback ───────

  it('shows incorrect feedback when submitting a wrong answer', async () => {
    const { getByTestId } = render(<TestScreen />);

    // Type an incorrect answer
    const input = getByTestId('answer-input');
    fireEvent.changeText(input, 'aple');

    // Submit
    const submitButton = getByTestId('submit-button');
    fireEvent.press(submitButton);

    // Feedback should show incorrect with the correct spelling
    await waitFor(() => {
      const feedbackText = getByTestId('feedback-text');
      expect(feedbackText.props.children).toContain('Almost');
    });

    expect(mockSubmitAnswer).toHaveBeenCalledWith('aple');
  });

  // ─── Requirement 6.1, 6.2: Letter-by-letter mode ───────────────────────────

  it('renders LetterKeyboard in letter-by-letter mode and accumulates letters', async () => {
    const { getByTestId } = render(<TestScreen />);

    // Switch to letter-by-letter mode
    const modeToggle = getByTestId('mode-toggle-button');
    fireEvent.press(modeToggle);

    // After toggling, LetterKeyboard should be rendered
    expect(getByTestId('letter-keyboard')).toBeTruthy();

    // Press some letters
    fireEvent.press(getByTestId('letter-button-A'));
    fireEvent.press(getByTestId('letter-button-P'));
    fireEvent.press(getByTestId('letter-button-P'));

    // The letter display should show the accumulated letters (lowercase)
    const letterDisplayText = getByTestId('letter-display-text');
    expect(letterDisplayText.props.children).toBe('app');
  });

  // ─── Requirement 4.8: Audio error sets AudioButton to error state ───────────

  it('sets AudioButton to error state when audio fails with AudioUnavailableError', async () => {
    mockPlayWord.mockRejectedValue(
      new AudioUnavailableError('apple', 'tts-failed')
    );

    const { getByTestId } = render(<TestScreen />);

    // Wait for the audio error to be processed
    await waitFor(() => {
      expect(getByTestId('audio-button-error-indicator')).toBeTruthy();
    });
  });

  // ─── Requirement 9.4: Audio source indicator ────────────────────────────────

  it('displays audio source indicator showing which source is active', async () => {
    mockPlayWord.mockResolvedValue({ sourceUsed: 'dictation' });

    const { getByTestId } = render(<TestScreen />);

    await waitFor(() => {
      const indicator = getByTestId('audio-source-indicator');
      expect(indicator.props.children).toContain('Parent');
    });
  });

  it('displays voice-profile indicator when TTS with profile is used', async () => {
    mockPlayWord.mockResolvedValue({ sourceUsed: 'voice-profile' });

    const { getByTestId } = render(<TestScreen />);

    await waitFor(() => {
      const indicator = getByTestId('audio-source-indicator');
      expect(indicator.props.children).toContain('Custom voice');
    });
  });

  // ─── Requirement 9.3: Error + retry when all sources fail ───────────────────

  it('shows error message with retry button when all audio sources fail', async () => {
    mockPlayWord.mockRejectedValue(
      new AudioUnavailableError('apple', 'tts-failed')
    );

    const { getByTestId } = render(<TestScreen />);

    await waitFor(() => {
      expect(getByTestId('audio-error-container')).toBeTruthy();
      expect(getByTestId('retry-button')).toBeTruthy();
    });
  });

  it('retries audio playback when retry button is pressed', async () => {
    mockPlayWord
      .mockRejectedValueOnce(new AudioUnavailableError('apple', 'tts-failed'))
      .mockResolvedValueOnce({ sourceUsed: 'default' });

    const { getByTestId } = render(<TestScreen />);

    await waitFor(() => {
      expect(getByTestId('retry-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('retry-button'));

    await waitFor(() => {
      expect(mockPlayWord).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Requirement 6.4: Fallback notice when dictation fails ──────────────────

  it('shows fallback notice when dictation was available but TTS was used', async () => {
    mockGetDownloadUrl.mockResolvedValue('https://storage.example.com/dictation.m4a');
    mockPlayWord.mockResolvedValue({ sourceUsed: 'voice-profile' });

    const { getByTestId } = render(<TestScreen />);

    await waitFor(() => {
      expect(getByTestId('fallback-notice')).toBeTruthy();
    });
  });

  // ─── Requirement 6.1: Dictation URL is passed to AudioService ───────────────

  it('passes dictation URL to AudioService when available', async () => {
    mockGetDownloadUrl.mockResolvedValue('https://storage.example.com/apple.m4a');
    mockPlayWord.mockResolvedValue({ sourceUsed: 'dictation' });

    render(<TestScreen />);

    await waitFor(() => {
      expect(mockPlayWord).toHaveBeenCalledWith('apple', expect.objectContaining({
        dictationUrl: 'https://storage.example.com/apple.m4a',
        voiceProfile: { voiceId: 'en-GB-female', speed: 1.0, label: 'British Female' },
      }));
    });
  });
});
