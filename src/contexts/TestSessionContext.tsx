import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  ReactNode,
} from 'react';
import {
  WordList,
  InputMode,
  AnswerRecord,
  TestSession,
  TestResult,
} from '../types';

// ─── Pure helper functions (exported for property tests) ─────────────────────

/**
 * Compares a user-supplied answer against the canonical word.
 * Both sides are trimmed and lowercased before comparison.
 */
export function checkAnswer(word: string, answer: string): boolean {
  return word.trim().toLowerCase() === answer.trim().toLowerCase();
}

/**
 * Builds a TestResult from a completed session and its word list.
 * percentageCorrect is rounded to the nearest integer (0–100).
 */
export function buildResult(session: TestSession, wordList: WordList): TestResult {
  const totalWords = wordList.words.length;
  const correctCount = session.answers.filter((a) => a.correct).length;
  const incorrectCount = totalWords - correctCount;
  const percentageCorrect =
    totalWords === 0 ? 0 : Math.round((correctCount / totalWords) * 100);

  return {
    session,
    totalWords,
    correctCount,
    incorrectCount,
    percentageCorrect,
  };
}

// ─── State ────────────────────────────────────────────────────────────────────

type SessionStatus = 'idle' | 'active' | 'complete';

interface TestSessionState {
  wordList: WordList | null;
  currentIndex: number;
  inputMode: InputMode;
  answers: AnswerRecord[];
  status: SessionStatus;
}

const initialState: TestSessionState = {
  wordList: null,
  currentIndex: 0,
  inputMode: 'text',
  answers: [],
  status: 'idle',
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'INIT_SESSION'; wordList: WordList; inputMode: InputMode }
  | { type: 'SUBMIT_ANSWER'; answer: string }
  | { type: 'REPEAT_WORD' };

function reducer(state: TestSessionState, action: Action): TestSessionState {
  switch (action.type) {
    case 'INIT_SESSION': {
      return {
        wordList: action.wordList,
        currentIndex: 0,
        inputMode: action.inputMode,
        answers: [],
        status: 'active',
      };
    }

    case 'SUBMIT_ANSWER': {
      if (!state.wordList || state.status !== 'active') return state;

      const word = state.wordList.words[state.currentIndex];
      const given = action.answer.trim().toLowerCase();
      const correct = checkAnswer(word, action.answer);

      const record: AnswerRecord = {
        word: word.trim().toLowerCase(),
        given,
        correct,
      };

      const newAnswers = [...state.answers, record];
      const nextIndex = state.currentIndex + 1;
      const isComplete = nextIndex >= state.wordList.words.length;

      return {
        ...state,
        answers: newAnswers,
        currentIndex: isComplete ? state.currentIndex : nextIndex,
        status: isComplete ? 'complete' : 'active',
      };
    }

    case 'REPEAT_WORD': {
      // No state change — the UI layer handles replaying audio
      return state;
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface TestSessionContextValue extends TestSessionState {
  initSession(wordList: WordList, inputMode: InputMode): void;
  submitAnswer(answer: string): void;
  repeatWord(): void;
}

const TestSessionContext = createContext<TestSessionContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TestSessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const initSession = useCallback((wordList: WordList, inputMode: InputMode) => {
    dispatch({ type: 'INIT_SESSION', wordList, inputMode });
  }, []);

  const submitAnswer = useCallback((answer: string) => {
    dispatch({ type: 'SUBMIT_ANSWER', answer });
  }, []);

  const repeatWord = useCallback(() => {
    dispatch({ type: 'REPEAT_WORD' });
  }, []);

  return (
    <TestSessionContext.Provider
      value={{ ...state, initSession, submitAnswer, repeatWord }}
    >
      {children}
    </TestSessionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTestSession(): TestSessionContextValue {
  const ctx = useContext(TestSessionContext);
  if (!ctx) throw new Error('useTestSession must be used within a TestSessionProvider');
  return ctx;
}

export { TestSessionContext };
