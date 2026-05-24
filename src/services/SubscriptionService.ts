import {
  initConnection,
  getSubscriptions,
  requestSubscription,
  getPurchaseHistory,
  finishTransaction,
  purchaseErrorListener,
  purchaseUpdatedListener,
  type SubscriptionPurchase,
  type PurchaseError as IAPPurchaseError,
} from 'react-native-iap';
import { SubscriptionStatus } from '../types';
import { PurchaseError } from '../types/errors';

export interface PurchaseResult {
  status: SubscriptionStatus;
  expiresAt?: string | null;
}

/**
 * Derives a SubscriptionStatus from a purchase record.
 * A purchase is considered active if its expiry date is in the future (or unknown).
 */
function statusFromPurchase(purchase: SubscriptionPurchase): SubscriptionStatus {
  const expiryMs = purchase.transactionDate
    ? Number(purchase.transactionDate) + 30 * 24 * 60 * 60 * 1000 // assume 30-day sub if no explicit expiry
    : null;
  if (expiryMs && expiryMs < Date.now()) return 'expired';
  return 'active';
}

export const SubscriptionService = {
  getStatus(): SubscriptionStatus {
    // Synchronous status is read from MMKV by SubscriptionContext; this is a no-op stub.
    return 'none';
  },

  async purchase(productId: string): Promise<PurchaseResult> {
    try {
      await initConnection();

      return await new Promise<PurchaseResult>((resolve, reject) => {
        const purchaseUpdateSub = purchaseUpdatedListener(
          async (purchase: SubscriptionPurchase) => {
            try {
              await finishTransaction({ purchase, isConsumable: false });
              purchaseUpdateSub.remove();
              purchaseErrorSub.remove();
              resolve({
                status: 'active',
                expiresAt: purchase.transactionDate
                  ? new Date(
                      Number(purchase.transactionDate) + 30 * 24 * 60 * 60 * 1000
                    ).toISOString()
                  : null,
              });
            } catch (err) {
              purchaseUpdateSub.remove();
              purchaseErrorSub.remove();
              reject(new PurchaseError('FINISH_FAILED', 'Failed to complete purchase.'));
            }
          }
        );

        const purchaseErrorSub = purchaseErrorListener((error: IAPPurchaseError) => {
          purchaseUpdateSub.remove();
          purchaseErrorSub.remove();
          reject(
            new PurchaseError(
              error.code ?? 'UNKNOWN',
              error.message ?? 'Purchase was declined or failed.'
            )
          );
        });

        requestSubscription({ sku: productId }).catch((err: any) => {
          purchaseUpdateSub.remove();
          purchaseErrorSub.remove();
          reject(
            new PurchaseError(
              err?.code ?? 'REQUEST_FAILED',
              err?.message ?? 'Could not initiate purchase.'
            )
          );
        });
      });
    } catch (err: any) {
      if (err instanceof PurchaseError) throw err;
      throw new PurchaseError(
        err?.code ?? 'CONNECTION_FAILED',
        err?.message ?? 'Could not connect to the store.'
      );
    }
  },

  async restore(): Promise<PurchaseResult> {
    try {
      await initConnection();
      const history = await getPurchaseHistory();

      if (!history || history.length === 0) {
        return { status: 'none', expiresAt: null };
      }

      // Use the most recent purchase
      const latest = history[history.length - 1] as SubscriptionPurchase;
      const status = statusFromPurchase(latest);
      const expiresAt =
        status === 'active' && latest.transactionDate
          ? new Date(
              Number(latest.transactionDate) + 30 * 24 * 60 * 60 * 1000
            ).toISOString()
          : null;

      return { status, expiresAt };
    } catch (err: any) {
      if (err instanceof PurchaseError) throw err;
      throw new PurchaseError(
        err?.code ?? 'RESTORE_FAILED',
        err?.message ?? 'Could not restore purchases.'
      );
    }
  },
};
