import * as fc from 'fast-check';
import { validateListName, validateWordList } from '../validation';
import { ValidationError } from '../../types/errors';

// Feature: spelling-mee, Property 3: Empty and whitespace-only names are rejected
describe('Property 3: Empty and whitespace-only names are rejected', () => {
  it('rejects any string composed entirely of whitespace characters', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^\s+$/), (whitespaceOnlyName) => {
        const result = validateListName(whitespaceOnlyName);
        expect(result).toBeInstanceOf(ValidationError);
        expect(result?.field).toBe('name');
      }),
      { numRuns: 100 }
    );
  });

  it('rejects the empty string', () => {
    const result = validateListName('');
    expect(result).toBeInstanceOf(ValidationError);
    expect(result?.field).toBe('name');
  });

  it('accepts a non-empty, non-whitespace name', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (validName) => {
          const result = validateListName(validName);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: spelling-mee, Property 4: Empty word lists are rejected
describe('Property 4: Empty word lists are rejected', () => {
  it('rejects an empty words array', () => {
    fc.assert(
      fc.property(fc.constant([]), (emptyWords) => {
        const result = validateWordList(emptyWords);
        expect(result).toBeInstanceOf(ValidationError);
        expect(result?.field).toBe('words');
      }),
      { numRuns: 100 }
    );
  });

  it('accepts a non-empty words array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
        (words) => {
          const result = validateWordList(words);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
