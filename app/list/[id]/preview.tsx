import { Text, View, StyleSheet } from 'react-native';

export default function PreviewScreen() {
  return (
    <View style={styles.container}>
      <Text>Preview List</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
