import { useThemedStyles } from "@/hooks/use-theme";

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeContext } from '@/contexts/theme-context';

import { lugares } from '@/data/lugares';
import { inicializarBaseDeDatos } from '@/servicios/visitas';
import { obtenerLugaresIntegrados } from '@/servicios/lugares-integrados';

import type { Place } from '@/data/lugares';

function calcularDistanciaKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const radioTierra = 6371;

  const diferenciaLatitud = ((lat2 - lat1) * Math.PI) / 180;
  const diferenciaLongitud = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(diferenciaLongitud / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radioTierra * c;
}

function formatearDistancia(distanciaKm: number) {
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)} m`;
  }

  return `${distanciaKm.toFixed(1).replace('.', ',')} km`;
}

const REGION_INICIAL: Region = {
  latitude: -32.22477,
  longitude: -58.14261,
  latitudeDelta: 0.025,
  longitudeDelta: 0.025,
};

export default function HomeScreen() {
  const themedStyles = useThemedStyles(styles);
  const router = useRouter();
  const { colors } = useThemeContext();
  const mapRef = useRef<MapView>(null);

  const [selectedPlaceId, setSelectedPlaceId] =
    useState('centro-colon');

  // La aplicación comienza con los datos locales.
  // Cuando la API responde, actualiza la lista.
  const [lugaresDisponibles, setLugaresDisponibles] =
    useState<Place[]>(lugares);

  const selectedPlace =
    lugaresDisponibles.find(
      (lugar) => lugar.id === selectedPlaceId
    ) ?? lugaresDisponibles[0] ?? lugares[0];

  const lugaresCercanos = useMemo(() => {
    return lugaresDisponibles
      .filter((lugar) => lugar.id !== selectedPlace.id)
      .map((lugar) => ({
        ...lugar,
        distancia: calcularDistanciaKm(
          selectedPlace.latitud,
          selectedPlace.longitud,
          lugar.latitud,
          lugar.longitud
        ),
      }))
      .sort((a, b) => a.distancia - b.distancia);
  }, [lugaresDisponibles, selectedPlace]);

  // Inicialización de la base de datos local.
  useEffect(() => {
    try {
      inicializarBaseDeDatos();
      console.log('Base de datos inicializada correctamente');
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
    }
  }, []);

  // Carga los lugares de la API sin impedir que la pantalla abra.
  useEffect(() => {
    let activo = true;

    async function cargarLugares() {
      try {
        const resultado = await obtenerLugaresIntegrados();

        if (activo && resultado.length > 0) {
          setLugaresDisponibles(resultado);
          console.log(
            `Lugares cargados correctamente: ${resultado.length}`
          );
        }
      } catch (error) {
        console.error(
          'No se pudieron cargar los lugares. Se mantienen los datos locales.',
          error
        );
      }
    }

    cargarLugares();

    return () => {
      activo = false;
    };
  }, []);

  // Centra el mapa en el lugar seleccionado.
  useEffect(() => {
    mapRef.current?.animateToRegion(
      {
        latitude: selectedPlace.latitud,
        longitude: selectedPlace.longitud,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      450
    );
  }, [selectedPlace]);

  return (
    <View style={[themedStyles.screen, { backgroundColor: colors.background }]}>
      <SafeAreaView
        style={[themedStyles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={themedStyles.scrollContent}
          nestedScrollEnabled
        >
          {/* Encabezado */}
          <View style={themedStyles.header}>
            <View>
              <Text style={[themedStyles.smallTitle, { color: colors.primary }]}>
                GUÍA TURÍSTICA
              </Text>

              <Text style={[themedStyles.title, { color: colors.text }]}>Colón</Text>

              <Text style={[themedStyles.subtitle, { color: colors.textSecondary }]}>
                Descubrí todo lo que esta ciudad tiene para vos
              </Text>
            </View>

            <Pressable
              style={[
                themedStyles.profileButton,
                { backgroundColor: colors.backgroundSelected },
              ]}
              onPress={() => router.push('/yo')}
            >
              <Text style={themedStyles.profileIcon}>👤</Text>
            </Pressable>
          </View>

          {/* Buscador */}
          <Pressable
            style={[
              themedStyles.search,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.inputBorder,
              },
            ]}
            onPress={() => router.push('/lugares')}
          >
            <Text style={[themedStyles.searchIcon, { color: colors.primary }]}>⌕</Text>

            <Text style={[themedStyles.searchText, { color: colors.textSecondary }]}>
              ¿Qué querés conocer?
            </Text>
          </Pressable>

          {/* Google Maps */}
          <View style={themedStyles.mapCard}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={themedStyles.map}
              initialRegion={REGION_INICIAL}
              showsCompass
              showsScale
              toolbarEnabled={false}
              loadingEnabled
            >
              {lugaresDisponibles.map((lugar) => {
                const seleccionado =
                  lugar.id === selectedPlaceId;

                return (
                  <Marker
                    key={lugar.id}
                    coordinate={{
                      latitude: lugar.latitud,
                      longitude: lugar.longitud,
                    }}
                    title={lugar.nombre}
                    description={lugar.categoria}
                    onPress={() => {
                      setSelectedPlaceId(lugar.id);
                    }}
                    zIndex={seleccionado ? 2 : 1}
                  >
                    <View
                      style={[
                        themedStyles.marker,
                        seleccionado
                          ? themedStyles.markerSelected
                          : themedStyles.markerNormal,
                      ]}
                    >
                      {seleccionado && (
                        <View style={themedStyles.markerDot} />
                      )}
                    </View>
                  </Marker>
                );
              })}
            </MapView>
          </View>

          {/* Lugares cercanos */}
          <View style={themedStyles.sectionHeader}>
            <Text style={[themedStyles.sectionTitle, { color: colors.text }]}>
              {selectedPlace.id === 'centro-colon'
                ? 'Lo que tenés cerca'
                : `Cerca de ${selectedPlace.nombre}`}
            </Text>

            <Pressable
              onPress={() => router.push('/lugares')}
            >
              <Text style={[themedStyles.seeMore, { color: colors.primary }]}>Ver todos</Text>
            </Pressable>
          </View>

          {/* Tarjetas */}
          <View style={themedStyles.cardsContainer}>
            {lugaresCercanos.slice(0, 3).map((lugar) => (
              <Pressable
                key={lugar.id}
                style={[
                  themedStyles.placeCard,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedPlaceId(lugar.id);
                }}
              >
                <View
                  style={[
                    themedStyles.placeIcon,
                    { backgroundColor: colors.backgroundSelected },
                  ]}
                >
                  <Text style={themedStyles.placeIconText}>
                    {lugar.icono}
                  </Text>
                </View>

                <View style={themedStyles.placeInfo}>
                  <Text style={[themedStyles.placeName, { color: colors.text }]}>
                    {lugar.nombre}
                  </Text>

                  <Text
                    style={[
                      themedStyles.placeCategory,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {lugar.categoria}
                  </Text>

                  <Text style={[themedStyles.placeDistance, { color: colors.success }]}>
                    {formatearDistancia(lugar.distancia)}
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/lugar-detalle',
                      params: { id: lugar.id },
                    })
                  }
                  hitSlop={10}
                >
                  <Text style={[themedStyles.arrow, { color: colors.primary }]}>›</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },

  smallTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2F7F8F',
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
    backgroundColor: '#DCE9E8',
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
    borderColor: '#D8E4E2',
  },

  searchIcon: {
    fontSize: 28,
    color: '#2F7F8F',
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

  map: {
    flex: 1,
  },

  marker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  markerNormal: {
    backgroundColor: '#6B8E5A',
  },

  markerSelected: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2F7F8F',
    borderWidth: 4,
  },

  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
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
    color: '#2F7F8F',
  },

  cardsContainer: {
    paddingBottom: 30,
  },

  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3E1D8',
  },

  placeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#E5EFE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  placeIconText: {
    fontSize: 22,
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
    color: '#6B8E5A',
    fontWeight: '600',
    marginTop: 3,
  },

  arrow: {
    fontSize: 28,
    color: '#2F7F8F',
    paddingHorizontal: 5,
  },
});
