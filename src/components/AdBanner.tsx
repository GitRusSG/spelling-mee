import React from 'react';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useSubscription } from '../contexts/SubscriptionContext';
import { shouldShowAd } from '../services/AdService';

// Use test ad unit ID during development; replace with real ID for production
const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

/**
 * Renders a Google AdMob banner when the user does not have an active subscription.
 * Renders nothing when the user is subscribed.
 */
export default function AdBanner() {
  const { status } = useSubscription();

  if (!shouldShowAd(status)) {
    return null;
  }

  return (
    <BannerAd
      unitId={AD_UNIT_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
}
