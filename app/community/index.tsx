import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function CommunityLibraryScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.replace('/')} style={styles.backButton} testID="back-button">
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.icon}>🌍</Text>
        <Text style={styles.title}>Community Library</Text>
        <Text style={styles.message}>Your account is not old enough to use the library!</Text>
        <Text style={styles.submessage}>Keep spelling to unlock this feature.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E5F5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: { fontSize: 15, color: '#7C4DFF', fontWeight: '600' },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  submessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
