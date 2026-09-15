import { StyleSheet, Text, View } from 'react-native';

export default function RecorridoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi recorrido</Text>
      <Text style={styles.subtitle}>
        Tus lugares visitados en Colón
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#253A32',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#77736B',
  },
});