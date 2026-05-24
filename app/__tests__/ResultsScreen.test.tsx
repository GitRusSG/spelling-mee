import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

const mockInitSession = jest.fn();

let mockSessionState: any = {};

jest.mock('../../src/contexts/TestSessionContext', () => {
  const actual = jest.requireActual('../../src/contexts/TestSessionContext');
  return {
    ...actual,
    useTestSession: () => ({
      ...mockSessionState,
      initSession: mockInitSession,
      submitAnswer: jest.fn(),
      repeatWord: jest.fn(),
    }),
  };
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

import ResultsScreen from '../test/results';

// ─── Test Data ───────────────────────────────────────────────────────────────

const testWordList = {
  id: 'test-list-1',
  name: 'Test List',
  type: 'builtin' as const,
  words: ['apple', 'banana', 'cherry'],
  wordCount: 3,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('ResultsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Requirement 7.1: Percentage displayed correctly ─────────────────────────

  describe('percentage display', () => {
    it('displays 100% when all answers are correct', () => {
      mockSessionState = {
        wordList: testWordList,
        currentIndex: 2,
        inputMode: 'text',
        answers: [
          { word: 'apple', given: 'apple', correct: true },
          { word: 'banana', given: 'banana', correct: true },
          { word: 'cherry', given: 'cherry', correct: true },
        ],
        status: 'complete',
      };

      const { getByTestId } = render(<ResultsScreen />);
      const percentageText = getByTestId('percentage-text');
      expect(percentageText.props.children).toEqual([100, '%']);
    });

    it('displays 0% when all answers are incorrect', () => {
      mockSessionState = {
        wordList: testWordList,
        currentIndex: 2,
        inputMode: 'text',
        answers: [
          { word: 'apple', given: 'aple', correct: false },
          { word: 'banana', given: 'bananna', correct: false },
          { word: 'cherry', given: 'chery', correct: false },
        ],
        status: 'complete',
      };

      const { getByTestId } = render(<ResultsScreen />);
      const percentageText = getByTestId('percentage-text');
      expect(percentageText.props.children).toEqual([0, '%']);
    });

    it('displays 67% when 2 of 3 answers are correct', () => {
      mockSessionState = {
        wordList: testWordList,
        currentIndex: 2,
        inputMode: 'text',
        answers: [
          { word: 'apple', given: 'apple', correct: true },
          { word: 'banana', given: 'banana', correct: true },
          { word: 'cherry', given: 'chery', correct: false },
        ],
        status: 'complete',
      };

      const { getByTestId } = render(<ResultsScreen />);
      const percentageText = getByTestId('percentage-text');
      expect(percentageText.props.children).toEqual([67, '%']);
    });
  });

  // ─── Requirement 7.2: Each word appears with correct label ───────────────────

  describe('word labels', () => {
    it('displays each word with the correct "correct" or "incorrect" label', () => {
      mockSessionState = {
        wordList: testWordList,
        currentIndex: 2,
        inputMode: 'text',
        answers: [
          { word: 'apple', given: 'apple', correct: true },
          { word: 'banana', given: 'bananna', correct: false },
          { word: 'cherry', given: 'cherry', correct: true },
        ],
        status: 'complete',
      };

      const { getByTestId } = render(<ResultsScreen />);

      // First word: correct
      const label0 = getByTestId('word-label-0');
      expect(label0.props.children).toBe('correct');

      // Second word: incorrect
      const label1 = getByTestId('word-label-1');
      expect(label1.props.children).toBe('incorrect');

      // Third word: correct
      const label2 = getByTestId('word-label-2');
      expect(label2.props.children).toBe('correct');
    });
  });

  // ─── Requirement 7.3: Incorrect words show child's answer and correct spelling

  describe('incorrect word details', () => {
    it('shows the child\'s answer and correct spelling for incorrect words', () => {
      mockSessionState = {
        wordList: testWordList,
        currentIndex: 2,
        inputMode: 'text',
        answers: [
          { word: 'apple', given: 'apple', correct: true },
          { word: 'banana', given: 'bananna', correct: false },
          { word: 'cherry', given: 'chery', correct: false },
        ],
        status: 'complete',
      };

      const { getByTestId, queryByTestId } = render(<ResultsScreen />);

      // Correct word should NOT have incorrect details
      expect(queryByTestId('incorrect-details-0')).toBeNull();

      // Incorrect words should show details
      const details1 = getByTestId('incorrect-details-1');
      expect(details1).toBeTruthy();

      const details2 = getByTestId('incorrect-details-2');
      expect(details2).toBeTruthy();
    });

    it('displays the given answer text for incorrect words', () => {
      mockSessionState = {
        wordList: testWordList,
        currentIndex: 2,
        inputMode: 'text',
        answers: [
          { word: 'apple', given: 'apple', correct: true },
          { word: 'banana', given: 'bananna', correct: false },
          { word: 'cherry', given: 'chery', correct: false },
        ],
        status: 'complete',
      };

      const { getByTestId } = render(<ResultsScreen />);

      // Check that incorrect details contain the child's given answer
      const details1 = getByTestId('incorrect-details-1');
      // The details section should contain text about the given answer
      const givenTexts = details1.findAllByProps
        ? details1.props.children
        : null;

      // Use a more reliable approach - check the rendered text content
      const { getAllByText } = render(<ResultsScreen />);
      expect(getAllByText(/bananna/).length).toBeGreaterThan(0);
      expect(getAllByText(/chery/).length).toBeGreaterThan(0);
    });
  });

  // ─── Requirement 7.4: Retake button navigates correctly ──────────────────────

  describe('Retake button', () => {
    it('calls initSession and navigates to the test screen on Retake press', () => {
      mockSessionState = {
        wordList: testWordList,
        currentIndex: 2,
        inputMode: 'text',
        answers: [
          { word: 'apple', given: 'apple', correct: true },
          { word: 'banana', given: 'banana', correct: true },
          { word: 'cherry', given: 'cherry', correct: true },
        ],
        status: 'complete',
      };

      const { getByTestId } = render(<ResultsScreen />);

      const retakeButton = getByTestId('retake-button');
      fireEvent.press(retakeButton);

      expect(mockInitSession).toHaveBeenCalledWith(testWordList, 'text');
      expect(mockReplace).toHaveBeenCalledWith('/test/test-list-1');
    });
  });

  // ─── Requirement 7.5: Home button navigates correctly ────────────────────────

  describe('Home button', () => {
    it('navigates to home screen on Home press', () => {
      mockSessionState = {
        wordList: testWordList,
        currentIndex: 2,
        inputMode: 'text',
        answers: [
          { word: 'apple', given: 'apple', correct: true },
          { word: 'banana', given: 'banana', correct: true },
          { word: 'cherry', given: 'cherry', correct: true },
        ],
        status: 'complete',
      };

      const { getByTestId } = render(<ResultsScreen />);

      const homeButton = getByTestId('home-button');
      fireEvent.press(homeButton);

      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  // ─── Fallback state: no data ─────────────────────────────────────────────────

  describe('no data fallback', () => {
    it('shows fallback message when no answers are available', () => {
      mockSessionState = {
        wordList: testWordList,
        currentIndex: 0,
        inputMode: 'text',
        answers: [],
        status: 'idle',
      };

      const { getByText, getByTestId } = render(<ResultsScreen />);

      expect(getByText('No test results available.')).toBeTruthy();

      // Home button should still work in fallback state
      const homeButton = getByTestId('home-button');
      fireEvent.press(homeButton);
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
