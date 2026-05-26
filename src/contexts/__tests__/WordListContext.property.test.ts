// Feature: dictation-voices-accounts, Property 3: Sharing agreement gates list save
import * as fc from 'fast-check';
import { ValidationError } from '../../types/errors';
import { CustomWordList } from '../../types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPublishList = jest.fn();
const mockGetSharedListById = jest.fn();
const mockAdoptList = jest.fn();

jest.mock('../../services/CommunityListService', () => ({
  publishList: (...args: any[]) => mockPublishList(...args),
  getSharedListById: (...args: any[]) => mockGetSharedListById(...args),
  adoptList: (...args: any[]) => mockAdoptList(...args),
}));

// In-memory storage that persists across the module
const inMemoryStore: Record<string, string> = {};

jest.mock('../../services/storage', () => ({
  createStorage: () => ({
    getString: (key: string) => inMemoryStore[key],
    set: (key: string, value: string) => { inMemoryStore[key] = value; },
    delete: (key: string) => { delete inMemoryStore[key]; },
  }),
}));

jest.mock('../../data/builtinLists', () => ({
  BUILTIN_LISTS: [],
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

// Import after mocks are set up
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { WordListProvider, useWordList } from '../WordListContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(WordListProvider, null, children);
}

function makeCustomList(name: string, words: string[]): CustomWordList {
  const now = new Date().toISOString();
  return {
    id: 'test-list-' + Math.random().toString(36).slice(2),
    name,
    type: 'custom',
    words,
    wordCount: words.length,
    createdAt: now,
    updatedAt: now,
    creatorUid: 'test-user-uid',
  };
}

// ─── Property Test ────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 3.2, 3.3, 3.4
 *
 * Property 3: Sharing agreement gates list save
 * For any valid custom word list created by an authenticated user, saving SHALL
 * succeed only when the sharing agreement is accepted, and the resulting stored
 * list SHALL contain a non-null sharingAgreementAcceptedAt timestamp. Saving
 * without agreement acceptance SHALL be rejected and leave storage unchanged.
 */
describe('Property 3: Sharing agreement gates list save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear in-memory storage
    Object.keys(inMemoryStore).forEach((key) => delete inMemoryStore[key]);
    mockPublishList.mockResolvedValue('mock-shared-list-id');
  });

  it('publishList succeeds only when sharing agreement is accepted and sets sharingAgreementAcceptedAt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1 }),
          words: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
          agreed: fc.boolean(),
        }),
        async ({ name, words, agreed }) => {
          // Reset storage for each iteration
          Object.keys(inMemoryStore).forEach((key) => delete inMemoryStore[key]);
          mockPublishList.mockClear();
          mockPublishList.mockResolvedValue('mock-shared-list-id');

          const list = makeCustomList(name, words);

          const { result } = renderHook(() => useWordList(), { wrapper });

          if (agreed) {
            // When agreement is accepted, publishList should succeed
            await act(async () => {
              await result.current.publishList(list, true);
            });

            // CommunityListService.publishList should have been called
            expect(mockPublishList).toHaveBeenCalledTimes(1);

            // The stored list should have sharingAgreementAcceptedAt set (non-null)
            const storedRaw = inMemoryStore['custom_lists'];
            expect(storedRaw).toBeDefined();
            const storedLists: CustomWordList[] = JSON.parse(storedRaw!);
            const savedList = storedLists.find((l) => l.id === list.id);
            expect(savedList).toBeDefined();
            expect(savedList!.sharingAgreementAcceptedAt).not.toBeNull();
            expect(savedList!.sharingAgreementAcceptedAt).toBeDefined();
            expect(typeof savedList!.sharingAgreementAcceptedAt).toBe('string');
            expect(savedList!.sharingAgreementAcceptedAt!.length).toBeGreaterThan(0);
          } else {
            // When agreement is NOT accepted, publishList should throw ValidationError
            const storageBeforeAttempt = inMemoryStore['custom_lists'];

            let thrownError: unknown;
            await act(async () => {
              try {
                await result.current.publishList(list, false);
              } catch (e) {
                thrownError = e;
              }
            });

            expect(thrownError).toBeInstanceOf(ValidationError);

            // Storage should remain unchanged
            expect(inMemoryStore['custom_lists']).toEqual(storageBeforeAttempt);

            // CommunityListService.publishList should NOT have been called
            expect(mockPublishList).not.toHaveBeenCalled();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
