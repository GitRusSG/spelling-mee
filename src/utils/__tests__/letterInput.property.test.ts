import * as fc from 'fast-check';
import { applyLetterInput } from '../letterInput';

// Feature: spelling-mee, Property 7: Letter-by-letter sequence matches typed input semantics
describe('Property 7: Letter-by-letter sequence matches typed input semantics', () => {
  /**
   * **Validates: Requirements 6.2, 6.4**
   *
   * For any sequence of letter taps (including backspace operations), the final
   * displayed letter sequence is identical to what a user would produce by typing
   * the same characters in a text field with the same backspace operations applied.
   */
  it('produces the same result as simulated text field input for any sequence', () => {
    fc.assert(
      fc.property(
        fc.array(fc.oneof(fc.char(), fc.constant('BACKSPACE'))),
        (sequence) => {
          const result = applyLetterInput(sequence);

          // Simulate text field behaviour independently
          let textField = '';
          for (const input of sequence) {
            if (input === 'BACKSPACE') {
              textField = textField.slice(0, -1);
            } else {
              textField += input;
            }
          }

          expect(result).toBe(textField);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns empty string for empty sequence', () => {
    expect(applyLetterInput([])).toBe('');
  });

  it('backspace on empty sequence has no effect', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constant('BACKSPACE'), { minLength: 1, maxLength: 20 }),
        (backspaces) => {
          expect(applyLetterInput(backspaces)).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('sequence of only letters produces concatenation of all letters', () => {
    fc.assert(
      fc.property(
        fc.array(fc.char(), { minLength: 1 }).filter(
          (arr) => arr.every((c) => c !== 'BACKSPACE')
        ),
        (letters) => {
          expect(applyLetterInput(letters)).toBe(letters.join(''));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each backspace removes exactly one character from the end', () => {
    fc.assert(
      fc.property(
        fc.array(fc.char(), { minLength: 2 }).filter(
          (arr) => arr.every((c) => c !== 'BACKSPACE')
        ),
        (letters) => {
          // Add all letters then one backspace
          const sequence: Array<string | 'BACKSPACE'> = [...letters, 'BACKSPACE'];
          const result = applyLetterInput(sequence);
          expect(result).toBe(letters.slice(0, -1).join(''));
        }
      ),
      { numRuns: 100 }
    );
  });
});
