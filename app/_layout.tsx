import { View, StyleSheet, Platform } from 'react-native';
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

    const applyBgStyles = (bg: string) => {
      document.body.style.backgroundColor = bg;
      document.documentElement.style.backgroundColor = bg;
      let bgStyleEl = document.getElementById('spelling-mee-bg-style');
      if (!bgStyleEl) {
        bgStyleEl = document.createElement('style');
        bgStyleEl.id = 'spelling-mee-bg-style';
        document.head.appendChild(bgStyleEl);
      }
      bgStyleEl.textContent = `
        html, body, #root, [data-testid="results-screen"] { background-color: ${bg} !important; }
        [role="main"], main { background-color: transparent !important; }
      `;
    };

    const interval = setInterval(() => {
      const newBg = getThemeBackground();
      setBgColor(newBg);
      // Also set body background on web for full coverage
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        applyBgStyles(newBg);
      }
    }, 2000);
    // Set initial body bg
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const initialBg = getThemeBackground();
      applyBgStyles(initialBg);
    }
    return () => clearInterval(interval);
  }, []);

  // Apply global text style on web via CSS injection
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const applyGlobalTextStyle = () => {
      try {
        const storage = createStorage();
        const packId = storage.getString('equipped_text_pack_id') || null;
        let css = '';
        switch (packId) {
          case 'text-bubble':
            css = '* { letter-spacing: 2px !important; font-weight: 900 !important; }';
            break;
          case 'text-pixel':
            css = '* { font-family: monospace !important; letter-spacing: 1px !important; }';
            break;
          case 'text-rainbow':
            css = 'h1, h2, h3, [data-testid] { color: #FF6D00 !important; }';
            break;
          case 'text-glow':
            css = '* { text-shadow: 0 0 8px #7C4DFF !important; }';
            break;
          case 'text-handwritten':
            css = '* { font-style: italic !important; font-weight: 300 !important; letter-spacing: 1px !important; }';
            break;
          default:
            css = '';
        }
        let styleEl = document.getElementById('spelling-mee-text-style');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'spelling-mee-text-style';
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = css;
      } catch {}
    };
    applyGlobalTextStyle();
    const interval = setInterval(applyGlobalTextStyle, 2000);
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
      {/* Ads disabled */}
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
