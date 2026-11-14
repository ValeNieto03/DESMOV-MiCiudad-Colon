
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import WebView, {
  type WebViewProps,
  type WebViewMessageEvent,
} from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { lugares } from '@/data/lugares';
import { useCatalogo } from '@/servicios/CatalogoProvider';
import { useThemeContext } from '@/contexts/ThemeContext';

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

const REGION_INICIAL = {
  latitude: -32.22477,
  longitude: -58.14261,
};

export default function HomeScreen() {
  const router = useRouter();
  const mapRef = useRef<WebView<WebViewProps> | null>(null);

  const { colors } = useThemeContext();

  const [selectedPlaceId, setSelectedPlaceId] =
    useState('centro-colon');

  const [mapaListo, setMapaListo] = useState(false);

  const { lugaresDisponibles } = useCatalogo();

  const selectedPlace =
    lugaresDisponibles.find(
      (lugar) => lugar.id === selectedPlaceId
    ) ?? lugaresDisponibles[0] ?? lugares[0];

  const lugaresCercanos = useMemo(() => {
    if (!selectedPlace) {
      return [];
    }

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

  // Datos que se envían al mapa.
  const lugaresParaMapa = useMemo(() => {
    return JSON.stringify(
      lugaresDisponibles.map((lugar) => ({
        id: lugar.id,
        nombre: lugar.nombre,
        categoria: lugar.categoria,
        latitud: lugar.latitud,
        longitud: lugar.longitud,
      }))
    ).replace(/</g, '\\u003c');
  }, [lugaresDisponibles]);

  // Mapa Leaflet con OpenStreetMap.
  const mapaHTML = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0"
          />

          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          />

          <style>
            * {
              box-sizing: border-box;
            }

            html, body, #map {
              width: 100%;
              height: 100%;
              margin: 0;
              padding: 0;
            }

            body {
              overflow: hidden;
              background: ${colors.background};
            }

            .marcador {
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: ${colors.success};
              border: 3px solid ${colors.backgroundElement};
              box-shadow: 0 2px 6px rgba(0,0,0,0.35);
              transition: all 0.2s ease;
            }

            .marcador.seleccionado {
              width: 30px;
              height: 30px;
              border-radius: 50%;
              background: ${colors.primary};
              border: 4px solid ${colors.backgroundElement};
              box-shadow: 0 3px 9px rgba(0,0,0,0.45);
            }

            .marcador.seleccionado::after {
              content: '';
              display: block;
              width: 6px;
              height: 6px;
              background: ${colors.backgroundElement};
              border-radius: 50%;
              margin: 8px auto;
            }

            .leaflet-popup-content-wrapper {
              border-radius: 12px;
              background: ${colors.backgroundElement};
              color: ${colors.text};
            }

            .leaflet-popup-tip {
              background: ${colors.backgroundElement};
            }

            .leaflet-popup-content {
              font-family: Arial, sans-serif;
              font-size: 13px;
              color: ${colors.text};
            }
          </style>
        </head>

        <body>
          <div id="map"></div>

          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

          <script>
            const lugares = ${lugaresParaMapa};

            const centroInicial = [
              ${REGION_INICIAL.latitude},
              ${REGION_INICIAL.longitude}
            ];

            const mapa = L.map('map', {
              zoomControl: true,
              attributionControl: true
            }).setView(centroInicial, 15);

            L.tileLayer(
              'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
              {
                maxZoom: 19,
                attribution: '&copy; OpenStreetMap'
              }
            ).addTo(mapa);

            const marcadores = {};

            function crearIcono(seleccionado) {
              return L.divIcon({
                className: '',
                html: seleccionado
                  ? '<div class="marcador seleccionado"></div>'
                  : '<div class="marcador"></div>',
                iconSize: seleccionado ? [30, 30] : [22, 22],
                iconAnchor: seleccionado ? [15, 15] : [11, 11]
              });
            }

            lugares.forEach((lugar) => {
              const marcador = L.marker(
                [lugar.latitud, lugar.longitud],
                {
                  icon: crearIcono(false)
                }
              ).addTo(mapa);

              marcador.bindPopup(
                '<strong>' + lugar.nombre + '</strong><br>' +
                lugar.categoria
              );

              marcador.on('click', () => {
                window.ReactNativeWebView.postMessage(lugar.id);
              });

              marcadores[lugar.id] = marcador;
            });

            window.focusSelectedPlace = function(id, latitud, longitud) {
              Object.keys(marcadores).forEach((marcadorId) => {
                const seleccionado = marcadorId === id;

                marcadores[marcadorId].setIcon(
                  crearIcono(seleccionado)
                );

                marcadores[marcadorId].setZIndexOffset(
                  seleccionado ? 1000 : 0
                );
              });

              mapa.flyTo([latitud, longitud], 16, {
                animate: true,
                duration: 0.5
              });
            };

            window.ReactNativeWebView.postMessage('MAPA_LISTO');
          </script>
        </body>
      </html>
    `;
  }, [lugaresParaMapa, colors]);

  // Centrar el mapa y destacar el marcador seleccionado.
  useEffect(() => {
    if (!mapaListo || !selectedPlace) {
      return;
    }

    const javascript = `
      if (window.focusSelectedPlace) {
        window.focusSelectedPlace(
          ${JSON.stringify(selectedPlace.id)},
          ${selectedPlace.latitud},
          ${selectedPlace.longitud}
        );
      }

      true;
    `;

    mapRef.current?.injectJavaScript(javascript);
  }, [selectedPlace, mapaListo]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.background,
        },

        container: {
          flex: 1,
          backgroundColor: colors.background,
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
          color: colors.primary,
          letterSpacing: 1.5,
        },

        title: {
          fontSize: 34,
          fontWeight: '800',
          color: colors.text,
          marginTop: 2,
        },

        subtitle: {
          fontSize: 14,
          color: colors.textSecondary,
          marginTop: 2,
        },

        profileButton: {
          width: 46,
          height: 46,
          borderRadius: 23,
          backgroundColor: colors.backgroundSelected,
          justifyContent: 'center',
          alignItems: 'center',
        },

        profileIcon: {
          fontSize: 21,
        },

        search: {
          height: 52,
          backgroundColor: colors.inputBackground,
          borderRadius: 16,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: colors.inputBorder,
        },

        searchIcon: {
          fontSize: 28,
          color: colors.primary,
          marginRight: 10,
        },

        searchText: {
          fontSize: 15,
          color: colors.textSecondary,
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
          color: colors.text,
        },

        seeMore: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary,
        },

        cardsContainer: {
          paddingBottom: 30,
        },

        placeCard: {
          backgroundColor: colors.backgroundElement,
          borderRadius: 16,
          padding: 12,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        },

        placeIcon: {
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: colors.successBackground,
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
          color: colors.text,
        },

        placeCategory: {
          fontSize: 12,
          color: colors.textSecondary,
          marginTop: 2,
        },

        placeDistance: {
          fontSize: 12,
          color: colors.success,
          fontWeight: '600',
          marginTop: 3,
        },

        arrow: {
          fontSize: 28,
          color: colors.primary,
          paddingHorizontal: 5,
        },
      }),
    [colors]
  );

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
        >
          {/* Encabezado */}
          <View style={styles.header}>
            <View>
              <Text style={styles.smallTitle}>
                GUÍA TURÍSTICA
              </Text>

              <Text style={styles.title}>Colón</Text>

              <Text style={styles.subtitle}>
                Descubrí todo lo que esta ciudad tiene para vos
              </Text>
            </View>

            <Pressable
              style={styles.profileButton}
              onPress={() => router.push('/yo')}
            >
              <Text style={styles.profileIcon}>👤</Text>
            </Pressable>
          </View>

          {/* Buscador */}
          <Pressable
            style={styles.search}
            onPress={() => router.push('/lugares')}
          >
            <Text style={styles.searchIcon}>⌕</Text>

            <Text style={styles.searchText}>
              ¿Qué querés conocer?
            </Text>
          </Pressable>

          {/* Mapa OpenStreetMap */}
          <View style={styles.mapCard}>
            <WebView
              ref={mapRef}
              source={{ html: mapaHTML }}
              originWhitelist={['*']}
              javaScriptEnabled
              domStorageEnabled
              nestedScrollEnabled
              scrollEnabled={true}
              onLoadEnd={() => setMapaListo(true)}
              onMessage={(event: WebViewMessageEvent) => {
                const mensaje = event.nativeEvent.data;

                if (mensaje === 'MAPA_LISTO') {
                  setMapaListo(true);
                  return;
                }

                const lugarExiste = lugaresDisponibles.some(
                  (lugar) => lugar.id === mensaje
                );

                if (lugarExiste) {
                  setSelectedPlaceId(mensaje);
                }
              }}
              style={styles.map}
            />
          </View>

          {/* Lugares cercanos */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedPlace?.id === 'centro-colon'
                ? 'Lo que tenés cerca'
                : `Cerca de ${selectedPlace?.nombre}`}
            </Text>

            <Pressable
              onPress={() => router.push('/lugares')}
            >
              <Text style={styles.seeMore}>Ver todos</Text>
            </Pressable>
          </View>

          {/* Tarjetas */}
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

                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/lugar-detalle',
                      params: { id: lugar.id },
                    })
                  }
                  hitSlop={10}
                >
                  <Text style={styles.arrow}>›</Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
