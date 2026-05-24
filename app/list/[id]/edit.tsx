import { Text, View, StyleSheet } from 'react-native';

export default function EditListScreen() {
  return (
    <View style={styles.container}>
      <Text>Edit List</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
