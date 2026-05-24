import { Platform } from 'react-native';
import { SubscriptionStatus } from '../types';
import { PurchaseError } from '../types/errors';

export interface PurchaseResult {
  status: SubscriptionStatus;
  expiresAt?: string | null;
}

export const SubscriptionService = {
  getStatus(): SubscriptionStatus {
    return 'none';
  },

  async purchase(productId: string): Promise<PurchaseResult> {
    if (Platform.OS === 'web') {
      // IAP not available on web
      throw new PurchaseError('WEB_UNSUPPORTED', 'In-app purchases are not available on web. Please use the mobile app.');
    }

    const {
      initConnection,
      requestSubscription,
      finishTransaction,
      purchaseErrorListener,
      purchaseUpdatedListener,
    } = require('react-native-iap');

    try {
      await initConnection();

      return await new Promise<PurchaseResult>((resolve, reject) => {
        const purchaseUpdateSub = purchaseUpdatedListener(
          async (purchase: any) => {
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

        const purchaseErrorSub = purchaseErrorListener((error: any) => {
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
    if (Platform.OS === 'web') {
      throw new PurchaseError('WEB_UNSUPPORTED', 'Restore purchases is not available on web. Please use the mobile app.');
    }

    const { initConnection, getPurchaseHistory } = require('react-native-iap');

    try {
      await initConnection();
      const history = await getPurchaseHistory();

      if (!history || history.length === 0) {
        return { status: 'none', expiresAt: null };
      }

      const latest = history[history.length - 1];
      const expiryMs = latest.transactionDate
        ? Number(latest.transactionDate) + 30 * 24 * 60 * 60 * 1000
        : null;
      const status: SubscriptionStatus = expiryMs && expiryMs < Date.now() ? 'expired' : 'active';
      const expiresAt = status === 'active' && latest.transactionDate
        ? new Date(Number(latest.transactionDate) + 30 * 24 * 60 * 60 * 1000).toISOString()
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
