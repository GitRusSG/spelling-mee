// Feature: dictation-voices-accounts, Property 12: Local list migration completeness
import * as fc from 'fast-check';
import { CustomWordList } from '../../types';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../services/CommunityListService', () => ({
  publishList: jest.fn(),
  getSharedListById: jest.fn(),
  adoptList: jest.fn(),
}));

jest.mock('../../services/storage', () => ({
  createStorage: () => ({
    getString: () => undefined,
    set: () => {},
    delete: () => {},
  }),
}));

jest.mock('../../data/builtinLists', () => ({
  BUILTIN_LISTS: [],
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

// Import after mocks are set up
import { buildMigrationQueue } from '../WordListContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCustomWordList(input: { id: string; name: string }): CustomWordList {
  const now = new Date().toISOString();
  return {
    id: input.id,
    name: input.name,
    type: 'custom',
    words: ['word1'],
    wordCount: 1,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Property Test ────────────────────────────────────────────────────────────

/**
 * Validates: Requirements 10.4
 *
 * Property 12: Local list migration completeness
 * For any non-empty set of locally stored custom lists, when a user authenticates,
 * the migration function SHALL produce a migration queue containing exactly one
 * entry per local list, each requiring sharing agreement acceptance.
 */
describe('Property 12: Local list migration completeness', () => {
  it('buildMigrationQueue produces exactly one entry per local list, each with requiresAgreement: true', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({ id: fc.uuid(), name: fc.string({ minLength: 1 }) }),
          { minLength: 1, maxLength: 20 }
        ),
        (localListInputs) => {
          const localLists = localListInputs.map(toCustomWordList);

          const migrationQueue = buildMigrationQueue(localLists);

          // 1. The migration queue has the same length as the input
          expect(migrationQueue.length).toBe(localLists.length);

          // 2. Each entry has requiresAgreement: true
          for (const entry of migrationQueue) {
            expect(entry.requiresAgreement).toBe(true);
          }

          // 3. Each entry's list matches the corresponding input list
          for (let i = 0; i < localLists.length; i++) {
            expect(migrationQueue[i].list).toBe(localLists[i]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
