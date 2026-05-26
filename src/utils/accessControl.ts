import { WordListType } from '../types';

/**
 * Determines whether a user can access a word list for spelling tests
 * based on the list type and authentication state.
 *
 * - Builtin lists are always accessible (no auth required)
 * - Custom lists stored locally are always accessible (no auth required)
 * - Other list types or remote-only lists may require authentication
 */
export function canAccessListForTest(listType: WordListType, isAuthenticated: boolean): boolean {
  // Builtin lists are always accessible regardless of auth state
  if (listType === 'builtin') {
    return true;
  }

  // Custom (locally stored) lists are always accessible regardless of auth state
  if (listType === 'custom') {
    return true;
  }

  // For any other list type, require authentication
  return isAuthenticated;
}
