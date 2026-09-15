import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <View style={styles.bottomNav}>
      <Pressable
        style={styles.navItem}
        onPress={() => router.push('/')}
      >
        <Text style={styles.navIcon}>🗺️</Text>
        <Text
          style={
            pathname === '/'
              ? styles.navTextActive
              : styles.navText
          }
        >
          Mapa
        </Text>
      </Pressable>

      <Pressable
        style={styles.navItem}
        onPress={() => router.push('/agenda')}
      >
        <Text style={styles.navIcon}>📅</Text>
        <Text
          style={
            pathname === '/agenda'
              ? styles.navTextActive
              : styles.navText
          }
        >
          Agenda
        </Text>
      </Pressable>

      <Pressable
        style={styles.navItem}
        onPress={() => router.push('/recorrido')}
      >
        <Text style={styles.navIcon}>🧭</Text>
        <Text
          style={
            pathname === '/recorrido'
              ? styles.navTextActive
              : styles.navText
          }
        >
          Mi recorrido
        </Text>
      </Pressable>

      <Pressable
        style={styles.navItem}
        onPress={() => router.push('/yo')}
      >
        <Text style={styles.navIcon}>👤</Text>
        <Text
          style={
            pathname === '/yo'
              ? styles.navTextActive
              : styles.navText
          }
        >
          Yo
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DD',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  navIcon: {
    fontSize: 20,
    marginBottom: 3,
  },

  navText: {
    fontSize: 10,
    color: '#77736B',
  },

  navTextActive: {
    fontSize: 10,
    color: '#253A32',
    fontWeight: '800',
  },
});