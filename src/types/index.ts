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
  // Account-linked fields:
  creatorUid?: string;                    // Set when created by authenticated user
  sharedListId?: string;                  // Firestore doc ID once published
  sharingAgreementAcceptedAt?: string;    // ISO 8601
}

// ─── Spelling Test Session ───────────────────────────────────────────────────

export type InputMode = 'text' | 'letter-by-letter' | 'draw';

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

// ─── Voice Selection ─────────────────────────────────────────────────────────

export interface VoiceProfile {
  voiceId: string;       // Selected voice identifier
  speed: number;         // 0.5 – 1.5
  label: string;         // Display name for the profile
  pitch?: number;        // Optional pitch override (0.1 – 2.0, default 1.0)
}

export interface VoiceOption {
  id: string;            // Platform voice identifier
  name: string;          // Human-readable label
  language: string;      // e.g., "en-GB"
  gender: 'male' | 'female' | 'neutral';
  quality: 'default' | 'enhanced';
}

export interface StoredVoiceProfile {
  voiceId: string;
  speed: number;         // 0.5 – 1.5
  label: string;
  updatedAt: string;     // ISO 8601
}

// ─── Community / Shared Lists ────────────────────────────────────────────────

export interface SharedListSummary {
  id: string;
  name: string;
  wordCount: number;
  creatorDisplayName: string;
  createdAt: string;
}

export interface SharedListDetail extends SharedListSummary {
  words: string[];
}

export interface SharedListInput {
  name: string;
  words: string[];
  creatorUid: string;
  creatorDisplayName: string;
}

// ─── Dictation ───────────────────────────────────────────────────────────────

export interface DictationRecording {
  id: string;            // Firestore auto-generated
  listId: string;        // Reference to the custom list
  word: string;          // The word this recording is for
  storageUrl: string;    // Firebase Storage download URL
  durationMs: number;    // Recording duration
  recordedAt: string;    // ISO 8601
  updatedAt: string;     // ISO 8601
}

export interface DictationCacheEntry {
  word: string;
  storageUrl: string;
  cachedAt: string;      // ISO 8601
}

export interface RecordingResult {
  localUri: string;      // Local file path of the recorded audio
  durationMs: number;    // Actual duration in milliseconds
}

export type RecordingStatus = 'idle' | 'recording' | 'processing';

// ─── Audio ───────────────────────────────────────────────────────────────────

export interface PlayWordOptions {
  dictationUrl?: string | null;   // Firebase Storage download URL
  voiceProfile?: VoiceProfile;    // Active voice settings
}

// ─── User Accounts ───────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  createdAt: string;     // ISO 8601
  updatedAt: string;     // ISO 8601
}

export interface CreateProfileInput {
  email: string;
  displayName: string;
}
