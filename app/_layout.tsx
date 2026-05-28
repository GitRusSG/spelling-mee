import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { WordListProvider } from '../src/contexts/WordListContext';
import { SubscriptionProvider, useSubscription } from '../src/contexts/SubscriptionContext';
import { VoiceProfileProvider } from '../src/contexts/VoiceProfileContext';
import AdBanner from '../src/components/AdBanner';
import AnimatedBackground from '../src/components/AnimatedBackground';
import { createStorage } from '../src/services/storage';
import { useState, useEffect } from 'react';

// Background colors that match each pack theme
const BG_THEME_COLORS: Record<string, string> = {
  'bg-stars': '#1A1A2E',    // Dark night sky
  'bg-bubbles': '#E3F2FD',  // Light blue water
  'bg-confetti': '#FFF3E0', // Warm party orange
  'bg-ocean': '#E0F7FA',    // Ocean blue-green
  'bg-space': '#0D1B2A',    // Deep space dark
  'bg-forest': '#E8F5E9',   // Forest green
};

const DEFAULT_BG = '#F3E5F5'; // Default pink

function getThemeBackground(): string {
  try {
    const storage = createStorage();
    // First check if user has a custom bg color set in settings
    const customBg = storage.getString('app_bg_color');
    // Check equipped bg pack
    const packId = storage.getString('equipped_bg_pack_id');
    if (packId && BG_THEME_COLORS[packId]) {
      return BG_THEME_COLORS[packId];
    }
    if (customBg) return customBg;
    return DEFAULT_BG;
  } catch {
    return DEFAULT_BG;
  }
}

function InnerLayout() {
  const { isSubscribed } = useSubscription();
  const [bgColor, setBgColor] = useState(DEFAULT_BG);

  useEffect(() => {
    setBgColor(getThemeBackground());
    // Re-check periodically (simple polling for when user equips a new pack)
    const interval = setInterval(() => {
      setBgColor(getThemeBackground());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <AnimatedBackground />
      <Stack screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: 'transparent' },
        contentStyle: { backgroundColor: 'transparent' },
      }}>
        <Stack.Screen name="index" options={{ title: 'Spelling Mee', headerStyle: { backgroundColor: bgColor } }} />
        <Stack.Screen name="auth/login" options={{ title: 'Sign In' }} />
        <Stack.Screen name="auth/register" options={{ title: 'Create Account' }} />
        <Stack.Screen name="list/create" options={{ title: 'Create List' }} />
        <Stack.Screen name="list/[id]/edit" options={{ title: 'Edit List' }} />
        <Stack.Screen name="list/[id]/preview" options={{ title: 'Preview List' }} />
        <Stack.Screen
          name="test"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="community/index" options={{ title: 'Community Library' }} />
        <Stack.Screen name="community/[listId]" options={{ title: 'Shared List' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        <Stack.Screen name="settings/voice" options={{ title: 'Voice Settings' }} />
        <Stack.Screen name="settings/shop" options={{ title: 'Shop' }} />
        <Stack.Screen name="list/[id]/dictation" options={{ title: 'Record Dictation' }} />
        <Stack.Screen name="subscription" options={{ title: 'Subscription' }} />
      </Stack>
      {!isSubscribed && <AdBanner />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <WordListProvider>
        <VoiceProfileProvider>
          <SubscriptionProvider>
            <InnerLayout />
          </SubscriptionProvider>
        </VoiceProfileProvider>
      </WordListProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
