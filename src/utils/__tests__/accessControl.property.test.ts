import * as fc from 'fast-check';
import { canAccessListForTest } from '../accessControl';

// Feature: dictation-voices-accounts, Property 11: Unauthenticated access to builtin and local lists
describe('Property 11: Unauthenticated access to builtin and local lists', () => {
  /**
   * **Validates: Requirements 10.3**
   *
   * For any word list of type builtin or custom (locally stored), the access
   * control function SHALL permit unauthenticated users to use it for spelling tests.
   */
  it('permits unauthenticated users to access builtin and custom (local) lists', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('builtin', 'custom'),
          isLocal: fc.constant(true),
        }),
        ({ type }) => {
          // Unauthenticated user (isAuthenticated = false) should still have access
          const result = canAccessListForTest(type, false);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('also permits authenticated users to access builtin and custom (local) lists', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('builtin', 'custom'),
          isLocal: fc.constant(true),
        }),
        ({ type }) => {
          // Authenticated user should also have access
          const result = canAccessListForTest(type, true);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
