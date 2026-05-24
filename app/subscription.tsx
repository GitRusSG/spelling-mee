import { Text, View, StyleSheet } from 'react-native';

export default function SubscriptionScreen() {
  return (
    <View style={styles.container}>
      <Text>Subscription</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
