import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { WordListProvider } from '../src/contexts/WordListContext';
import { SubscriptionProvider, useSubscription } from '../src/contexts/SubscriptionContext';
import AdBanner from '../src/components/AdBanner';

function InnerLayout() {
  const { isSubscribed } = useSubscription();

  return (
    <View style={styles.container}>
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="index" options={{ title: 'Spelling Mee' }} />
        <Stack.Screen name="list/create" options={{ title: 'Create List' }} />
        <Stack.Screen name="list/[id]/edit" options={{ title: 'Edit List' }} />
        <Stack.Screen name="list/[id]/preview" options={{ title: 'Preview List' }} />
        <Stack.Screen
          name="test/[listId]"
          options={{ title: 'Spelling Test' }}
        />
        <Stack.Screen name="test/results" options={{ title: 'Results' }} />
        <Stack.Screen name="subscription" options={{ title: 'Subscription' }} />
      </Stack>
      {!isSubscribed && <AdBanner />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <WordListProvider>
      <SubscriptionProvider>
        <InnerLayout />
      </SubscriptionProvider>
    </WordListProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
