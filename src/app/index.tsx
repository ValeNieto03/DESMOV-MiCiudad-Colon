import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';

import { lugares } from '@/data/lugares';

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
    Math.sin(diferenciaLatitud / 2) *
    Math.sin(diferenciaLatitud / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(diferenciaLongitud / 2) *
    Math.sin(diferenciaLongitud / 2);

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return radioTierra * c;
}

function formatearDistancia(distanciaKm: number) {
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)} m`;
  }

  return `${distanciaKm.toFixed(1).replace('.', ',')} km`;
}

export default function HomeScreen() {
  const router = useRouter();

  const [selectedPlaceId, setSelectedPlaceId] =
    useState('centro-colon');

  const [scrollEnabled, setScrollEnabled] = useState(true);

  const selectedPlace =
    lugares.find((lugar) => lugar.id === selectedPlaceId) ??
    lugares[0];

  const lugaresCercanos = useMemo(() => {
    return lugares
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
  }, [selectedPlace]);

  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    webViewRef.current?.injectJavaScript(`
      if (window.focusSelectedPlace) {
        window.focusSelectedPlace(
          ${selectedPlace.latitud},
          ${selectedPlace.longitud}
        );
      }
      true;
    `);
  }, [selectedPlace]);

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.container}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={scrollEnabled}
          nestedScrollEnabled={true}
        >

          {/* Encabezado */}
          <View style={styles.header}>
            <View>
              <Text style={styles.smallTitle}>
                GUÍA TURÍSTICA
              </Text>

              <Text style={styles.title}>
                Colón
              </Text>

              <Text style={styles.subtitle}>
                Descubrí todo lo que esta ciudad tiene para vos
              </Text>
            </View>

            <Pressable
              style={styles.profileButton}
              onPress={() => router.push('/yo')}
            >
              <Text style={styles.profileIcon}>
                👤
              </Text>
            </Pressable>
          </View>

          {/* Buscador */}
          <Pressable
            style={styles.search}
            onPress={() => router.push('/lugares')}
          >
            <Text style={styles.searchIcon}>
              ⌕
            </Text>

            <Text style={styles.searchText}>
              ¿Qué querés conocer?
            </Text>
          </Pressable>

          {/* Mapa */}
          <View style={styles.mapCard}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              nestedScrollEnabled={true}
              onTouchStart={() => setScrollEnabled(false)}
              onTouchEnd={() => setScrollEnabled(true)}
              onTouchCancel={() => setScrollEnabled(true)}
              onMessage={(event) => {
                const placeId = event.nativeEvent.data;

                setSelectedPlaceId(placeId);
              }}
              source={{
                html: `
                  <!DOCTYPE html>

                  <html>
                    <head>
                      <meta
                        name="viewport"
                        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
                      />

                      <link
                        rel="stylesheet"
                        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                      />

                      <style>
                        html,
                        body,
                        #map {
                          height: 100%;
                          width: 100%;
                          margin: 0;
                          padding: 0;
                        }
                      </style>
                    </head>

                    <body>
                      <div id="map"></div>

                      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

                      <script>
                        const map = L.map('map').setView(
                          [-32.22477, -58.14261],
                          14
                        );

                        window.focusSelectedPlace = function(lat, lon) {
                          map.setView([lat, lon], 14);
                        };

                        L.tileLayer(
                          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                          {
                            attribution: '&copy; OpenStreetMap contributors'
                          }
                        ).addTo(map);

                        const lugares = ${JSON.stringify(
                  lugares.map((lugar) => ({
                    id: lugar.id,
                    nombre: lugar.nombre,
                    latitud: lugar.latitud,
                    longitud: lugar.longitud,
                  }))
                )};

                        lugares.forEach(function(lugar) {
                          const marcador = L.marker([
                            lugar.latitud,
                            lugar.longitud
                          ])
                            .addTo(map)
                            .bindPopup('<b>' + lugar.nombre + '</b>');

                          marcador.on('click', function() {
                            window.ReactNativeWebView.postMessage(
                              lugar.id
                            );
                          });
                        });
                      </script>
                    </body>
                  </html>
                `,
              }}
              style={styles.map}
            />
          </View>

          {/* Lugares cercanos */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedPlace.id === 'centro-colon'
                ? 'Lo que tenés cerca'
                : `Cerca de ${selectedPlace.nombre}`}
            </Text>

            <Pressable
              onPress={() => router.push('/lugares')}
            >
              <Text style={styles.seeMore}>
                Ver todos
              </Text>
            </Pressable>
          </View>

          {/* Cards */}
          <View style={styles.cardsContainer}>
            {lugaresCercanos.slice(0, 3).map((lugar) => (
              <Pressable
                key={lugar.id}
                style={styles.placeCard}
                onPress={() => {
                  setSelectedPlaceId(lugar.id);
                }}
              >
                <View style={styles.placeIcon}>
                  <Text style={styles.placeIconText}>
                    {lugar.icono}
                  </Text>
                </View>

                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>
                    {lugar.nombre}
                  </Text>

                  <Text style={styles.placeCategory}>
                    {lugar.categoria}
                  </Text>

                  <Text style={styles.placeDistance}>
                    {formatearDistancia(lugar.distancia)}
                  </Text>
                </View>

                {/* Flecha: abre el detalle */}
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/lugar-detalle',
                      params: {
                        id: lugar.id,
                      },
                    })
                  }
                  hitSlop={10}
                >
                  <Text style={styles.arrow}>
                    ›
                  </Text>
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