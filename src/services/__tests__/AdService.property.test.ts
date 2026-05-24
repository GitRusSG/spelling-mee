import * as fc from 'fast-check';
import { shouldShowAd } from '../AdService';
import { SubscriptionStatus } from '../../types';

// Feature: spelling-mee, Property 8: Subscription status gates ad visibility
describe('Property 8: Subscription status gates ad visibility', () => {
  it('shouldShowAd returns true iff status is not "active"', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<SubscriptionStatus>('active', 'expired', 'none'),
        (status) => {
          const result = shouldShowAd(status);
          expect(result).toBe(status !== 'active');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('shouldShowAd returns false for "active"', () => {
    expect(shouldShowAd('active')).toBe(false);
  });

  it('shouldShowAd returns true for "expired"', () => {
    expect(shouldShowAd('expired')).toBe(true);
  });

  it('shouldShowAd returns true for "none"', () => {
    expect(shouldShowAd('none')).toBe(true);
  });
});
