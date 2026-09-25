import {
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { lugares } from '@/data/lugares';
import * as Location from 'expo-location';
import {
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';

export default function LugarDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const lugar = lugares.find((item) => item.id === id);

  const player = useAudioPlayer(lugar?.audio);

  const audioStatus = useAudioPlayerStatus(player);

  const alternarAudio = () => {
    if (!lugar?.audio) {
      Alert.alert(
        'Audioguía no disponible',
        'La audioguía de este lugar todavía no está disponible.'
      );
      return;
    }

    if (audioStatus.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const abrirRuta = async () => {
    if (!lugar) return;

    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Ubicación necesaria',
          'Necesitamos tu ubicación para calcular la ruta hasta este lugar.'
        );
        return;
      }

      const ubicacion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const origenLat = ubicacion.coords.latitude;
      const origenLon = ubicacion.coords.longitude;

      const url =
        `https://www.google.com/maps/dir/?api=1` +
        `&origin=${origenLat},${origenLon}` +
        `&destination=${lugar.latitud},${lugar.longitud}`;

      await Linking.openURL(url);
    } catch (error) {
      Alert.alert(
        'No se pudo obtener la ubicación',
        'Intentá nuevamente en unos segundos.'
      );
    }
  };

  const llamar = () => {
    if (!lugar?.telefono) return;

    Linking.openURL(`tel:${lugar.telefono}`);
  };

  const abrirWeb = () => {
    if (!lugar?.web) return;

    Linking.openURL(lugar.web);
  };

  if (!lugar) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>📍</Text>

            <Text style={styles.errorTitle}>
              Lugar no encontrado
            </Text>

            <Text style={styles.errorText}>
              No pudimos encontrar la información de este lugar.
            </Text>

            <Pressable
              style={styles.backButtonLarge}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>
                Volver
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backIcon}>‹</Text>
            </Pressable>

            <Text style={styles.headerTitle}>
              Detalle
            </Text>

            <Pressable style={styles.favoriteButton}>
              <Text style={styles.favoriteIcon}>
                ♡
              </Text>
            </Pressable>
          </View>

          <View style={styles.hero}>
            {lugar.imagen ? (
              <Image
                source={lugar.imagen}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.heroIcon}>
                {lugar.icono}
              </Text>
            )}
          </View>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {lugar.categoria}
            </Text>
          </View>

          <Text style={styles.title}>
            {lugar.nombre}
          </Text>

          <Text style={styles.description}>
            {lugar.descripcion}
          </Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>📍</Text>

              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                  Dirección
                </Text>

                <Text style={styles.infoValue}>
                  {lugar.direccion}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🕐</Text>

              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                  Horarios
                </Text>

                <Text style={styles.infoValue}>
                  {lugar.horario}
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>💰</Text>

              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>
                  Entrada
                </Text>

                <Text style={styles.infoValue}>
                  {lugar.precio}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              style={styles.primaryButton}
              onPress={abrirRuta}
            >
              <Text style={styles.primaryButtonIcon}>
                🧭
              </Text>

              <Text style={styles.primaryButtonText}>
                Cómo llegar
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={alternarAudio}
            >
              <Text style={styles.secondaryButtonIcon}>
                {audioStatus.playing ? '⏸️' : '🎧'}
              </Text>

              <Text style={styles.secondaryButtonText}>
                {audioStatus.playing ? 'Pausar' : 'Audioguía'}
              </Text>
            </Pressable>
          </View>

          <Pressable style={styles.visitButton}>
            <Text style={styles.visitButtonIcon}>
              ✓
            </Text>

            <Text style={styles.visitButtonText}>
              Registrar visita
            </Text>
          </Pressable>

          {lugar.telefono && (
            <Pressable
              style={styles.contactButton}
              onPress={llamar}
            >
              <Text style={styles.contactButtonIcon}>
                📞
              </Text>

              <View style={styles.contactButtonContent}>
                <Text style={styles.contactButtonLabel}>
                  Teléfono
                </Text>

                <Text style={styles.contactButtonText}>
                  {lugar.telefono}
                </Text>
              </View>
            </Pressable>
          )}

          {lugar.web && (
            <Pressable
              style={styles.contactButton}
              onPress={abrirWeb}
            >
              <Text style={styles.contactButtonIcon}>
                🌐
              </Text>

              <View style={styles.contactButtonContent}>
                <Text style={styles.contactButtonLabel}>
                  Sitio web
                </Text>

                <Text style={styles.contactButtonText}>
                  Visitar sitio oficial
                </Text>
              </View>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F3E8',
  },

  container: {
    flex: 1,
    backgroundColor: '#F7F3E8',
    paddingHorizontal: 20,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCE9E8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backIcon: {
    fontSize: 32,
    color: '#253A32',
    lineHeight: 36,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#253A32',
  },

  favoriteButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E1D8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  favoriteIcon: {
    fontSize: 27,
    color: '#2F7F8F',
  },

  hero: {
    height: 190,
    borderRadius: 24,
    backgroundColor: '#DCE9E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },

  heroIcon: {
    fontSize: 70,
  },

  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5EFE4',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    marginTop: 18,
  },

  categoryText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B8E5A',
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#253A32',
    marginTop: 10,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5F5C55',
    marginTop: 10,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E3E1D8',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIcon: {
    fontSize: 22,
    width: 36,
  },

  infoContent: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#77736B',
    textTransform: 'uppercase',
  },

  infoValue: {
    fontSize: 14,
    color: '#30352F',
    fontWeight: '600',
    marginTop: 2,
  },

  separator: {
    height: 1,
    backgroundColor: '#EAE7DE',
    marginVertical: 13,
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },

  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#2F7F8F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  primaryButtonIcon: {
    fontSize: 18,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E5EFE4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  secondaryButtonIcon: {
    fontSize: 18,
  },

  secondaryButtonText: {
    color: '#253A32',
    fontSize: 14,
    fontWeight: '800',
  },

  visitButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#253A32',
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  visitButtonIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },

  visitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  contactButton: {
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E1D8',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactButtonIcon: {
    fontSize: 24,
    width: 40,
  },

  contactButtonContent: {
    flex: 1,
  },

  contactButtonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#77736B',
    textTransform: 'uppercase',
  },

  contactButtonText: {
    fontSize: 14,
    color: '#30352F',
    fontWeight: '700',
    marginTop: 2,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorIcon: {
    fontSize: 50,
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#253A32',
    marginTop: 15,
  },

  errorText: {
    fontSize: 14,
    color: '#77736B',
    textAlign: 'center',
    marginTop: 8,
  },

  backButtonLarge: {
    backgroundColor: '#2F7F8F',
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 20,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});