import { StyleSheet, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.smallTitle}>GUÍA TURÍSTICA</Text>
          <Text style={styles.title}>Colón</Text>
          <Text style={styles.subtitle}>
            Descubrí todo lo que esta ciudad tiene para vos
          </Text>
        </View>

        <Pressable style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </Pressable>
      </View>

      {/* Buscador */}
      <Pressable style={styles.search}>
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.searchText}>¿Qué querés conocer?</Text>
      </Pressable>

      {/* Mapa */}
      <View style={styles.mapCard}>
        <View style={styles.mapBackground}>
          <Text style={styles.mapEmoji}>📍</Text>
          <Text style={styles.mapTitle}>Mapa de Colón</Text>
          <Text style={styles.mapSubtitle}>
            Lugares turísticos cerca tuyo
          </Text>

          <Pressable style={styles.mapButton}>
            <Text style={styles.mapButtonText}>Ver mapa</Text>
          </Pressable>
        </View>
      </View>

      {/* Lugares cercanos */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Lo que tenés cerca</Text>
        <Text style={styles.seeMore}>Ver todos</Text>
      </View>

      <View style={styles.placeCard}>
        <View style={styles.placeIcon}>
          <Text>♨️</Text>
        </View>

        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>Termas de Colón</Text>
          <Text style={styles.placeCategory}>Termas</Text>
          <Text style={styles.placeDistance}>900 m</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </View>

      <View style={styles.placeCard}>
        <View style={styles.placeIcon}>
          <Text>🏖️</Text>
        </View>

        <View style={styles.placeInfo}>
          <Text style={styles.placeName}>Playa Paso Vela</Text>
          <Text style={styles.placeCategory}>Playas</Text>
          <Text style={styles.placeDistance}>1,1 km</Text>
        </View>

        <Text style={styles.arrow}>›</Text>
      </View>

      {/* Navegación inferior */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem}>
          <Text style={styles.navIcon}>🗺️</Text>
          <Text style={styles.navTextActive}>Mapa</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Text style={styles.navIcon}>📅</Text>
          <Text style={styles.navText}>Agenda</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Text style={styles.navIcon}>🧭</Text>
          <Text style={styles.navText}>Mi recorrido</Text>
        </Pressable>

        <Pressable style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Yo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },

  smallTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#77736B',
    letterSpacing: 1.5,
  },

  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#253A32',
    marginTop: 2,
  },

  subtitle: {
    fontSize: 14,
    color: '#77736B',
    marginTop: 2,
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E2E8DF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileIcon: {
    fontSize: 21,
  },

  search: {
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E4E1D9',
  },

  searchIcon: {
    fontSize: 28,
    color: '#77736B',
    marginRight: 10,
  },

  searchText: {
    fontSize: 15,
    color: '#99958C',
  },

  mapCard: {
    height: 210,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 22,
  },

  mapBackground: {
    flex: 1,
    backgroundColor: '#DDE7D8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  mapEmoji: {
    fontSize: 42,
    marginBottom: 5,
  },

  mapTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#253A32',
  },

  mapSubtitle: {
    fontSize: 13,
    color: '#667267',
    marginTop: 4,
  },

  mapButton: {
    backgroundColor: '#253A32',
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 15,
  },

  mapButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#253A32',
  },

  seeMore: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667B5E',
  },

  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECE9E1',
  },

  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  placeInfo: {
    flex: 1,
  },

  placeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#30352F',
  },

  placeCategory: {
    fontSize: 12,
    color: '#77736B',
    marginTop: 2,
  },

  placeDistance: {
    fontSize: 12,
    color: '#667B5E',
    fontWeight: '600',
    marginTop: 3,
  },

  arrow: {
    fontSize: 28,
    color: '#AAA69D',
    paddingHorizontal: 5,
  },

  bottomNav: {
    marginTop: 'auto',
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DD',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginHorizontal: -20,
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