// ─── Word List ───────────────────────────────────────────────────────────────

export type WordListType = 'builtin' | 'custom';

export interface WordList {
  id: string;           // UUID for custom; stable slug for built-in (e.g., "top-schools")
  name: string;
  type: WordListType;
  words: string[];      // Ordered list of words
  wordCount: number;    // Derived: words.length
}

export interface BuiltinWordList extends WordList {
  type: 'builtin';
}

export interface CustomWordList extends WordList {
  type: 'custom';
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

// ─── Spelling Test Session ───────────────────────────────────────────────────

export type InputMode = 'text' | 'letter-by-letter';

export interface TestSession {
  listId: string;
  startedAt: string;    // ISO 8601
  inputMode: InputMode;
  answers: AnswerRecord[];
}

export interface AnswerRecord {
  word: string;         // Correct spelling (canonical, lowercase)
  given: string;        // What the child entered (trimmed, lowercased before comparison)
  correct: boolean;
}

// ─── Results ─────────────────────────────────────────────────────────────────

export interface TestResult {
  session: TestSession;
  totalWords: number;
  correctCount: number;
  incorrectCount: number;
  percentageCorrect: number;  // 0–100, rounded to nearest integer
}

// ─── Subscription ────────────────────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'expired' | 'none';

export interface SubscriptionState {
  status: SubscriptionStatus;
  expiresAt: string | null;   // ISO 8601, null if never subscribed
  productId: string | null;
}
