
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import * as Location from 'expo-location';

import { useCatalogo } from '@/servicios/CatalogoProvider';
import { useThemeContext } from '@/contexts/ThemeContext';

import ReproductorAudioguia from '@/components/ReproductorAudioguia';

import {
  obtenerAudioguiaActivaAPI,
  type AudioguiaActivaAPI,
} from '@/servicios/api';

import {
  obtenerSesion,
  obtenerUsuarioActual,
} from '@/servicios/autenticacion';

import type { Visita } from '@/servicios/visitas';
import { confirmarRegistroVisita } from '@/servicios/registro-visitas';

import {
  esFavorito,
  alternarFavorito,
} from '@/servicios/favoritos';

// --------------------------------------------------
// MODO DE PRUEBA
// --------------------------------------------------
//
// true  = simula que estamos en el lugar turístico.
// false = utiliza la ubicación GPS real del teléfono.
//
// Para la versión final debe quedar en false.
//

const MODO_PRUEBA_GPS = false;

export default function LugarDetalleScreen() {
  const router = useRouter();

  const { colors } = useThemeContext();

  const { id } = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const idLugar = Array.isArray(id) ? id[0] : id;

  // --------------------------------------------------
  // LUGARES LOCALES Y LUGARES DE LA API
  // --------------------------------------------------

  const {
    lugaresDisponibles,
    cargandoCatalogo: cargandoLugar,
  } = useCatalogo();

  const lugar = lugaresDisponibles.find(
    (item) => item.id === idLugar
  );

  console.log('DIAGNÓSTICO IMAGEN DEL DETALLE:', {
    idBuscado: idLugar,
    lugarEncontrado: lugar?.nombre,
    apiId: lugar?.apiId,
    imagen: lugar?.imagen,
    tipoImagen: typeof lugar?.imagen,
    tieneImagen: Boolean(lugar?.imagen),
  });

  const [audioguiaActiva, setAudioguiaActiva] =
    useState<AudioguiaActivaAPI | null>(null);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarAudioguiaActiva() {
      if (!lugar?.id) {
        setAudioguiaActiva(null);
        return;
      }

      setAudioguiaActiva(null);

      try {
        const audioguia =
          await obtenerAudioguiaActivaAPI(lugar.id);

        if (componenteActivo) {
          setAudioguiaActiva(audioguia);
        }
      } catch (error) {
        console.warn(
          'No se pudo consultar la audioguía activa:',
          error
        );
      }
    }

    cargarAudioguiaActiva();

    return () => {
      componenteActivo = false;
    };
  }, [lugar?.id]);

  const fuenteAudioguia =
    audioguiaActiva?.url || lugar?.audio || null;

  const transcripcionParaMostrar =
    audioguiaActiva?.transcripcion ||
    lugar?.transcripcion;

  const [mostrarTranscripcion, setMostrarTranscripcion] =
    useState(false);

  const [mostrarOpcionesVisita, setMostrarOpcionesVisita] =
    useState(false);

  // --------------------------------------------------
  // FAVORITOS
  // --------------------------------------------------

  const [favorito, setFavorito] = useState(false);

  const [cargandoFavorito, setCargandoFavorito] =
    useState(false);

  // --------------------------------------------------
  // COMPROBAR SI EL LUGAR ES FAVORITO
  // --------------------------------------------------

  useEffect(() => {
    let componenteActivo = true;

    const cargarEstadoFavorito = async () => {
      if (!lugar) {
        return;
      }

      try {
        const usuario = await obtenerUsuarioActual();

        if (!componenteActivo) return;

        if (!usuario) {
          setFavorito(false);
          return;
        }

        const resultado = await esFavorito(
          usuario.id,
          lugar.apiId ?? lugar.id
        );

        if (!componenteActivo) return;

        setFavorito(resultado);

        console.log('❤️ Estado favorito:', {
          lugarIdLocal: lugar.id,
          apiId: lugar.apiId,
          idEnviadoAPI: lugar.apiId ?? lugar.id,
          favorito: resultado,
        });
      } catch (error) {
        console.error(
          '❌ Error al comprobar favorito:',
          error
        );

        if (componenteActivo) {
          setFavorito(false);
        }
      }
    };

    cargarEstadoFavorito();

    return () => {
      componenteActivo = false;
    };
  }, [lugar?.id]);

  // --------------------------------------------------
  // ALTERNAR FAVORITO
  // --------------------------------------------------

  const manejarFavorito = async () => {
    if (!lugar) {
      return;
    }

    try {
      const sesion = await obtenerSesion();

      if (!sesion) {
        Alert.alert(
          'Necesitás iniciar sesión',
          'Para guardar lugares como favoritos necesitás tener una cuenta.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Iniciar sesión',
              onPress: () => router.push('/login'),
            },
          ]
        );

        return;
      }

      setCargandoFavorito(true);

      console.log('❤️ ENVIANDO FAVORITO:', {
        idLocal: lugar.id,
        apiId: lugar.apiId,
        idEnviadoAPI: lugar.apiId ?? lugar.id,
      });

      const nuevoEstado = await alternarFavorito(
        sesion.usuario.id,
        lugar.apiId ?? lugar.id
      );

      setFavorito(nuevoEstado);

      if (nuevoEstado) {
        Alert.alert(
          '¡Agregado a favoritos!',
          `${lugar.nombre} se guardó en tus favoritos.`
        );
      } else {
        Alert.alert(
          'Eliminado de favoritos',
          `${lugar.nombre} se eliminó de tus favoritos.`
        );
      }
    } catch (error) {
      console.error(
        '❌ Error al modificar favorito:',
        error
      );

      Alert.alert(
        'No se pudo actualizar el favorito',
        'Intentá nuevamente en unos segundos.'
      );
    } finally {
      setCargandoFavorito(false);
    }
  };

  // --------------------------------------------------
  // COMPROBAR SESIÓN ANTES DE REGISTRAR UNA VISITA
  // --------------------------------------------------

  const abrirRegistroDeVisita = async () => {
    try {
      const sesion = await obtenerSesion();

      if (!sesion) {
        Alert.alert(
          'Necesitás iniciar sesión',
          'Para registrar una visita necesitás tener una cuenta.',
          [
            {
              text: 'Cancelar',
              style: 'cancel',
            },
            {
              text: 'Iniciar sesión',
              onPress: () => router.push('/login'),
            },
          ]
        );

        return;
      }

      setMostrarOpcionesVisita(true);
    } catch (error) {
      console.error(
        '❌ Error al comprobar la sesión:',
        error
      );

      Alert.alert(
        'No se pudo comprobar la sesión',
        'Intentá nuevamente en unos segundos.'
      );
    }
  };

  // --------------------------------------------------
  // REGISTRO DE VISITA MEDIANTE GPS
  // --------------------------------------------------

  const registrarVisita = async () => {
    if (!lugar) return;

    try {
      // OBTENER USUARIO ACTUAL

      const usuario = await obtenerUsuarioActual();

      if (!usuario) {
        Alert.alert(
          'Necesitás iniciar sesión',
          'Para registrar una visita necesitás tener una cuenta.'
        );

        return;
      }

      // PEDIR PERMISO DE UBICACIÓN

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Ubicación necesaria',
          'Necesitamos acceder a tu ubicación para comprobar que estás en este lugar.'
        );

        return;
      }

      // OBTENER UBICACIÓN

      let latUsuario: number;
      let lonUsuario: number;

      if (MODO_PRUEBA_GPS) {
        // MODO DE PRUEBA

        latUsuario = lugar.latitud;
        lonUsuario = lugar.longitud;

        console.log('🧪 MODO PRUEBA GPS ACTIVADO');

        console.log('📍 Ubicación simulada:', {
          latitud: latUsuario,
          longitud: lonUsuario,
        });
      } else {
        // GPS REAL

        const ubicacion =
          await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

        latUsuario = ubicacion.coords.latitude;
        lonUsuario = ubicacion.coords.longitude;

        console.log('📍 GPS REAL:', {
          latitud: latUsuario,
          longitud: lonUsuario,
        });
      }

      // CALCULAR DISTANCIA

      const diferenciaLatitud =
        ((lugar.latitud - latUsuario) * Math.PI) / 180;

      const diferenciaLongitud =
        ((lugar.longitud - lonUsuario) * Math.PI) / 180;

      const radioTierra = 6371000;

      const a =
        Math.sin(diferenciaLatitud / 2) *
        Math.sin(diferenciaLatitud / 2) +
        Math.cos((latUsuario * Math.PI) / 180) *
        Math.cos((lugar.latitud * Math.PI) / 180) *
        Math.sin(diferenciaLongitud / 2) *
        Math.sin(diferenciaLongitud / 2);

      const c =
        2 *
        Math.atan2(
          Math.sqrt(a),
          Math.sqrt(1 - a)
        );

      const distanciaMetros = radioTierra * c;

      console.log('📍 UBICACIÓN USUARIO:', {
        latitud: latUsuario,
        longitud: lonUsuario,
      });

      console.log('📍 UBICACIÓN LUGAR:', {
        latitud: lugar.latitud,
        longitud: lugar.longitud,
      });

      console.log(
        '📏 DISTANCIA:',
        distanciaMetros,
        'metros'
      );

      // COMPROBAR DISTANCIA

      if (distanciaMetros > 100) {
        Alert.alert(
          'Estás demasiado lejos',
          `Para registrar la visita tenés que estar cerca de ${lugar.nombre}.`
        );

        return;
      }

      // CREAR VISITA

      const nuevaVisita: Visita = {
        id: `vis-${Date.now()}`,
        usuarioId: usuario.id,
        lugarId: lugar.id,
        fechaHora: new Date().toISOString(),
        origen: 'gps',
        fotoUri: null,
        nota: null,
        sincronizada: false,
      };

      // REGISTRAR O ACTUALIZAR VISITA

      confirmarRegistroVisita(
        nuevaVisita,
        lugar.nombre,
        (resultado) => {
          Alert.alert(
            resultado === 'actualizada'
              ? '¡Visita actualizada!'
              : '¡Visita registrada!',
            resultado === 'actualizada'
              ? `Se actualizó tu visita a ${lugar.nombre}.`
              : `Tu visita a ${lugar.nombre} fue registrada correctamente.`
          );
        }
      );
    } catch (error) {
      console.error(
        '❌ Error al registrar visita mediante GPS:',
        error
      );

      Alert.alert(
        'No se pudo registrar la visita',
        'Intentá nuevamente en unos segundos.'
      );
    }
  };


  // --------------------------------------------------
  // REGISTRO MANUAL DE VISITA
  // --------------------------------------------------

  const registrarVisitaManual = async () => {
    if (!lugar) return;

    try {
      const usuario = await obtenerUsuarioActual();

      if (!usuario) {
        Alert.alert(
          'Necesitás iniciar sesión',
          'Para registrar una visita necesitás tener una cuenta.'
        );

        return;
      }

      const nuevaVisita: Visita = {
        id: `vis-${Date.now()}`,
        usuarioId: usuario.id,
        lugarId: lugar.id,
        fechaHora: new Date().toISOString(),
        origen: 'manual',
        fotoUri: null,
        nota: null,
        sincronizada: false,
      };

      confirmarRegistroVisita(
        nuevaVisita,
        lugar.nombre,
        (resultado) => {
          Alert.alert(
            resultado === 'actualizada'
              ? '¡Visita actualizada!'
              : '¡Visita registrada!',
            resultado === 'actualizada'
              ? `Se actualizó tu visita a ${lugar.nombre}.`
              : `Tu visita a ${lugar.nombre} fue registrada correctamente.`
          );
        }
      );
    } catch (error) {
      console.error(
        'Error al registrar visita manualmente:',
        error
      );

      Alert.alert(
        'No se pudo registrar la visita',
        'Intentá nuevamente en unos segundos.'
      );
    }
  };


  // --------------------------------------------------
  // CÓMO LLEGAR
  // --------------------------------------------------

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

      const destino = encodeURIComponent(
        `${lugar.nombre}, ${lugar.direccion}, Colón, Entre Ríos, Argentina`
      );

      const url =
        `https://www.google.com/maps/dir/?api=1` +
        `&origin=${origenLat},${origenLon}` +
        `&destination=${destino}` +
        `&destination_place_id=` +
        `&travelmode=driving`;

      await Linking.openURL(url);
    } catch (error) {
      console.error('Error al abrir la ruta:', error);

      Alert.alert(
        'No se pudo obtener la ubicación',
        'Intentá nuevamente en unos segundos.'
      );
    }
  };

  // --------------------------------------------------
  // CONTACTO
  // --------------------------------------------------

  const llamar = () => {
    if (!lugar?.telefono) return;

    Linking.openURL(`tel:${lugar.telefono}`).catch(() => {
      Alert.alert(
        'No se pudo realizar la llamada',
        'Revisá el número de teléfono e intentá nuevamente.'
      );
    });
  };

  const abrirWeb = () => {
    if (!lugar?.web) return;

    Linking.openURL(lugar.web).catch(() => {
      Alert.alert(
        'No se pudo abrir el sitio web',
        'Intentá nuevamente en unos segundos.'
      );
    });
  };

  // --------------------------------------------------
  // ESTILOS SEGÚN EL TEMA
  // --------------------------------------------------

  const styles = StyleSheet.create({
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

    // Encabezado

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
      backgroundColor: colors.backgroundSelected,
      justifyContent: 'center',
      alignItems: 'center',
    },

    backIcon: {
      fontSize: 32,
      color: colors.text,
      lineHeight: 36,
    },

    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },

    // Favoritos

    favoriteButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },

    favoriteButtonActive: {
      backgroundColor: colors.successBackground,
      borderColor: colors.success,
    },

    favoriteIcon: {
      fontSize: 27,
      color: colors.primary,
    },

    favoriteIconActive: {
      color: colors.success,
    },

    // Imagen principal

    hero: {
      height: 190,
      borderRadius: 24,
      backgroundColor: colors.backgroundSelected,
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

    // Categoría

    categoryBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.successBackground,
      borderRadius: 20,
      paddingHorizontal: 13,
      paddingVertical: 7,
      marginTop: 18,
    },

    categoryText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.success,
    },

    // Título y descripción

    title: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      marginTop: 10,
    },

    description: {
      fontSize: 15,
      lineHeight: 23,
      color: colors.textSecondary,
      marginTop: 10,
    },

    // Información

    infoCard: {
      backgroundColor: colors.backgroundElement,
      borderRadius: 18,
      padding: 16,
      marginTop: 20,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },

    infoValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
      marginTop: 2,
    },

    separator: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 13,
    },

    // Acciones

    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 18,
    },

    primaryButton: {
      flex: 1,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },

    primaryButtonIcon: {
      fontSize: 18,
    },

    primaryButtonText: {
      color: colors.onPrimary,
      fontSize: 14,
      fontWeight: '800',
    },

    secondaryButton: {
      flex: 1,
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.successBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },

    secondaryButtonIcon: {
      fontSize: 18,
    },

    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },

    // Transcripción

    transcriptionButton: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    transcriptionButtonIcon: {
      fontSize: 18,
    },

    transcriptionButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },

    transcriptionCard: {
      backgroundColor: colors.backgroundElement,
      borderRadius: 18,
      padding: 18,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    transcriptionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
    },

    transcriptionText: {
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },

    // Registrar visita

    visitButton: {
      height: 54,
      borderRadius: 16,
      backgroundColor: colors.primary,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    visitButtonIcon: {
      color: colors.onPrimary,
      fontSize: 20,
      fontWeight: '800',
    },

    visitButtonText: {
      color: colors.onPrimary,
      fontSize: 15,
      fontWeight: '800',
    },

    // Modal

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      justifyContent: 'flex-end',
    },

    modalCard: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 22,
      paddingBottom: 30,
    },

    modalTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
    },

    modalSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 5,
      marginBottom: 18,
    },

    visitOption: {
      backgroundColor: colors.backgroundElement,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 15,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
    },

    visitOptionIcon: {
      fontSize: 28,
      width: 48,
      textAlign: 'center',
    },

    visitOptionContent: {
      flex: 1,
      marginLeft: 10,
    },

    visitOptionTitle: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },

    visitOptionText: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textSecondary,
      marginTop: 3,
    },

    modalCancelButton: {
      height: 50,
      borderRadius: 15,
      backgroundColor: colors.backgroundSelected,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4,
    },

    modalCancelText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },

    // Contacto

    contactButton: {
      minHeight: 62,
      borderRadius: 16,
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },

    contactButtonText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '700',
      marginTop: 2,
    },

    // Cargando

    loadingText: {
      fontSize: 15,
      color: colors.textSecondary,
      marginTop: 14,
      textAlign: 'center',
    },

    // Error

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
      color: colors.text,
      marginTop: 15,
    },

    errorText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },

    backButtonLarge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 25,
      paddingVertical: 13,
      borderRadius: 14,
      marginTop: 20,
    },

    backButtonText: {
      color: colors.onPrimary,
      fontWeight: '800',
      fontSize: 14,
    },
  });

  // --------------------------------------------------
  // CARGANDO LUGAR
  // --------------------------------------------------

  if (!lugar && cargandoLugar) {
    return (
      <View style={styles.screen}>
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />

            <Text style={styles.loadingText}>
              Cargando información del lugar...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // --------------------------------------------------
  // LUGAR NO ENCONTRADO
  // --------------------------------------------------

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

  // --------------------------------------------------
  // DETALLE DEL LUGAR
  // --------------------------------------------------

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Encabezado */}

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

            <Pressable
              style={[
                styles.favoriteButton,
                favorito && styles.favoriteButtonActive,
              ]}
              onPress={manejarFavorito}
              disabled={cargandoFavorito}
            >
              <Text
                style={[
                  styles.favoriteIcon,
                  favorito && styles.favoriteIconActive,
                ]}
              >
                {favorito ? '♥' : '♡'}
              </Text>
            </Pressable>
          </View>

          {/* Imagen principal */}

          <View style={styles.hero}>
            {lugar.imagen ? (
              <Image
                source={lugar.imagen}
                style={styles.heroImage}
                resizeMode="cover"
                onLoad={() => {
                  console.log('IMAGEN DEL DETALLE CARGADA:', {
                    lugar: lugar.nombre,
                    imagen: lugar.imagen,
                  });
                }}
                onError={(evento) => {
                  console.error('ERROR AL CARGAR IMAGEN DEL DETALLE:', {
                    lugar: lugar.nombre,
                    imagen: lugar.imagen,
                    error: evento.nativeEvent.error,
                  });
                }}
              />
            ) : (
              <Text style={styles.heroIcon}>
                {lugar.icono}
              </Text>
            )}
          </View>

          {/* Categoría */}

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {lugar.categoria}
            </Text>
          </View>

          {/* Título */}

          <Text style={styles.title}>
            {lugar.nombre}
          </Text>

          {/* Descripción */}

          <Text style={styles.description}>
            {lugar.descripcion}
          </Text>

          {/* Información */}

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

          {/* Acciones */}

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

            {!fuenteAudioguia && (
              <Pressable
                style={styles.secondaryButton}
                onPress={() =>
                  Alert.alert(
                    'Audioguía no disponible',
                    'La audioguía de este lugar todavía no está disponible.',
                  )
                }
              >
                <Text style={styles.secondaryButtonIcon}>🎧</Text>

                <Text style={styles.secondaryButtonText}>
                  Sin audioguía
                </Text>
              </Pressable>
            )}
          </View>

          {fuenteAudioguia && (
            <ReproductorAudioguia
              key={lugar.id}
              fuente={fuenteAudioguia}
              lugarId={lugar.id}
              nombre={lugar.nombre}
            />
          )}

          {/* Transcripción */}

          {transcripcionParaMostrar && (
            <>
              <Pressable
                style={styles.transcriptionButton}
                onPress={() =>
                  setMostrarTranscripcion(!mostrarTranscripcion)
                }
              >
                <Text style={styles.transcriptionButtonIcon}>
                  📄
                </Text>

                <Text style={styles.transcriptionButtonText}>
                  {mostrarTranscripcion
                    ? 'Ocultar transcripción'
                    : 'Ver transcripción'}
                </Text>
              </Pressable>

              {mostrarTranscripcion && (
                <View style={styles.transcriptionCard}>
                  <Text style={styles.transcriptionTitle}>
                    Transcripción de la audioguía
                  </Text>

                  <Text style={styles.transcriptionText}>
                    {transcripcionParaMostrar}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Registrar visita */}

          <Pressable
            style={styles.visitButton}
            onPress={abrirRegistroDeVisita}
          >
            <Text style={styles.visitButtonIcon}>
              📍
            </Text>

            <Text style={styles.visitButtonText}>
              Registrar visita
            </Text>
          </Pressable>

          {/* Selector de método de visita */}

          <Modal
            visible={mostrarOpcionesVisita}
            transparent
            animationType="slide"
            onRequestClose={() => setMostrarOpcionesVisita(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>
                  Registrar visita
                </Text>

                <Text style={styles.modalSubtitle}>
                  ¿Cómo querés registrar tu visita?
                </Text>

                {/* QR */}

                <Pressable
                  style={styles.visitOption}
                  onPress={() => {
                    setMostrarOpcionesVisita(false);

                    router.push({
                      pathname: '/escanear-qr',
                      params: {
                        lugarId: lugar.id,
                      },
                    });
                  }}
                >
                  <Text style={styles.visitOptionIcon}>
                    📷
                  </Text>

                  <View style={styles.visitOptionContent}>
                    <Text style={styles.visitOptionTitle}>
                      Escanear código QR
                    </Text>

                    <Text style={styles.visitOptionText}>
                      Escaneá el código que se encuentra en el lugar.
                    </Text>
                  </View>
                </Pressable>

                {/* GPS */}

                <Pressable
                  style={styles.visitOption}
                  onPress={() => {
                    setMostrarOpcionesVisita(false);
                    registrarVisita();
                  }}
                >
                  <Text style={styles.visitOptionIcon}>
                    📍
                  </Text>

                  <View style={styles.visitOptionContent}>
                    <Text style={styles.visitOptionTitle}>
                      Estoy en este lugar
                    </Text>

                    <Text style={styles.visitOptionText}>
                      Comprobar tu ubicación mediante GPS.
                    </Text>
                  </View>
                </Pressable>


                {/* Manual */}

                <Pressable
                  style={styles.visitOption}
                  onPress={() => {
                    setMostrarOpcionesVisita(false);
                    registrarVisitaManual();
                  }}
                >
                  <Text style={styles.visitOptionIcon}>
                    ✏️
                  </Text>

                  <View style={styles.visitOptionContent}>
                    <Text style={styles.visitOptionTitle}>
                      Registrar manualmente
                    </Text>

                    <Text style={styles.visitOptionText}>
                      Registrá tu visita sin utilizar la ubicación GPS.
                    </Text>
                  </View>
                </Pressable>

                {/* Cancelar */}

                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setMostrarOpcionesVisita(false)}
                >
                  <Text style={styles.modalCancelText}>
                    Cancelar
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          {/* Teléfono */}

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

          {/* Sitio web */}

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