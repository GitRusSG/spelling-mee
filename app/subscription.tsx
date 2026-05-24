import { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSubscription } from '../src/contexts/SubscriptionContext';
import { PurchaseError } from '../src/types/errors';

const PRODUCT_ID = 'spelling_mee_monthly';
const PRICE_LABEL = '$2.99/month';

const BENEFITS = [
  'Remove all ads',
  'Support development',
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
      <Text style={styles.title}>Spelling Mee Premium</Text>

      {isSubscribed ? (
        <View style={styles.subscribedContainer}>
          <Text style={styles.subscribedText}>You're subscribed!</Text>
          <Text style={styles.subscribedSubtext}>
            Thank you for supporting Spelling Mee.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.subtitle}>Unlock premium features</Text>

          <View style={styles.benefitsContainer}>
            {BENEFITS.map((benefit) => (
              <View key={benefit} style={styles.benefitRow}>
                <Text style={styles.checkmark}>✓</Text>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.price}>{PRICE_LABEL}</Text>

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
              <Text style={styles.purchaseButtonText}>Subscribe</Text>
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  checkmark: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  restoreButtonText: {
    color: '#4CAF50',
    fontSize: 14,
  },
  subscribedContainer: {
    alignItems: 'center',
    marginTop: 24,
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
  },
});
