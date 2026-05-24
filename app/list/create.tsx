import { Text, View, StyleSheet } from 'react-native';

export default function CreateListScreen() {
  return (
    <View style={styles.container}>
      <Text>Create List</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
