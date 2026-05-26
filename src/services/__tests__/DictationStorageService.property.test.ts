// Feature: dictation-voices-accounts, Property 6: Dictation re-recording replaces previous
import * as fc from 'fast-check';
import { uploadRecording } from '../DictationStorageService';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockRef = jest.fn();
const mockUploadBytes = jest.fn();
const mockGetDownloadURL = jest.fn();

jest.mock('firebase/storage', () => ({
  ref: (...args: any[]) => mockRef(...args),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
  deleteObject: jest.fn(),
}));

const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockSetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  getDoc: jest.fn(),
  deleteDoc: jest.fn(),
}));

jest.mock('../firebase', () => ({
  storage: 'mock-storage',
  db: 'mock-db',
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Property Test ────────────────────────────────────────────────────────────

/**
 * **Validates: Requirements 5.5**
 *
 * Property 6: Dictation re-recording replaces previous
 *
 * For any word in a custom list that already has a dictation recording,
 * recording a new dictation for that word SHALL result in exactly one
 * recording associated with that word, and its storageUrl and recordedAt
 * SHALL reflect the new recording.
 */
describe('Property 6: Dictation re-recording replaces previous', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRef.mockReturnValue('mock-storage-ref');
    mockCollection.mockReturnValue('mock-collection-ref');
    mockUploadBytes.mockResolvedValue(undefined);
    mockSetDoc.mockResolvedValue(undefined);
    mockFetch.mockResolvedValue({ blob: () => Promise.resolve(new Blob(['audio'])) });
  });

  it('re-recording a word uses setDoc with the same deterministic doc ID, replacing the previous recording', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          word: fc.string({ minLength: 1 }),
          oldUrl: fc.webUrl(),
          newUrl: fc.webUrl(),
        }),
        async ({ word, oldUrl, newUrl }) => {
          // Reset mocks for each iteration
          mockSetDoc.mockClear();
          mockDoc.mockClear();
          mockGetDownloadURL.mockReset();

          const uid = 'test-uid';
          const listId = 'test-list';
          const expectedDocId = `${listId}_${word}`;

          // Track doc refs created
          let docRefCallCount = 0;
          mockDoc.mockImplementation((..._args: any[]) => {
            docRefCallCount++;
            return `mock-doc-ref-${docRefCallCount}`;
          });

          // First recording returns oldUrl
          mockGetDownloadURL.mockResolvedValueOnce(oldUrl);
          await uploadRecording(uid, listId, word, 'file:///first.m4a');

          // Second recording (re-recording) returns newUrl
          mockGetDownloadURL.mockResolvedValueOnce(newUrl);
          await uploadRecording(uid, listId, word, 'file:///second.m4a');

          // setDoc was called exactly twice (once per upload)
          expect(mockSetDoc).toHaveBeenCalledTimes(2);

          // Both calls used the same deterministic doc ID (listId_word)
          const firstDocCall = mockDoc.mock.calls.find(
            (call) => call[1] === expectedDocId
          );
          expect(firstDocCall).toBeDefined();

          // All doc() calls for the recording used the same doc ID
          const recordingDocCalls = mockDoc.mock.calls.filter(
            (call) => call[0] === 'mock-collection-ref' && call[1] === expectedDocId
          );
          expect(recordingDocCalls.length).toBe(2);

          // The second setDoc call has the new URL
          const secondSetDocData = mockSetDoc.mock.calls[1][1];
          expect(secondSetDocData.storageUrl).toBe(newUrl);

          // The second setDoc call has a recordedAt timestamp
          expect(secondSetDocData.recordedAt).toBeDefined();
          expect(typeof secondSetDocData.recordedAt).toBe('string');

          // Since setDoc overwrites the document, only one recording
          // exists per word (same doc ref used both times)
          // This is guaranteed by the deterministic doc ID pattern
        }
      ),
      { numRuns: 100 }
    );
  });

  it('the document ID is always deterministic as listId_word regardless of recording content', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          word: fc.string({ minLength: 1 }),
          oldUrl: fc.webUrl(),
          newUrl: fc.webUrl(),
        }),
        async ({ word, oldUrl, newUrl }) => {
          mockSetDoc.mockClear();
          mockDoc.mockClear();
          mockGetDownloadURL.mockReset();

          const uid = 'user-123';
          const listId = 'my-list';
          const expectedDocId = `${listId}_${word}`;

          mockDoc.mockReturnValue('same-doc-ref');

          // First upload
          mockGetDownloadURL.mockResolvedValueOnce(oldUrl);
          await uploadRecording(uid, listId, word, 'file:///old.m4a');

          // Second upload (re-record)
          mockGetDownloadURL.mockResolvedValueOnce(newUrl);
          await uploadRecording(uid, listId, word, 'file:///new.m4a');

          // Both setDoc calls target the exact same doc ref
          const firstRef = mockSetDoc.mock.calls[0][0];
          const secondRef = mockSetDoc.mock.calls[1][0];
          expect(firstRef).toBe(secondRef);
          expect(firstRef).toBe('same-doc-ref');

          // Doc was called with the deterministic ID both times
          for (const call of mockDoc.mock.calls) {
            if (call[0] === 'mock-collection-ref') {
              expect(call[1]).toBe(expectedDocId);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
