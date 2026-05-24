import { Stack } from 'expo-router';
import { WordListProvider } from '../src/contexts/WordListContext';
import { SubscriptionProvider } from '../src/contexts/SubscriptionContext';

export default function RootLayout() {
  return (
    <WordListProvider>
      <SubscriptionProvider>
        <Stack>
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
      </SubscriptionProvider>
    </WordListProvider>
  );
}
