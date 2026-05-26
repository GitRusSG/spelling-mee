import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { validateEmail, validatePassword } from '../../src/utils/validation';
import { createProfile } from '../../src/services/UserProfileService';
import { useWordList } from '../../src/contexts/WordListContext';
import { CustomWordList } from '../../src/types';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { lists, migrateLocalLists } = useWordList();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else {
      const emailResult = validateEmail(email.trim());
      if (!emailResult.valid) {
        setEmailError('Enter a valid email address');
        valid = false;
      }
    }

    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else {
      const passwordResult = validatePassword(password);
      if (!passwordResult.valid) {
        setPasswordError('Password must be at least 8 characters');
        valid = false;
      }
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const user = await signUp(email.trim(), password);

      // Navigate to home immediately — user is now authenticated
      router.replace('/');

      // Best-effort: create profile and migrate lists (don't block navigation)
      try {
        const displayName = email.trim().split('@')[0];
        await createProfile(user.uid, { email: email.trim(), displayName });
      } catch {
        // Profile creation failed — not critical, can be retried later
      }

      try {
        const localCustomLists = lists.filter(
          (l): l is CustomWordList => l.type === 'custom' && !l.creatorUid
        );
        if (localCustomLists.length > 0) {
          migrateLocalLists(localCustomLists);
        }
      } catch {
        // Migration failed — not critical
      }
    } catch (error: any) {
      const code = error?.code ?? '';
      if (code === 'auth/email-already-in-use') {
        setEmailError('An account with this email already exists');
      } else if (code === 'auth/weak-password') {
        setPasswordError('Password is too weak. Use at least 8 characters.');
      } else if (code === 'auth/invalid-email') {
        setEmailError('Enter a valid email address');
      } else {
        setGeneralError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <Text style={styles.title}>🐝 Create Account</Text>
          <Text style={styles.subtitle}>Sign up to create custom spelling lists</Text>

          {generalError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError ? styles.inputError : null]}
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="email-input"
              accessibilityLabel="Email"
            />
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[styles.input, passwordError ? styles.inputError : null]}
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              testID="password-input"
              accessibilityLabel="Password"
            />
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.button, isSubmitting && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Create account"
            testID="register-button"
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={() => router.push('/auth/login')}
            accessibilityRole="link"
            accessibilityLabel="Go to login"
            testID="login-link"
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E5F5',
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4A148C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorBanner: {
    backgroundColor: '#FFCDD2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A148C',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#CE93D8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#FF5252',
  },
  errorText: {
    color: '#FF5252',
    fontSize: 13,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#7C4DFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 20,
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
