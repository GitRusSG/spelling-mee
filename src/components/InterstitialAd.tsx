import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';

interface InterstitialAdProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Full-screen interstitial ad overlay that shows for 5 seconds before the test starts.
 * Displays a realistic-looking ad placeholder on all platforms.
 * On native, will be replaced with real AdMob interstitial in the future.
 */
export default function InterstitialAd({ visible, onClose }: InterstitialAdProps) {
  const [countdown, setCountdown] = useState(5);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!visible) {
      // Reset state when hidden
      setCountdown(5);
      setCanClose(false);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanClose(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Ad label in top-left corner */}
        <View style={styles.adLabelContainer}>
          <Text style={styles.adLabelText}>Ad</Text>
        </View>

        {/* Countdown or close button in top-right corner */}
        <View style={styles.topRight}>
          {canClose ? (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              testID="interstitial-close-button"
              accessibilityRole="button"
              accessibilityLabel="Close ad"
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>Skip in {countdown}...</Text>
            </View>
          )}
        </View>

        {/* Ad content card */}
        <View style={styles.card}>
          {/* Fake app icon */}
          <View style={styles.appIcon}>
            <Text style={styles.appIconText}>W</Text>
          </View>

          <Text style={styles.headline}>📖 Expand Your Vocabulary!</Text>
          <Text style={styles.description}>
            WordMaster Pro — The #1 vocabulary app for kids
          </Text>

          <View style={styles.starsRow}>
            <Text style={styles.stars}>⭐⭐⭐⭐⭐</Text>
            <Text style={styles.ratingText}>4.8 • 50K+ downloads</Text>
          </View>

          <TouchableOpacity
            style={styles.installButton}
            activeOpacity={0.8}
            testID="interstitial-install-button"
          >
            <Text style={styles.installButtonText}>Install Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adLabelContainer: {
    position: 'absolute',
    top: 52,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  adLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  topRight: {
    position: 'absolute',
    top: 52,
    right: 16,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  countdownBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#BBBBBB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    width: '85%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#7C4DFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appIconText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headline: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  stars: {
    fontSize: 14,
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#888888',
  },
  installButton: {
    backgroundColor: '#00C853',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minWidth: 180,
    alignItems: 'center',
  },
  installButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
