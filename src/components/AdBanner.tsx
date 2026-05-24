import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { shouldShowAd } from '../services/AdService';

/**
 * Renders a Google AdMob banner when the user does not have an active subscription.
 * On web, renders a placeholder. On native, renders the real AdMob banner.
 * Renders nothing when the user is subscribed.
 */
export default function AdBanner() {
  const { status } = useSubscription();

  if (!shouldShowAd(status)) {
    return null;
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webBanner}>
        <Text style={styles.webBannerText}>Ad Space</Text>
      </View>
    );
  }

  // Native: use real AdMob
  const { BannerAd, BannerAdSize, TestIds } = require('react-native-google-mobile-ads');
  const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

  return (
    <BannerAd
      unitId={AD_UNIT_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
}

const styles = StyleSheet.create({
  webBanner: {
    height: 50,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  webBannerText: {
    color: '#999',
    fontSize: 12,
  },
});
