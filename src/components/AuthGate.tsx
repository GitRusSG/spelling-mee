import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface AuthGateProps {
  children: ReactNode;
  fallback?: ReactNode;
}

function DefaultLoginPrompt() {
  const router = useRouter();

  return (
    <View style={styles.container} testID="auth-gate-login-prompt">
      <Text style={styles.icon}>🔒</Text>
      <Text style={styles.title}>Account Required</Text>
      <Text style={styles.message}>Please log in to access this feature</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/auth/login')}
        accessibilityRole="button"
        accessibilityLabel="Go to login"
        testID="auth-gate-login-button"
      >
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.registerLink}
        onPress={() => router.push('/auth/register')}
        accessibilityRole="link"
        accessibilityLabel="Go to register"
        testID="auth-gate-register-link"
      >
        <Text style={styles.linkText}>
          Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AuthGate({ children, fallback }: AuthGateProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer} testID="auth-gate-loading">
        <ActivityIndicator size="large" color="#7C4DFF" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return <>{fallback ?? <DefaultLoginPrompt />}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F3E5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A148C',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#7C4DFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    minHeight: 48,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  registerLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#7C4DFF',
    fontWeight: '600',
  },
});
