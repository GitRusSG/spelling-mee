import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
        <View style={styles.adLabelContainer}>
          <Text style={styles.adLabel}>Ad</Text>
        </View>
        <View style={styles.adContent}>
          <Text style={styles.adIcon}>📚</Text>
          <View style={styles.adTextBlock}>
            <Text style={styles.adTitle}>Learn 1000+ Words!</Text>
            <Text style={styles.adDescription}>
              Download WordMaster Pro — Free for 7 days
            </Text>
          </View>
          <TouchableOpacity style={styles.installButton} activeOpacity={0.8}>
            <Text style={styles.installButtonText}>Install</Text>
          </TouchableOpacity>
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
    height: 60,
    backgroundColor: '#0A2E4D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    position: 'relative',
  },
  adLabelContainer: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  adLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  adContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 468,
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  adIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  adTextBlock: {
    flex: 1,
    marginRight: 12,
  },
  adTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  adDescription: {
    fontSize: 11,
    color: '#B0D4F1',
  },
  installButton: {
    backgroundColor: '#00C853',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  installButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
