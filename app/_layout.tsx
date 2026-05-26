import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { WordListProvider } from '../src/contexts/WordListContext';
import { SubscriptionProvider, useSubscription } from '../src/contexts/SubscriptionContext';
import { VoiceProfileProvider } from '../src/contexts/VoiceProfileContext';
import AdBanner from '../src/components/AdBanner';

function InnerLayout() {
  const { isSubscribed } = useSubscription();

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: 'Spelling Mee' }} />
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
        <Stack.Screen name="settings/voice" options={{ title: 'Voice Settings' }} />
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
