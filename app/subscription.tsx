import { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '../src/contexts/SubscriptionContext';
import { PurchaseError } from '../src/types/errors';

const PRODUCT_ID = 'spelling_mee_monthly';
const PRICE_LABEL = '$2.99/month';

const BENEFITS = [
  { icon: '🚫', text: 'No ads — distraction-free learning' },
  { icon: '❤️', text: 'Support ongoing development' },
  { icon: '⭐', text: 'Help us build new features faster' },
];

export default function SubscriptionScreen() {
  const { isSubscribed, purchase, restore } = useSubscription();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      await purchase(PRODUCT_ID);
    } catch (error) {
      if (error instanceof PurchaseError) {
        Alert.alert('Purchase Failed', error.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      await restore();
    } catch (error) {
      if (error instanceof PurchaseError) {
        Alert.alert('Restore Failed', error.userMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>PREMIUM</Text>
        <Text style={styles.title}>Spelling Mee Premium</Text>

        {isSubscribed ? (
          <View style={styles.subscribedContainer}>
            <Text style={styles.subscribedEmoji}>🎉</Text>
            <Text style={styles.subscribedText}>You're subscribed!</Text>
            <Text style={styles.subscribedSubtext}>
              Thank you for supporting Spelling Mee.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enjoy a cleaner experience and support the app
            </Text>

            <View style={styles.benefitsContainer}>
              {BENEFITS.map((benefit) => (
                <View key={benefit.text} style={styles.benefitRow}>
                  <Text style={styles.benefitIcon}>{benefit.icon}</Text>
                  <Text style={styles.benefitText}>{benefit.text}</Text>
                </View>
              ))}
            </View>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>{PRICE_LABEL}</Text>
              <Text style={styles.priceNote}>Cancel anytime</Text>
            </View>

            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={handlePurchase}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Subscribe"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.purchaseButtonText}>Subscribe Now</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Restore purchases"
            >
              <Text style={styles.restoreButtonText}>Restore purchases</Text>
            </TouchableOpacity>

            {Platform.OS === 'web' && (
              <Text style={styles.webNote}>
                Coming soon to App Store & Google Play
              </Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6C63FF',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  priceNote: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  purchaseButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
    minWidth: 220,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  restoreButtonText: {
    color: '#6C63FF',
    fontSize: 14,
  },
  subscribedContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  subscribedEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  subscribedText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  subscribedSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  webNote: {
    marginTop: 20,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
