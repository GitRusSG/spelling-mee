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

    mockPlayWord.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  // ─── Requirement 4.1: Audio plays on mount ──────────────────────────────────

  it('plays audio for the first word on mount', async () => {
    render(<TestScreen />);

    await waitFor(() => {
      expect(mockPlayWord).toHaveBeenCalledWith('apple');
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
      expect(feedbackText.props.children).toContain('Correct');
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
      expect(feedbackText.props.children).toContain('Incorrect');
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
});
