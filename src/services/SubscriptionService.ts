import { SubscriptionStatus } from '../types';

export interface PurchaseResult {
  status: SubscriptionStatus;
  expiresAt?: string | null;
}

/**
 * Placeholder — real implementation will be added in Task 4.3.
 */
export const SubscriptionService = {
  getStatus(): SubscriptionStatus {
    throw new Error('SubscriptionService not yet implemented');
  },

  async purchase(_productId: string): Promise<PurchaseResult> {
    throw new Error('SubscriptionService not yet implemented');
  },

  async restore(): Promise<PurchaseResult> {
    throw new Error('SubscriptionService not yet implemented');
  },
};
