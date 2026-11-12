import { useThemedStyles } from "@/hooks/use-theme";
import { useThemeContext } from '@/contexts/theme-context';
import { confirmarVisitaGuardada } from '@/servicios/confirmacion-visita';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
} from 'expo-router';
import { lugares } from '@/data/lugares';
import type { Place } from '@/data/lugares';
import { obtenerLugaresIntegrados } from '@/servicios/lugares-integrados';
import {
  obtenerAudioguiaActivaAPI,
  type AudioguiaActivaAPI,
} from '@/servicios/api';
import * as Location from 'expo-location';
import {
  useAudioPlayer,
  useAudioPlayerStatus,

} from 'expo-audio';

import {
  obtenerSesion,
  obtenerUsuarioActual,
} from '@/servicios/autenticacion';

import {
  guardarVisita,
  Visita,
} from '@/servicios/visitas';

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

const MODO_PRUEBA_GPS = true;

export default function LugarDetalleScreen() {
  const themedStyles = useThemedStyles(styles);
  const { colors } = useThemeContext();
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id?: string | string[];
  }>();

  const idLugar = Array.isArray(id) ? id[0] : id;

  // --------------------------------------------------
  // LUGARES LOCALES Y LUGARES DE LA API
  // --------------------------------------------------

  const [lugaresDisponibles, setLugaresDisponibles] =
    useState<Place[]>(lugares);

  const [cargandoLugar, setCargandoLugar] =
    useState(true);

  useEffect(() => {
    let componenteActivo = true;

    async function cargarLugares() {
      try {
        const lugaresIntegrados =
          await obtenerLugaresIntegrados();

        if (componenteActivo) {
          setLugaresDisponibles(lugaresIntegrados);
        }
      } catch (error) {
        console.warn(
          'No se pudieron cargar los lugares integrados:',
          error
        );
      } finally {
        if (componenteActivo) {
          setCargandoLugar(false);
        }
      }
    }

    cargarLugares();

    return () => {
      componenteActivo = false;
    };
  }, []);

  const lugar = lugaresDisponibles.find(
    (item) => item.id === idLugar
  );

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

  const audioParaReproducir = audioguiaActiva?.url
    ? { uri: audioguiaActiva.url }
    : lugar?.audio;

  const transcripcionParaMostrar =
    audioguiaActiva?.transcripcion ||
    lugar?.transcripcion;

  const [mostrarTranscripcion, setMostrarTranscripcion] =
    useState(false);

  const [visitaRegistrada, setVisitaRegistrada] =
    useState(false);

  const [mostrarOpcionesVisita, setMostrarOpcionesVisita] =
    useState(false);
  const [mostrarFormularioVisita, setMostrarFormularioVisita] =
    useState(false);
  const [notaVisita, setNotaVisita] = useState('');
  const [fotoVisita, setFotoVisita] = useState<string | null>(null);
  const [guardandoVisitaManual, setGuardandoVisitaManual] =
    useState(false);

  // --------------------------------------------------
  // FAVORITOS
  // --------------------------------------------------

  const [favorito, setFavorito] = useState(false);

  const [cargandoFavorito, setCargandoFavorito] =
    useState(false);

  const player = useAudioPlayer(lugar?.audio);

  const audioStatus = useAudioPlayerStatus(player);

  // --------------------------------------------------
  // DETENER AUDIO AL SALIR DE LA PANTALLA
  // --------------------------------------------------

  useFocusEffect(
    useCallback(() => {
      return () => {
        player.pause();

        console.log(
          'Audioguía pausada al salir del detalle:',
          lugar?.id
        );
      };
    }, [player, lugar?.id])
  );

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
          lugarId: lugar.id,
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
  // AUDIO
  // --------------------------------------------------




  const alternarAudio = async () => {
    if (!audioParaReproducir) {
      Alert.alert(
        'Audioguía no disponible',
        'La audioguía de este lugar todavía no está disponible.'
      );
      return;
    }

    try {
      if (audioStatus.playing) {
        player.pause();
        return;
      }

      await player.replace(audioParaReproducir);
      player.play();

      console.log('ID DEL LUGAR:', lugar?.id);
      console.log(
        'AUDIO REPRODUCIDO:',
        JSON.stringify(audioParaReproducir)
      );
    } catch (error) {
      console.error(
        'Error al reproducir la audioguía:',
        error
      );

      Alert.alert(
        'Error de reproducción',
        'No se pudo cargar la audioguía. Intentá nuevamente.'
      );
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

      if (visitaRegistrada) {
        Alert.alert(
          'Visita ya registrada',
          'Ya registraste tu visita a este lugar.'
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
  // REGISTRO MANUAL DE VISITA
  // --------------------------------------------------

  const tomarFotoVisita = async () => {
    try {
      const permiso = await ImagePicker.requestCameraPermissionsAsync();

      if (!permiso.granted) {
        Alert.alert(
          'Permiso de cámara necesario',
          'Permití el acceso a la cámara para adjuntar una foto a la visita.'
        );
        return;
      }

      const resultado = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!resultado.canceled && resultado.assets[0]) {
        setFotoVisita(resultado.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al tomar la foto de la visita:', error);
      Alert.alert('No se pudo abrir la cámara', 'Intentá nuevamente.');
    }
  };

  const guardarFotoEnElTelefono = async (
    uriTemporal: string,
    idVisita: string
  ) => {
    const directorio = new Directory(Paths.document, 'visitas');

    if (!directorio.exists) {
      directorio.create({ intermediates: true });
    }

    const fotoTemporal = new File(uriTemporal);
    const fotoPermanente = new File(directorio, `${idVisita}.jpg`);

    await fotoTemporal.copy(fotoPermanente, { overwrite: true });

    return fotoPermanente.uri;
  };

  const registrarVisitaManual = async () => {
    if (!lugar) return;

    if (visitaRegistrada) {
      Alert.alert(
        'Visita ya registrada',
        'Ya registraste tu visita a este lugar.'
      );

      return;
    }

    try {
      setGuardandoVisitaManual(true);
      const usuario = await obtenerUsuarioActual();

      if (!usuario) {
        Alert.alert(
          'Necesitás iniciar sesión',
          'Para guardar una visita en tu recorrido necesitás iniciar sesión.'
        );

        return;
      }

      const idVisita = `vis-${Date.now()}`;
      const fotoUriGuardada = fotoVisita
        ? await guardarFotoEnElTelefono(fotoVisita, idVisita)
        : null;

      const nuevaVisita: Visita = {
        id: idVisita,
        usuarioId: usuario.id,
        lugarId: lugar.id,
        fechaHora: new Date().toISOString(),
        origen: 'manual',
        fotoUri: fotoUriGuardada,
        nota: notaVisita.trim() || null,
        sincronizada: false,
      };

      await guardarVisita(nuevaVisita);
      void confirmarVisitaGuardada();
      setVisitaRegistrada(true);
      setMostrarFormularioVisita(false);

      Alert.alert(
        'Visita agregada',
        `Registraste manualmente tu visita a ${lugar.nombre}.`
      );
    } catch (error) {
      console.error('Error al guardar la visita manual:', error);
      Alert.alert(
        'No se pudo guardar la visita',
        'Intentá nuevamente en unos segundos.'
      );
    } finally {
      setGuardandoVisitaManual(false);
    }
  };

  // --------------------------------------------------
  // REGISTRO DE VISITA MEDIANTE GPS
  // --------------------------------------------------

  const registrarVisita = async () => {
    if (!lugar) return;

    if (visitaRegistrada) {
      Alert.alert(
        'Visita ya registrada',
        'Ya registraste tu visita a este lugar.'
      );

      return;
    }

    try {
      // ----------------------------------------------
      // OBTENER USUARIO ACTUAL
      // ----------------------------------------------

      const usuario = await obtenerUsuarioActual();

      if (!usuario) {
        Alert.alert(
          'Necesitás iniciar sesión',
          'Para registrar una visita necesitás tener una cuenta.'
        );

        return;
      }

      // ----------------------------------------------
      // PEDIR PERMISO DE UBICACIÓN
      // ----------------------------------------------

      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Ubicación necesaria',
          'Necesitamos acceder a tu ubicación para comprobar que estás en este lugar.'
        );

        return;
      }

      // ----------------------------------------------
      // OBTENER UBICACIÓN
      // ----------------------------------------------

      let latUsuario: number;
      let lonUsuario: number;

      if (MODO_PRUEBA_GPS) {
        // --------------------------------------------
        // MODO DE PRUEBA
        // --------------------------------------------

        latUsuario = lugar.latitud;
        lonUsuario = lugar.longitud;

        console.log('🧪 MODO PRUEBA GPS ACTIVADO');

        console.log('📍 Ubicación simulada:', {
          latitud: latUsuario,
          longitud: lonUsuario,
        });
      } else {
        // --------------------------------------------
        // GPS REAL
        // --------------------------------------------

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

      // ----------------------------------------------
      // CALCULAR DISTANCIA
      // ----------------------------------------------

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

      // ----------------------------------------------
      // COMPROBAR DISTANCIA
      // ----------------------------------------------

      if (distanciaMetros > 100) {
        Alert.alert(
          'Estás demasiado lejos',
          `Para registrar la visita tenés que estar cerca de ${lugar.nombre}.`
        );

        return;
      }

      // ----------------------------------------------
      // CREAR VISITA
      // ----------------------------------------------

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

      // ----------------------------------------------
      // GUARDAR EN SQLITE
      // ----------------------------------------------

      await guardarVisita(nuevaVisita);
      void confirmarVisitaGuardada();

      console.log(
        '✅ VISITA GPS GUARDADA:',
        nuevaVisita
      );

      setVisitaRegistrada(true);

      Alert.alert(
        '¡Visita registrada!',
        `Tu visita a ${lugar.nombre} fue registrada correctamente.`
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
  // CARGANDO LUGAR
  // --------------------------------------------------

  if (!lugar && cargandoLugar) {
    return (
      <View style={themedStyles.screen}>
        <SafeAreaView style={themedStyles.container}>
          <View style={themedStyles.errorContainer}>
            <ActivityIndicator
              size="large"
              color="#2F7F8F"
            />

            <Text style={themedStyles.loadingText}>
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
      <View style={themedStyles.screen}>
        <SafeAreaView style={themedStyles.container}>
          <View style={themedStyles.errorContainer}>
            <Text style={themedStyles.errorIcon}>📍</Text>

            <Text style={themedStyles.errorTitle}>
              Lugar no encontrado
            </Text>

            <Text style={themedStyles.errorText}>
              No pudimos encontrar la información de este lugar.
            </Text>

            <Pressable
              style={themedStyles.backButtonLarge}
              onPress={() => router.back()}
            >
              <Text style={themedStyles.backButtonText}>
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
    <View style={themedStyles.screen}>
      <SafeAreaView style={themedStyles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={themedStyles.scrollContent}
        >
          {/* Encabezado */}

          <View style={themedStyles.header}>
            <Pressable
              style={themedStyles.backButton}
              onPress={() => router.back()}
            >
              <Text style={themedStyles.backIcon}>‹</Text>
            </Pressable>

            <Text style={themedStyles.headerTitle}>
              Detalle
            </Text>

            <Pressable
              style={[
                themedStyles.favoriteButton,
                favorito && themedStyles.favoriteButtonActive,
              ]}
              onPress={manejarFavorito}
              disabled={cargandoFavorito}
            >
              <Text
                style={[
                  themedStyles.favoriteIcon,
                  favorito && themedStyles.favoriteIconActive,
                ]}
              >
                {favorito ? '♥' : '♡'}
              </Text>
            </Pressable>
          </View>

          {/* Imagen principal */}

          <View style={themedStyles.hero}>
            {lugar.imagen ? (
              <Image
                source={lugar.imagen}
                style={themedStyles.heroImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={themedStyles.heroIcon}>
                {lugar.icono}
              </Text>
            )}
          </View>

          {/* Categoría */}

          <View style={themedStyles.categoryBadge}>
            <Text style={themedStyles.categoryText}>
              {lugar.categoria}
            </Text>
          </View>

          {/* Título */}

          <Text style={themedStyles.title}>
            {lugar.nombre}
          </Text>

          {/* Descripción */}

          <Text style={themedStyles.description}>
            {lugar.descripcion}
          </Text>

          {/* Información */}

          <View style={themedStyles.infoCard}>
            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoIcon}>📍</Text>

              <View style={themedStyles.infoContent}>
                <Text style={themedStyles.infoLabel}>
                  Dirección
                </Text>

                <Text style={themedStyles.infoValue}>
                  {lugar.direccion}
                </Text>
              </View>
            </View>

            <View style={themedStyles.separator} />

            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoIcon}>🕐</Text>

              <View style={themedStyles.infoContent}>
                <Text style={themedStyles.infoLabel}>
                  Horarios
                </Text>

                <Text style={themedStyles.infoValue}>
                  {lugar.horario}
                </Text>
              </View>
            </View>

            <View style={themedStyles.separator} />

            <View style={themedStyles.infoRow}>
              <Text style={themedStyles.infoIcon}>💰</Text>

              <View style={themedStyles.infoContent}>
                <Text style={themedStyles.infoLabel}>
                  Entrada
                </Text>

                <Text style={themedStyles.infoValue}>
                  {lugar.precio}
                </Text>
              </View>
            </View>
          </View>

          {/* Acciones */}

          <View style={themedStyles.actions}>
            <Pressable
              style={themedStyles.primaryButton}
              onPress={abrirRuta}
            >
              <Text style={themedStyles.primaryButtonIcon}>
                🧭
              </Text>

              <Text style={themedStyles.primaryButtonText}>
                Cómo llegar
              </Text>
            </Pressable>

            <Pressable
              style={themedStyles.secondaryButton}
              onPress={alternarAudio}
            >
              <Text style={themedStyles.secondaryButtonIcon}>
                {audioStatus.playing ? '⏸️' : '🎧'}
              </Text>

              <Text style={themedStyles.secondaryButtonText}>
                {audioStatus.playing ? 'Pausar' : 'Audioguía'}
              </Text>
            </Pressable>
          </View>

          {/* Transcripción */}

          {transcripcionParaMostrar && (
            <>
              <Pressable
                style={themedStyles.transcriptionButton}
                onPress={() =>
                  setMostrarTranscripcion(!mostrarTranscripcion)
                }
              >
                <Text style={themedStyles.transcriptionButtonIcon}>
                  📄
                </Text>

                <Text style={themedStyles.transcriptionButtonText}>
                  {mostrarTranscripcion
                    ? 'Ocultar transcripción'
                    : 'Ver transcripción'}
                </Text>
              </Pressable>

              {mostrarTranscripcion && (
                <View style={themedStyles.transcriptionCard}>
                  <Text style={themedStyles.transcriptionTitle}>
                    Transcripción de la audioguía
                  </Text>

                  <Text style={themedStyles.transcriptionText}>
                    {transcripcionParaMostrar}
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Registrar visita */}

          <Pressable
            style={themedStyles.visitButton}
            onPress={abrirRegistroDeVisita}
          >
            <Text style={themedStyles.visitButtonIcon}>
              {visitaRegistrada ? '✓' : '📍'}
            </Text>

            <Text style={themedStyles.visitButtonText}>
              {visitaRegistrada
                ? 'Visita registrada'
                : 'Registrar visita'}
            </Text>
          </Pressable>

          {/* Selector de método de visita */}

          <Modal
            visible={mostrarOpcionesVisita}
            transparent
            animationType="slide"
            onRequestClose={() => setMostrarOpcionesVisita(false)}
          >
            <View style={themedStyles.modalOverlay}>
              <View style={themedStyles.modalCard}>
                <Text style={themedStyles.modalTitle}>
                  Registrar visita
                </Text>

                <Text style={themedStyles.modalSubtitle}>
                  ¿Cómo querés registrar tu visita?
                </Text>

                {/* QR */}

                <Pressable
                  style={themedStyles.visitOption}
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
                  <Text style={themedStyles.visitOptionIcon}>
                    📷
                  </Text>

                  <View style={themedStyles.visitOptionContent}>
                    <Text style={themedStyles.visitOptionTitle}>
                      Escanear código QR
                    </Text>

                    <Text style={themedStyles.visitOptionText}>
                      Escaneá el código que se encuentra en el lugar.
                    </Text>
                  </View>
                </Pressable>

                {/* GPS */}

                <Pressable
                  style={themedStyles.visitOption}
                  onPress={() => {
                    setMostrarOpcionesVisita(false);
                    registrarVisita();
                  }}
                >
                  <Text style={themedStyles.visitOptionIcon}>
                    📍
                  </Text>

                  <View style={themedStyles.visitOptionContent}>
                    <Text style={themedStyles.visitOptionTitle}>
                      Estoy en este lugar
                    </Text>

                    <Text style={themedStyles.visitOptionText}>
                      Comprobar tu ubicación mediante GPS.
                    </Text>
                  </View>
                </Pressable>

                {/* Manual */}

                <Pressable
                  style={themedStyles.visitOption}
                  onPress={() => {
                    setMostrarOpcionesVisita(false);
                    setNotaVisita('');
                    setFotoVisita(null);
                    setMostrarFormularioVisita(true);
                  }}
                >
                  <Text style={themedStyles.visitOptionIcon}>
                    ✏️
                  </Text>

                  <View style={themedStyles.visitOptionContent}>
                    <Text style={themedStyles.visitOptionTitle}>
                      Registrar manualmente
                    </Text>

                    <Text style={themedStyles.visitOptionText}>
                      Agregá una nota o una foto sin comprobar tu ubicación.
                    </Text>
                  </View>
                </Pressable>

                {/* Cancelar */}

                <Pressable
                  style={themedStyles.modalCancelButton}
                  onPress={() => setMostrarOpcionesVisita(false)}
                >
                  <Text style={themedStyles.modalCancelText}>
                    Cancelar
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <Modal
            visible={mostrarFormularioVisita}
            transparent
            animationType="slide"
            onRequestClose={() => setMostrarFormularioVisita(false)}
          >
            <View style={themedStyles.modalOverlay}>
              <View style={themedStyles.modalCard}>
                <Text style={themedStyles.modalTitle}>
                  Registrar visita
                </Text>

                <Text style={themedStyles.modalSubtitle}>
                  {lugar.nombre}. La nota y la foto son opcionales.
                </Text>

                <TextInput
                  style={themedStyles.visitNoteInput}
                  value={notaVisita}
                  onChangeText={setNotaVisita}
                  placeholder="Escribí una nota corta..."
                  placeholderTextColor={colors.textSecondary}
                  maxLength={160}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Nota opcional de la visita"
                />

                <Pressable
                  style={themedStyles.visitOption}
                  onPress={tomarFotoVisita}
                  accessibilityRole="button"
                >
                  <Text style={themedStyles.visitOptionIcon}>📷</Text>
                  <View style={themedStyles.visitOptionContent}>
                    <Text style={themedStyles.visitOptionTitle}>
                      {fotoVisita ? 'Volver a sacar la foto' : 'Sacar una foto'}
                    </Text>
                    <Text style={themedStyles.visitOptionText}>
                      La foto se guarda en este teléfono.
                    </Text>
                  </View>
                </Pressable>

                {fotoVisita && (
                  <Image
                    source={{ uri: fotoVisita }}
                    style={themedStyles.visitPhotoPreview}
                    resizeMode="cover"
                    accessibilityLabel="Vista previa de la foto de la visita"
                  />
                )}

                <Pressable
                  style={[
                    themedStyles.primaryButton,
                    guardandoVisitaManual && themedStyles.disabledButton,
                  ]}
                  onPress={registrarVisitaManual}
                  disabled={guardandoVisitaManual}
                >
                  {guardandoVisitaManual ? (
                    <ActivityIndicator color={colors.onPrimary} />
                  ) : (
                    <Text style={themedStyles.primaryButtonText}>
                      Guardar en mi recorrido
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={themedStyles.modalCancelButton}
                  onPress={() => setMostrarFormularioVisita(false)}
                  disabled={guardandoVisitaManual}
                >
                  <Text style={themedStyles.modalCancelText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          {/* Teléfono */}

          {lugar.telefono && (
            <Pressable
              style={themedStyles.contactButton}
              onPress={llamar}
            >
              <Text style={themedStyles.contactButtonIcon}>
                📞
              </Text>

              <View style={themedStyles.contactButtonContent}>
                <Text style={themedStyles.contactButtonLabel}>
                  Teléfono
                </Text>

                <Text style={themedStyles.contactButtonText}>
                  {lugar.telefono}
                </Text>
              </View>
            </Pressable>
          )}

          {/* Sitio web */}

          {lugar.web && (
            <Pressable
              style={themedStyles.contactButton}
              onPress={abrirWeb}
            >
              <Text style={themedStyles.contactButtonIcon}>
                🌐
              </Text>

              <View style={themedStyles.contactButtonContent}>
                <Text style={themedStyles.contactButtonLabel}>
                  Sitio web
                </Text>

                <Text style={themedStyles.contactButtonText}>
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

  // ------------------------------------------
  // Encabezado
  // ------------------------------------------

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

  // ------------------------------------------
  // Favoritos
  // ------------------------------------------

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

  favoriteButtonActive: {
    backgroundColor: '#E5EFE4',
    borderColor: '#D5E2D3',
  },

  favoriteIcon: {
    fontSize: 27,
    color: '#2F7F8F',
  },

  favoriteIconActive: {
    color: '#6B8E5A',
  },

  // ------------------------------------------
  // Imagen principal
  // ------------------------------------------

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

  // ------------------------------------------
  // Categoría
  // ------------------------------------------

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

  // ------------------------------------------
  // Título y descripción
  // ------------------------------------------

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

  // ------------------------------------------
  // Información
  // ------------------------------------------

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

  // ------------------------------------------
  // Acciones
  // ------------------------------------------

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

  // ------------------------------------------
  // Transcripción
  // ------------------------------------------

  transcriptionButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3E1D8',
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
    color: '#253A32',
    fontSize: 14,
    fontWeight: '800',
  },

  transcriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E3E1D8',
  },

  transcriptionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#253A32',
    marginBottom: 10,
  },

  transcriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#5F5C55',
  },

  // ------------------------------------------
  // Registrar visita
  // ------------------------------------------

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

  // ------------------------------------------
  // Modal
  // ------------------------------------------

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },

  modalCard: {
    backgroundColor: '#F7F3E8',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 30,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#253A32',
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#77736B',
    marginTop: 5,
    marginBottom: 18,
  },

  visitOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3E1D8',
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
    color: '#253A32',
  },

  visitOptionText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#77736B',
    marginTop: 3,
  },

  visitNoteInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#D8E4E2',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    color: '#253A32',
    fontSize: 15,
    padding: 12,
    marginBottom: 12,
  },

  visitPhotoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 12,
  },

  disabledButton: {
    opacity: 0.6,
  },

  modalCancelButton: {
    height: 50,
    borderRadius: 15,
    backgroundColor: '#DCE9E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },

  modalCancelText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#253A32',
  },

  // ------------------------------------------
  // Contacto
  // ------------------------------------------

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

  // ------------------------------------------
  // Cargando
  // ------------------------------------------

  loadingText: {
    fontSize: 15,
    color: '#5F5C55',
    marginTop: 14,
    textAlign: 'center',
  },

  // ------------------------------------------
  // Error
  // ------------------------------------------

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
