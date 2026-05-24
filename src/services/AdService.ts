import { SubscriptionStatus } from '../types';

/**
 * Returns true if an ad banner should be shown.
 * Ads are shown to all users who do not have an active subscription.
 *
 * Property 8: shouldShowAd(status) === (status !== 'active')
 */
export function shouldShowAd(status: SubscriptionStatus): boolean {
  return status !== 'active';
}
