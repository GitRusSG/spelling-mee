/**
 * Pure function that simulates letter-by-letter input with backspace support.
 *
 * Given a sequence of inputs where each element is either a single character
 * (letter tap) or the string 'BACKSPACE' (delete last letter), returns the
 * resulting string — identical to what a user would produce by typing the
 * same characters in a text field with the same backspace operations applied.
 */
export function applyLetterInput(sequence: Array<string | 'BACKSPACE'>): string {
  const result: string[] = [];

  for (const input of sequence) {
    if (input === 'BACKSPACE') {
      result.pop();
    } else {
      result.push(input);
    }
  }

  return result.join('');
}
