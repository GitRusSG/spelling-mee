import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { MMKV } from 'react-native-mmkv';
import { SubscriptionState, SubscriptionStatus } from '../types';
import { SubscriptionService } from '../services/SubscriptionService';

const STORAGE_KEY = 'subscription';
const storage = new MMKV({ id: 'subscription' });

const DEFAULT_STATE: SubscriptionState = {
  status: 'none',
  expiresAt: null,
  productId: null,
};

function readFromStorage(): SubscriptionState {
  const raw = storage.getString(STORAGE_KEY);
  if (!raw) return DEFAULT_STATE;
  try {
    return JSON.parse(raw) as SubscriptionState;
  } catch {
    return DEFAULT_STATE;
  }
}

function writeToStorage(state: SubscriptionState): void {
  storage.set(STORAGE_KEY, JSON.stringify(state));
}

interface SubscriptionContextValue {
  isSubscribed: boolean;
  status: SubscriptionStatus;
  expiresAt: string | null;
  purchase(productId: string): Promise<void>;
  restore(): Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(readFromStorage);

  const updateState = useCallback((next: SubscriptionState) => {
    writeToStorage(next);
    setSubscriptionState(next);
  }, []);

  const purchase = useCallback(async (productId: string): Promise<void> => {
    const result = await SubscriptionService.purchase(productId);
    const next: SubscriptionState = {
      status: result.status,
      expiresAt: result.expiresAt ?? null,
      productId,
    };
    updateState(next);
  }, [updateState]);

  const restore = useCallback(async (): Promise<void> => {
    const result = await SubscriptionService.restore();
    const next: SubscriptionState = {
      status: result.status,
      expiresAt: result.expiresAt ?? null,
      productId: subscriptionState.productId,
    };
    updateState(next);
  }, [updateState, subscriptionState.productId]);

  const isSubscribed = subscriptionState.status === 'active';

  return (
    <SubscriptionContext.Provider
      value={{
        isSubscribed,
        status: subscriptionState.status,
        expiresAt: subscriptionState.expiresAt,
        purchase,
        restore,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}

export { SubscriptionContext };
