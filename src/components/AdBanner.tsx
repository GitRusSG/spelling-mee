import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { shouldShowAd } from '../services/AdService';

/**
 * Renders a Google AdMob banner when the user does not have an active subscription.
 * On web, renders a realistic-looking ad placeholder. On native, renders the real AdMob banner.
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
        <View style={styles.webBannerInner}>
          <Text style={styles.adLabel}>Advertisement</Text>
          <View style={styles.adContent}>
            <View style={styles.adIcon} />
            <View style={styles.adTextBlock}>
              <Text style={styles.adTitle}>Ad Space — Your Brand Here</Text>
              <Text style={styles.adDescription}>Sponsored content will appear in this area</Text>
            </View>
          </View>
        </View>
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
    backgroundColor: '#FAFAFA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  webBannerInner: {
    alignItems: 'center',
  },
  adLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    width: '100%',
    maxWidth: 468,
  },
  adIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#BBDEFB',
    marginRight: 10,
  },
  adTextBlock: {
    flex: 1,
  },
  adTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 2,
  },
  adDescription: {
    fontSize: 11,
    color: '#757575',
  },
});
