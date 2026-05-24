import { ValidationError } from '../types/errors';

/**
 * Validates a word list name.
 * Returns a ValidationError if the name is empty or whitespace-only.
 * Returns null if valid.
 */
export function validateListName(name: string): ValidationError | null {
  if (name.trim().length === 0) {
    return new ValidationError('name', 'List name cannot be empty or whitespace only.');
  }
  return null;
}

/**
 * Validates a word list's words array.
 * Returns a ValidationError if the array is empty.
 * Returns null if valid.
 */
export function validateWordList(words: string[]): ValidationError | null {
  if (words.length === 0) {
    return new ValidationError('words', 'Word list must contain at least one word.');
  }
  return null;
}
