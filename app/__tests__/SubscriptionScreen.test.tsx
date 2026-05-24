import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

const mockPurchase = jest.fn();
const mockRestore = jest.fn();
let mockIsSubscribed = false;

jest.mock('../../src/contexts/SubscriptionContext', () => ({
  useSubscription: () => ({
    isSubscribed: mockIsSubscribed,
    status: mockIsSubscribed ? 'active' : 'none',
    expiresAt: null,
    purchase: mockPurchase,
    restore: mockRestore,
  }),
}));

jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: 'BannerAd',
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  TestIds: { BANNER: 'test-banner-id' },
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// ─── Imports (after mocks) ───────────────────────────────────────────────────

import SubscriptionScreen from '../subscription';
import AdBanner from '../../src/components/AdBanner';
import { PurchaseError } from '../../src/types/errors';

// ─── AdBanner Tests ──────────────────────────────────────────────────────────

describe('AdBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders BannerAd when user is not subscribed', () => {
    mockIsSubscribed = false;
    const { UNSAFE_getByType } = render(<AdBanner />);
    // BannerAd is mocked as a string 'BannerAd', so we check it renders
    const { toJSON } = render(<AdBanner />);
    const tree = toJSON();
    expect(tree).not.toBeNull();
    expect(tree).toMatchObject({ type: 'BannerAd' });
  });

  it('renders nothing when user is subscribed', () => {
    mockIsSubscribed = true;
    const { toJSON } = render(<AdBanner />);
    expect(toJSON()).toBeNull();
  });
});

// ─── SubscriptionScreen Tests ────────────────────────────────────────────────

describe('SubscriptionScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsSubscribed = false;
  });

  it('shows "Subscribe" button when user is not subscribed', () => {
    const { getByLabelText } = render(<SubscriptionScreen />);
    expect(getByLabelText('Subscribe')).toBeTruthy();
  });

  it('calls purchase with product ID when Subscribe button is pressed', async () => {
    mockPurchase.mockResolvedValue(undefined);
    const { getByLabelText } = render(<SubscriptionScreen />);

    fireEvent.press(getByLabelText('Subscribe'));

    await waitFor(() => {
      expect(mockPurchase).toHaveBeenCalledWith('spelling_mee_monthly');
    });
  });

  it('shows error alert when PurchaseError is thrown', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    mockPurchase.mockRejectedValue(
      new PurchaseError('payment_declined', 'Your payment was declined.')
    );

    const { getByLabelText } = render(<SubscriptionScreen />);
    fireEvent.press(getByLabelText('Subscribe'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Purchase Failed',
        'Your payment was declined.'
      );
    });
  });

  it('shows "You\'re subscribed!" when user is already subscribed', () => {
    mockIsSubscribed = true;
    const { getByText } = render(<SubscriptionScreen />);
    expect(getByText("You're subscribed!")).toBeTruthy();
  });

  it('does not show Subscribe button when user is already subscribed', () => {
    mockIsSubscribed = true;
    const { queryByLabelText } = render(<SubscriptionScreen />);
    expect(queryByLabelText('Subscribe')).toBeNull();
  });

  it('"Restore purchases" button calls restore', async () => {
    mockRestore.mockResolvedValue(undefined);
    const { getByLabelText } = render(<SubscriptionScreen />);

    fireEvent.press(getByLabelText('Restore purchases'));

    await waitFor(() => {
      expect(mockRestore).toHaveBeenCalled();
    });
  });
});
