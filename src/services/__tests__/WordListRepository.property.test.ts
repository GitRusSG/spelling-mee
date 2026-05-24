import * as fc from 'fast-check';
import { WordListRepository } from '../WordListRepository';
import { CustomWordList, BuiltinWordList } from '../../types';

// ─── In-memory MMKV mock ─────────────────────────────────────────────────────

function createMockMMKV() {
  const store: Record<string, string> = {};
  return {
    getString: (key: string) => store[key] ?? undefined,
    set: (key: string, value: string) => { store[key] = value; },
    delete: (key: string) => { delete store[key]; },
  };
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

const wordArb = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);

const customListArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  type: fc.constant('custom' as const),
  words: fc.array(wordArb, { minLength: 1, maxLength: 20 }),
  wordCount: fc.integer({ min: 1, max: 20 }),
  createdAt: fc.constant(new Date().toISOString()),
  updatedAt: fc.constant(new Date().toISOString()),
});

const builtinListArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  type: fc.constant('builtin' as const),
  words: fc.array(wordArb, { minLength: 1, maxLength: 20 }),
  wordCount: fc.integer({ min: 1, max: 20 }),
});

// ─── Property 2: Custom list persistence round-trip ──────────────────────────

// Feature: spelling-mee, Property 2: Custom list persistence round-trip
describe('Property 2: Custom list persistence round-trip', () => {
  it('saving a valid custom list and loading all lists returns a list equal to the saved one', () => {
    fc.assert(
      fc.property(customListArb, (list) => {
        const mockStorage = createMockMMKV() as any;
        const repo = new WordListRepository(mockStorage, []);

        repo.save(list);
        const allLists = repo.getAll();
        const found = allLists.find((l) => l.id === list.id);

        expect(found).toBeDefined();
        expect(found?.name).toBe(list.name);
        expect(found?.words).toEqual(list.words);
        expect(found?.type).toBe('custom');
      }),
      { numRuns: 100 }
    );
  });

  it('saving and retrieving by id returns the same list', () => {
    fc.assert(
      fc.property(customListArb, (list) => {
        const mockStorage = createMockMMKV() as any;
        const repo = new WordListRepository(mockStorage, []);

        repo.save(list);
        const found = repo.getById(list.id);

        expect(found).toBeDefined();
        expect(found?.id).toBe(list.id);
        expect(found?.name).toBe(list.name);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 9: Built-in list immutability ──────────────────────────────────

// Feature: spelling-mee, Property 9: Built-in list immutability
describe('Property 9: Built-in list immutability', () => {
  it('built-in lists are always present after any sequence of save/delete operations', () => {
    fc.assert(
      fc.property(
        fc.array(builtinListArb, { minLength: 1, maxLength: 5 }),
        fc.array(customListArb, { minLength: 0, maxLength: 10 }),
        (builtinLists, customLists) => {
          const mockStorage = createMockMMKV() as any;
          const repo = new WordListRepository(mockStorage, builtinLists);

          // Perform save and delete operations on custom lists
          for (const list of customLists) {
            repo.save(list);
          }
          for (const list of customLists.slice(0, Math.floor(customLists.length / 2))) {
            repo.delete(list.id);
          }

          // All built-in lists must still be present
          const allLists = repo.getAll();
          for (const builtin of builtinLists) {
            const found = allLists.find((l) => l.id === builtin.id);
            expect(found).toBeDefined();
            expect(found?.type).toBe('builtin');
            expect(found?.words).toEqual(builtin.words);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('attempting to delete a built-in list id does not remove it from getAll()', () => {
    fc.assert(
      fc.property(
        builtinListArb,
        (builtinList) => {
          const mockStorage = createMockMMKV() as any;
          const repo = new WordListRepository(mockStorage, [builtinList]);

          // delete only affects custom lists storage; built-in lists are immutable
          repo.delete(builtinList.id);

          const allLists = repo.getAll();
          const found = allLists.find((l) => l.id === builtinList.id);
          expect(found).toBeDefined();
          expect(found?.type).toBe('builtin');
        }
      ),
      { numRuns: 100 }
    );
  });
});
