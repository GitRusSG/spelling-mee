import * as fc from 'fast-check';
import { checkAnswer, buildResult } from '../TestSessionContext';
import { WordList, TestSession, AnswerRecord } from '../../types';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

// Any printable string (including empty) for word/answer inputs
const stringArb = fc.string({ maxLength: 50 });

// A non-empty array of booleans representing correct/incorrect flags
const correctFlagsArb = fc.array(fc.boolean(), { minLength: 1, maxLength: 30 });

// ─── Property 1: Answer comparison is case-insensitive ───────────────────────

// Feature: spelling-mee, Property 1
describe('Property 1: checkAnswer is case-insensitive', () => {
  it('checkAnswer(word, answer) === checkAnswer(word.toUpperCase(), answer.toLowerCase()) for any inputs', () => {
    // Feature: spelling-mee, Property 1: Answer comparison is case-insensitive
    fc.assert(
      fc.property(stringArb, stringArb, (word, answer) => {
        const result1 = checkAnswer(word, answer);
        const result2 = checkAnswer(word.toUpperCase(), answer.toLowerCase());
        expect(result1).toBe(result2);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 5: Test result percentage is consistent with answer records ─────

// Feature: spelling-mee, Property 5
describe('Property 5: buildResult percentage is consistent', () => {
  it('percentageCorrect === Math.round((correctCount / totalWords) * 100) and correctCount + incorrectCount === totalWords', () => {
    // Feature: spelling-mee, Property 5: Test result percentage is consistent with answer records
    fc.assert(
      fc.property(correctFlagsArb, (flags) => {
        const words = flags.map((_, i) => `word${i}`);

        const wordList: WordList = {
          id: 'test-list',
          name: 'Test List',
          type: 'builtin',
          words,
          wordCount: words.length,
        };

        const answers: AnswerRecord[] = flags.map((correct, i) => ({
          word: `word${i}`,
          given: correct ? `word${i}` : 'wrong',
          correct,
        }));

        const session: TestSession = {
          listId: 'test-list',
          startedAt: new Date().toISOString(),
          inputMode: 'text',
          answers,
        };

        const result = buildResult(session, wordList);

        const expectedCorrect = flags.filter(Boolean).length;
        const expectedIncorrect = flags.length - expectedCorrect;
        const expectedPercentage = Math.round((expectedCorrect / flags.length) * 100);

        expect(result.correctCount).toBe(expectedCorrect);
        expect(result.incorrectCount).toBe(expectedIncorrect);
        expect(result.percentageCorrect).toBe(expectedPercentage);
        expect(result.correctCount + result.incorrectCount).toBe(result.totalWords);
        expect(result.totalWords).toBe(flags.length);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 6: Results display all words with correct labels ────────────────

// Feature: spelling-mee, Property 6
describe('Property 6: buildResult completeness', () => {
  it('result contains exactly words.length entries with matching labels', () => {
    // Feature: spelling-mee, Property 6: Results display all words with correct labels
    fc.assert(
      fc.property(correctFlagsArb, (flags) => {
        const words = flags.map((_, i) => `word${i}`);

        const wordList: WordList = {
          id: 'test-list',
          name: 'Test List',
          type: 'builtin',
          words,
          wordCount: words.length,
        };

        const answers: AnswerRecord[] = flags.map((correct, i) => ({
          word: `word${i}`,
          given: correct ? `word${i}` : 'wrong',
          correct,
        }));

        const session: TestSession = {
          listId: 'test-list',
          startedAt: new Date().toISOString(),
          inputMode: 'text',
          answers,
        };

        const result = buildResult(session, wordList);

        // Result must have exactly words.length answer entries
        expect(result.session.answers).toHaveLength(words.length);

        // Each entry's correct label must match the original flag
        result.session.answers.forEach((record, i) => {
          expect(record.correct).toBe(flags[i]);
        });

        // totalWords must equal words.length
        expect(result.totalWords).toBe(words.length);
      }),
      { numRuns: 100 }
    );
  });
});
