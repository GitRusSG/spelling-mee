import { Stack } from 'expo-router';
import { TestSessionProvider } from '../../src/contexts/TestSessionContext';

export default function TestLayout() {
  return (
    <TestSessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </TestSessionProvider>
  );
}
