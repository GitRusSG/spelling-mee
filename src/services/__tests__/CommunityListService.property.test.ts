import * as fc from 'fast-check';
import { adoptList } from '../CommunityListService';

// Feature: dictation-voices-accounts, Property 5: List adoption adds to user's word lists

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockDoc = jest.fn();
const mockCollection = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  doc: (...args: any[]) => mockDoc(...args),
  addDoc: jest.fn(),
  getDoc: (...args: any[]) => mockGetDoc(...args),
  getDocs: (...args: any[]) => mockGetDocs(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
}));

jest.mock('../firebase', () => ({
  db: 'mock-db',
}));

// ─── Property Test ────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 4.4
 *
 * Property 5: List adoption adds to user's word lists
 * For any valid shared list, adopting it SHALL increase the user's word list
 * count by exactly one, and the adopted list's name and words SHALL match
 * the original shared list.
 */
describe('Property 5: List adoption adds to user\'s word lists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDoc.mockReturnValue('mock-doc-ref');
    mockCollection.mockReturnValue('mock-collection-ref');
  });

  it('adopting a shared list increases user list count by 1 and preserves name and words', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1 }),
          words: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
        }),
        fc.string({ minLength: 1 }),  // sharedListId
        fc.string({ minLength: 1 }),  // userId
        async (sharedList, sharedListId, userId) => {
          // Reset mocks for each iteration
          mockSetDoc.mockClear();
          mockGetDoc.mockClear();
          mockSetDoc.mockResolvedValue(undefined);

          // Mock getDoc to return the shared list data
          mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
              name: sharedList.name,
              words: sharedList.words,
              wordCount: sharedList.words.length,
              creatorDisplayName: 'Test Creator',
            }),
          });

          // Before adoption: setDoc call count is 0
          const callCountBefore = mockSetDoc.mock.calls.length;

          // Call adoptList
          await adoptList(sharedListId, userId);

          // After adoption: setDoc was called exactly once (count increased by 1)
          expect(mockSetDoc).toHaveBeenCalledTimes(callCountBefore + 1);

          // Verify the adopted list data matches the original shared list
          const savedData = mockSetDoc.mock.calls[0][1];
          expect(savedData.name).toBe(sharedList.name);
          expect(savedData.words).toEqual(sharedList.words);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('adopted list word count matches the original shared list word count', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1 }),
          words: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
        }),
        fc.string({ minLength: 1 }),  // sharedListId
        fc.string({ minLength: 1 }),  // userId
        async (sharedList, sharedListId, userId) => {
          mockSetDoc.mockClear();
          mockGetDoc.mockClear();
          mockSetDoc.mockResolvedValue(undefined);

          mockGetDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
              name: sharedList.name,
              words: sharedList.words,
              wordCount: sharedList.words.length,
              creatorDisplayName: 'Test Creator',
            }),
          });

          await adoptList(sharedListId, userId);

          const savedData = mockSetDoc.mock.calls[0][1];
          expect(savedData.wordCount).toBe(sharedList.words.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
