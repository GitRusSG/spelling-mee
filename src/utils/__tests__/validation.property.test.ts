import * as fc from 'fast-check';
import { validateListName, validateWordList, validatePassword, validateEmail, validateRecordingDuration } from '../validation';
import { ValidationError } from '../../types/errors';

// Feature: dictation-voices-accounts, Property 1: Password length validation
describe('Property 1: Password length validation', () => {
  it('accepts a password if and only if its length is at least 8 characters', () => {
    // **Validates: Requirements 1.3, 1.6**
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 50 }), (password) => {
        const result = validatePassword(password);
        expect(result.valid).toBe(password.length >= 8);
      }),
      { numRuns: 100 }
    );
  });
});

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

// Feature: dictation-voices-accounts, Property 2: Email format validation
describe('Property 2: Email format validation', () => {
  /**
   * **Validates: Requirements 1.5**
   *
   * For any string, the email validation function SHALL reject it if it does not
   * match a standard email format (contains exactly one @, has a non-empty local
   * part, and a domain with at least one dot).
   */

  /** Helper: checks if a string is a valid email per our rules */
  function isValidEmailFormat(s: string): boolean {
    const atIndex = s.indexOf('@');
    const lastAtIndex = s.lastIndexOf('@');

    // Must contain exactly one @
    if (atIndex === -1 || atIndex !== lastAtIndex) return false;

    const localPart = s.slice(0, atIndex);
    const domain = s.slice(atIndex + 1);

    // Local part must be non-empty
    if (localPart.length === 0) return false;

    // Domain must contain at least one dot
    if (!domain.includes('.')) return false;

    // Domain parts around dots must be non-empty
    const domainParts = domain.split('.');
    if (domainParts.some(part => part.length === 0)) return false;

    return true;
  }

  it('correctly classifies generated emails and arbitrary strings', () => {
    fc.assert(
      fc.property(fc.oneof(fc.emailAddress(), fc.string()), (input) => {
        const result = validateEmail(input);
        const expectedValid = isValidEmailFormat(input);
        expect(result.valid).toBe(expectedValid);
      }),
      { numRuns: 100 }
    );
  });

  it('rejects strings without exactly one @ symbol', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => {
          const count = (s.match(/@/g) || []).length;
          return count !== 1;
        }),
        (input) => {
          const result = validateEmail(input);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects strings with empty local part (starts with @)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).map((domain) => `@${domain}`),
        (input) => {
          const result = validateEmail(input);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('rejects strings with domain lacking a dot', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1 }).filter((s) => !s.includes('@')),
          fc.string({ minLength: 1 }).filter((s) => !s.includes('.') && !s.includes('@'))
        ).map(([local, domain]) => `${local}@${domain}`),
        (input) => {
          const result = validateEmail(input);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('accepts valid emails generated by fc.emailAddress()', () => {
    fc.assert(
      fc.property(fc.emailAddress(), (email) => {
        const result = validateEmail(email);
        expect(result.valid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: dictation-voices-accounts, Property 7: Recording duration validation
describe('Property 7: Recording duration validation', () => {
  /**
   * **Validates: Requirements 5.8**
   *
   * For any numeric duration value, the recording duration validation function
   * SHALL accept it if and only if it is greater than 0 and less than or equal
   * to 10000 milliseconds.
   */
  it('accepts a duration if and only if it is greater than 0 and at most 10000ms', () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000, max: 20000 }), (duration) => {
        const result = validateRecordingDuration(duration);
        expect(result.valid).toBe(duration > 0 && duration <= 10000);
      }),
      { numRuns: 100 }
    );
  });
});
