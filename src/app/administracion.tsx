import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { File } from 'expo-file-system';

import { obtenerSesion } from '@/servicios/autenticacion';
import {
  consultarAPI,
  LugarAPI,
  subirAudioguiaAPI,
  subirImagenAPI,
} from '@/servicios/api';
import { transcripcionesAudioguiasAPI } from '@/servicios/lugares-integrados';
import EventosAdminPanel, {
  EventoAdmin,
} from '@/components/EventosAdminPanel';

type Seccion = 'audioguias' | 'eventos';
type Idioma = 'es' | 'en' | 'pt';

type AudioguiaAdmin = {
  id: string;
  lugarId: string;
  clave: string;
  idioma: Idioma;
  duracionSegundos: number;
  transcripcion: string | null;
  activa: boolean;
  creadoEn: string;
};

type EstadoEvento =
  | 'programado'
  | 'suspendido'
  | 'cancelado'
  | 'finalizado';

const CLAVE_AUDIO_VALIDA =
  /^audios\/\d{4}\/\d{2}\/[a-z0-9-]{3,60}\.(m4a|aac|mp3)$/;

export default function AdministracionScreen() {
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [seccion, setSeccion] = useState<Seccion>('audioguias');

  const [lugares, setLugares] = useState<LugarAPI[]>([]);
  const [eventos, setEventos] = useState<EventoAdmin[]>([]);
  const [lugarSeleccionado, setLugarSeleccionado] =
    useState<string | null>(null);

  const [mostrarLugares, setMostrarLugares] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [transcripcionExpandida, setTranscripcionExpandida] =
    useState<string | null>(null);

  const [idioma, setIdioma] = useState<Idioma>('es');

  const [audioguias, setAudioguias] = useState<AudioguiaAdmin[]>([]);
  const [cargandoAudioguias, setCargandoAudioguias] = useState(false);
  const [subiendoAudioguia, setSubiendoAudioguia] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [actualizandoAudioguia, setActualizandoAudioguia] =
    useState<string | null>(null);
  const [transcripciones, setTranscripciones] =
    useState<Record<string, string>>({});
  const [recuperandoTranscripciones, setRecuperandoTranscripciones] =
    useState(false);

  const [actualizandoEvento, setActualizandoEvento] =
    useState<string | null>(null);

  const [error, setError] = useState('');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const [lugaresObtenidos, eventosObtenidos] = await Promise.all([
        consultarAPI<LugarAPI[]>('/lugares?porPagina=500'),
        consultarAPI<EventoAdmin[]>(
          '/eventos?desde=2020-01-01&porPagina=100',
        ),
      ]);

      setLugares(lugaresObtenidos);
      setEventos(eventosObtenidos);

      setLugarSeleccionado((actual) => {
        if (
          actual &&
          lugaresObtenidos.some((lugar) => lugar.id === actual)
        ) {
          return actual;
        }

        return lugaresObtenidos[0]?.id ?? null;
      });
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;

    async function verificarAcceso() {
      try {
        const sesion = await obtenerSesion();

        if (!activo) return;

        if (!sesion || sesion.rol !== 'admin') {
          Alert.alert(
            'Acceso restringido',
            'Esta sección solamente está disponible para administradores.',
          );

          router.replace('/login');
          return;
        }

        await cargarDatos();
      } catch {
        if (activo) {
          router.replace('/login');
        }
      } finally {
        if (activo) {
          setVerificandoSesion(false);
        }
      }
    }

    verificarAcceso();

    return () => {
      activo = false;
    };
  }, [cargarDatos]);

  const lugarActual = lugares.find(
    (lugar) => lugar.id === lugarSeleccionado,
  );

  const cargarAudioguias = useCallback(async (lugarId: string) => {
    setCargandoAudioguias(true);

    try {
      const resultado = await consultarAPI<AudioguiaAdmin[]>(
        `/lugares/${encodeURIComponent(lugarId)}/audioguias`,
        {},
        true,
      );

      setAudioguias(resultado);

      setTranscripciones(
        Object.fromEntries(
          resultado.map((audio) => [
            audio.id,
            audio.transcripcion ?? '',
          ]),
        ),
      );
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

      Alert.alert('Error', traducirError(mensaje));
      setAudioguias([]);
    } finally {
      setCargandoAudioguias(false);
    }
  }, []);

  useEffect(() => {
    if (lugarSeleccionado) {
      cargarAudioguias(lugarSeleccionado);
    } else {
      setAudioguias([]);
      setTranscripciones({});
    }
  }, [lugarSeleccionado, cargarAudioguias]);


  async function seleccionarYSubirAudioguia() {
    if (!lugarActual) {
      Alert.alert('Seleccioná un lugar', 'Primero elegí un lugar.');
      return;
    }

    try {
      const seleccion = await File.pickFileAsync({
        mimeTypes: ['audio/*'],
      });

      if (seleccion.canceled || !seleccion.result) {
        return;
      }

      const archivo = seleccion.result;
      const nombre = archivo.name || 'audioguia.mp3';

      console.log('ARCHIVO SELECCIONADO:', {
        uri: archivo.uri,
        nombre: archivo.name,
        mimeType: archivo.type,
        size: archivo.size,
      });

      if (!/\.(mp3|m4a|aac)$/i.test(nombre)) {
        Alert.alert(
          'Formato no compatible',
          'Seleccioná un archivo MP3, M4A o AAC.',
        );
        return;
      }

      setSubiendoAudioguia(true);

      const clave = await subirAudioguiaAPI(archivo, nombre);

      if (!CLAVE_AUDIO_VALIDA.test(clave)) {
        throw new Error('RESPUESTA_INVALIDA');
      }

      await consultarAPI(
        `/lugares/${encodeURIComponent(lugarActual.id)}/audioguia`,
        {
          method: 'PATCH',
          body: JSON.stringify({ clave, idioma }),
        },
        true,
      );

      Alert.alert(
        'Audioguía cargada',
        `El nuevo audio de ${lugarActual.nombre} quedó activo.`,
      );

      await cargarAudioguias(lugarActual.id);
      await cargarDatos();
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

      Alert.alert(
        'No se pudo subir el audio',
        traducirError(mensaje),
      );
    } finally {
      setSubiendoAudioguia(false);
    }
  }

  async function seleccionarYSubirImagen() {
    if (!lugarActual) {
      Alert.alert('Seleccioná un lugar', 'Primero elegí un lugar.');
      return;
    }

    try {
      const seleccion = await File.pickFileAsync({
        mimeTypes: ['image/*'],
      });

      if (seleccion.canceled || !seleccion.result) {
        return;
      }

      const archivo = seleccion.result;
      let nombre = archivo.name || 'imagen-lugar.jpg';

      // Normalizar el nombre según el tipo MIME.
      if (archivo.type === 'image/jpeg') {
        if (!/\.(jpg|jpeg)$/i.test(nombre)) {
          nombre = 'imagen-lugar.jpg';
        } else {
          nombre = nombre.replace(/\.jpeg$/i, '.jpg');
        }
      } else if (archivo.type === 'image/png') {
        if (!/\.png$/i.test(nombre)) {
          nombre = 'imagen-lugar.png';
        }
      } else if (archivo.type === 'image/webp') {
        if (!/\.webp$/i.test(nombre)) {
          nombre = 'imagen-lugar.webp';
        }
      } else {
        Alert.alert(
          'Formato no compatible',
          'Seleccioná una imagen JPG, PNG o WebP.',
        );
        return;
      }

      setSubiendoImagen(true);

      const url = await subirImagenAPI(
        archivo.uri,
        nombre,
        archivo.type || 'image/jpeg',
      );

      const marca = '/archivos/';
      const posicion = url.indexOf(marca);

      if (posicion === -1) {
        throw new Error('RESPUESTA_INVALIDA');
      }

      const clave = url.substring(posicion + marca.length);

      if (!/^imagenes\/\d{4}\/\d{2}\/[a-z0-9-]{3,60}\.(jpg|png|webp)$/i.test(clave)) {
        throw new Error('RESPUESTA_INVALIDA');
      }

      await consultarAPI(
        `/lugares/${encodeURIComponent(lugarActual.id)}/imagen`,
        {
          method: 'PATCH',
          body: JSON.stringify({ clave }),
        },
        true,
      );

      Alert.alert(
        'Imagen cargada',
        `La imagen de ${lugarActual.nombre} se guardó correctamente.`,
      );

      await cargarDatos();
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

      Alert.alert(
        'No se pudo subir la imagen',
        traducirError(mensaje),
      );
    } finally {
      setSubiendoImagen(false);
    }
  }

  async function activarVersion(audioguiaId: string) {
    if (!lugarActual) return;

    setActualizandoAudioguia(audioguiaId);

    try {
      await consultarAPI(
        `/lugares/${encodeURIComponent(lugarActual.id)}/audioguias/activar`,
        {
          method: 'PATCH',
          body: JSON.stringify({ audioguiaId }),
        },
        true,
      );

      await cargarAudioguias(lugarActual.id);
      await cargarDatos();

      Alert.alert(
        'Audioguía activada',
        'La versión seleccionada ya está activa.',
      );
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

      Alert.alert('No se pudo activar', traducirError(mensaje));
    } finally {
      setActualizandoAudioguia(null);
    }
  }

  async function recuperarTranscripciones() {
    if (recuperandoTranscripciones) return;

    Alert.alert(
      'Recuperar transcripciones',
      'Se buscarán las audioguías activas de los 17 lugares. Solamente se completarán las transcripciones vacías. ¿Deseás continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Recuperar',
          onPress: async () => {
            setRecuperandoTranscripciones(true);

            let recuperadas = 0;
            let omitidas = 0;
            let errores = 0;

            try {
              for (const [lugarId, transcripcion] of Object.entries(
                transcripcionesAudioguiasAPI,
              )) {
                try {
                  const versiones = await consultarAPI<AudioguiaAdmin[]>(
                    `/lugares/${encodeURIComponent(lugarId)}/audioguias`,
                    {},
                    true,
                  );

                  const activa = versiones.find((audio) => audio.activa);

                  if (!activa || activa.transcripcion?.trim()) {
                    omitidas++;
                    continue;
                  }

                  await consultarAPI(
                    `/lugares/${encodeURIComponent(lugarId)}/audioguias/${encodeURIComponent(activa.id)}/transcripcion`,
                    {
                      method: 'PATCH',
                      body: JSON.stringify({ transcripcion }),
                    },
                    true,
                  );

                  recuperadas++;
                } catch (e) {
                  errores++;
                  console.error(
                    `Error recuperando transcripción del lugar ${lugarId}:`,
                    e,
                  );
                }
              }

              if (lugarActual) {
                await cargarAudioguias(lugarActual.id);
              }

              Alert.alert(
                'Recuperación finalizada',
                `Transcripciones recuperadas: ${recuperadas}\nOmitidas: ${omitidas}\nErrores: ${errores}`,
              );
            } catch (e) {
              const mensaje =
                e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

              Alert.alert(
                'No se pudo completar la recuperación',
                traducirError(mensaje),
              );
            } finally {
              setRecuperandoTranscripciones(false);
            }
          },
        },
      ],
    );
  }

  async function guardarTranscripcion(audioguiaId: string) {
    if (!lugarActual) return;

    setActualizandoAudioguia(audioguiaId);

    try {
      await consultarAPI(
        `/lugares/${encodeURIComponent(lugarActual.id)}/audioguias/${encodeURIComponent(audioguiaId)}/transcripcion`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            transcripcion: transcripciones[audioguiaId] ?? '',
          }),
        },
        true,
      );

      await cargarAudioguias(lugarActual.id);

      Alert.alert(
        'Transcripción guardada',
        'Los cambios se guardaron correctamente.',
      );
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

      Alert.alert('No se pudo guardar', traducirError(mensaje));
    } finally {
      setActualizandoAudioguia(null);
    }
  }

  async function cambiarEstadoEvento(
    evento: EventoAdmin,
    nuevoEstado: Exclude<EstadoEvento, 'finalizado'>,
  ) {
    if (evento.estado === nuevoEstado) return;

    setActualizandoEvento(evento.id);

    try {
      const actualizado = await consultarAPI<EventoAdmin>(
        `/eventos/${encodeURIComponent(evento.id)}/estado`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            estado: nuevoEstado,
          }),
        },
        true,
      );

      setEventos((actuales) =>
        actuales.map((item) =>
          item.id === evento.id ? actualizado : item,
        ),
      );

      Alert.alert(
        'Evento actualizado',
        `El evento ahora está ${nuevoEstado}.`,
      );
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

      Alert.alert(
        'No se pudo actualizar',
        traducirError(mensaje),
      );
    } finally {
      setActualizandoEvento(null);
    }
  }

  function traducirError(mensaje: string): string {
    const errores: Record<string, string> = {
      API_NO_DISPONIBLE:
        'No se pudo conectar con la API. Verificá que el servidor esté iniciado.',
      SESION_NO_INICIADA:
        'No se encontró una sesión. Volvé a iniciar sesión.',
      SESION_NO_VALIDA:
        'Tu sesión ya no es válida. Volvé a iniciar sesión.',
      SIN_PERMISOS:
        'Tu usuario no tiene permisos para realizar esta operación.',
      ARCHIVO_NO_ENCONTRADO:
        'No se encontró el archivo de audio en la API. Verificá que esté cargado.',
      LUGAR_NO_ENCONTRADO:
        'No se encontró el lugar seleccionado.',
      EVENTO_NO_ENCONTRADO:
        'No se encontró el evento seleccionado.',
      VALIDACION_FALLIDA:
        'Los datos enviados no cumplen con el formato requerido.',
      RESPUESTA_INVALIDA:
        'La API devolvió una respuesta que no tiene el formato esperado.',
    };

    return errores[mensaje] ?? mensaje;
  }

  function formatearFecha(fecha: string): string {
    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return fecha;
    }

    return valor.toLocaleString('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  if (verificandoSesion) {
    return (
      <View style={styles.centrado}>
        <ActivityIndicator size="large" color="#315C49" />
        <Text style={styles.textoCarga}>Verificando permisos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Administración</Text>

        <Text style={styles.subtitulo}>
          Gestioná las audioguías y los eventos de Mi Ciudad.
        </Text>

        <View style={styles.pestanas}>
          <Pressable
            style={[
              styles.pestana,
              seccion === 'audioguias' && styles.pestanaActiva,
            ]}
            onPress={() => setSeccion('audioguias')}
          >
            <Text
              style={[
                styles.textoPestana,
                seccion === 'audioguias' && styles.textoPestanaActivo,
              ]}
            >
              Audioguías
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.pestana,
              seccion === 'eventos' && styles.pestanaActiva,
            ]}
            onPress={() => setSeccion('eventos')}
          >
            <Text
              style={[
                styles.textoPestana,
                seccion === 'eventos' && styles.textoPestanaActivo,
              ]}
            >
              Eventos
            </Text>
          </Pressable>
        </View>

        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#315C49" />
            <Text style={styles.textoCarga}>
              Cargando información...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.tarjeta}>
            <Text style={styles.error}>
              No se pudieron cargar los datos.
            </Text>

            <Text style={styles.textoSecundario}>
              {traducirError(error)}
            </Text>

            <Pressable
              style={styles.botonPrincipal}
              onPress={cargarDatos}
            >
              <Text style={styles.textoBoton}>Reintentar</Text>
            </Pressable>
          </View>
        ) : seccion === 'audioguias' ? (
          <View>
            <View style={styles.tarjeta}>
              <Text style={styles.tituloTarjeta}>
                Administrar audioguías
              </Text>

              <Text style={styles.textoSecundario}>
                Seleccioná un lugar para consultar sus audios, cargar
                nuevas versiones o recuperar versiones anteriores.
              </Text>

              <Pressable
                style={[
                  styles.botonPrincipal,
                  recuperandoTranscripciones && { opacity: 0.6 },
                ]}
                onPress={recuperarTranscripciones}
                disabled={recuperandoTranscripciones}
              >
                {recuperandoTranscripciones ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.textoBoton}>
                    Recuperar transcripciones existentes
                  </Text>
                )}
              </Pressable>

              <Text style={styles.etiqueta}>Lugar</Text>

              <Pressable
                style={[styles.opcionLugar, styles.opcionLugarActiva]}
                onPress={() => setMostrarLugares((actual) => !actual)}
              >
                <View style={styles.filaLugar}>
                  <Text style={styles.nombreLugar}>
                    {lugarActual?.nombre ?? 'Seleccioná un lugar'}
                  </Text>
                  <Text style={styles.marcaSeleccion}>
                    {mostrarLugares ? '▲' : '▼'}
                  </Text>
                </View>
                <Text style={styles.textoSecundario}>
                  {mostrarLugares
                    ? 'Tocá un lugar para seleccionarlo'
                    : 'Tocá para cambiar de lugar'}
                </Text>
              </Pressable>

              {mostrarLugares &&
                lugares.map((lugar) => (
                  <Pressable
                    key={lugar.id}
                    style={[
                      styles.opcionLugar,
                      lugarSeleccionado === lugar.id &&
                      styles.opcionLugarActiva,
                    ]}
                    onPress={() => {
                      setLugarSeleccionado(lugar.id);
                      setMostrarLugares(false);
                      setMostrarHistorial(false);
                      setTranscripcionExpandida(null);
                    }}
                  >
                    <View style={styles.filaLugar}>
                      <Text style={styles.nombreLugar}>
                        {lugar.nombre}
                      </Text>

                      {lugarSeleccionado === lugar.id && (
                        <Text style={styles.marcaSeleccion}>✓</Text>
                      )}
                    </View>

                    <Text style={styles.textoSecundario}>
                      {lugar.categoriaId}
                    </Text>
                  </Pressable>
                ))}
            </View>

            {lugarActual && (
              <View style={styles.tarjeta}>
                <Text style={styles.tituloTarjeta}>
                  Agregar audioguía
                </Text>

                <Text style={styles.textoSecundario}>
                  Cargá un archivo MP3 para este lugar. Podés agregar nuevas
                  versiones sin perder las anteriores.
                </Text>

                <Pressable
                  style={[
                    styles.botonPrincipal,
                    subiendoAudioguia && { opacity: 0.6 },
                  ]}
                  onPress={seleccionarYSubirAudioguia}
                  disabled={subiendoAudioguia}
                >
                  {subiendoAudioguia ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.textoBoton}>
                      Agregar archivo MP3
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {lugarActual && (
              <View style={styles.tarjeta}>
                <Text style={styles.tituloTarjeta}>
                  Imagen del lugar
                </Text>

                <Text style={styles.textoSecundario}>
                  Seleccioná una fotografía para agregarla a
                  {` ${lugarActual.nombre}`}. Podés cargar imágenes
                  JPG, PNG o WebP de hasta 5 MB.
                </Text>

                <Pressable
                  style={[
                    styles.botonSecundario,
                    subiendoImagen && { opacity: 0.6 },
                  ]}
                  onPress={seleccionarYSubirImagen}
                  disabled={subiendoImagen}
                >
                  {subiendoImagen ? (
                    <ActivityIndicator color="#315C49" />
                  ) : (
                    <Text style={styles.textoBotonSecundario}>
                      Agregar imagen del lugar
                    </Text>
                  )}
                </Pressable>
              </View>
            )}

            {lugarActual && (
              <View style={styles.tarjeta}>
                <Pressable
                  onPress={() => setMostrarHistorial((actual) => !actual)}
                >
                  <View style={styles.filaLugar}>
                    <Text style={styles.tituloTarjeta}>
                      Historial de versiones
                    </Text>
                    <Text style={styles.marcaSeleccion}>
                      {mostrarHistorial ? '▲' : '▼'}
                    </Text>
                  </View>

                  <Text style={styles.textoSecundario}>
                    {lugarActual.nombre}
                  </Text>
                  <Text style={styles.textoSecundario}>
                    {mostrarHistorial
                      ? 'Tocá para ocultar las versiones'
                      : `${audioguias.length} versión(es) registrada(s). Tocá para consultar`}
                  </Text>
                </Pressable>

                {mostrarHistorial && (
                  <>
                    {cargandoAudioguias ? (
                      <View style={styles.centrado}>
                        <ActivityIndicator color="#315C49" />
                        <Text style={styles.textoCarga}>
                          Cargando historial...
                        </Text>
                      </View>
                    ) : audioguias.length === 0 ? (
                      <Text style={styles.textoSecundario}>
                        Este lugar todavía no tiene versiones registradas.
                      </Text>
                    ) : (
                      [...audioguias]
                        .sort((a, b) => Number(b.activa) - Number(a.activa))
                        .map((audio) => (
                          <View key={audio.id} style={styles.audioVersion}>
                            <View style={styles.filaLugar}>
                              <Text style={styles.nombreLugar}>
                                {audio.idioma.toUpperCase()} ·{' '}
                                {Math.floor(audio.duracionSegundos / 60)} min{' '}
                                {audio.duracionSegundos % 60} s
                              </Text>

                              {audio.activa && (
                                <View style={styles.insigniaActiva}>
                                  <Text style={styles.textoInsignia}>
                                    ACTIVA
                                  </Text>
                                </View>
                              )}
                            </View>

                            <Text style={styles.textoSecundario}>
                              Cargada: {formatearFecha(audio.creadoEn)}
                            </Text>

                            <Text style={styles.textoSecundario}>
                              Archivo: {audio.clave.split('/').pop()}
                            </Text>

                            {!audio.activa && (
                              <Pressable
                                style={styles.botonSecundario}
                                disabled={actualizandoAudioguia !== null}
                                onPress={() => activarVersion(audio.id)}
                              >
                                {actualizandoAudioguia === audio.id ? (
                                  <ActivityIndicator color="#315C49" />
                                ) : (
                                  <Text style={styles.textoBotonSecundario}>
                                    Activar esta versión
                                  </Text>
                                )}
                              </Pressable>
                            )}

                            <Pressable
                              style={styles.botonSecundario}
                              onPress={() =>
                                setTranscripcionExpandida((actual) =>
                                  actual === audio.id ? null : audio.id,
                                )
                              }
                            >
                              <Text style={styles.textoBotonSecundario}>
                                {transcripcionExpandida === audio.id
                                  ? 'Ocultar transcripción ▲'
                                  : 'Ver / editar transcripción ▼'}
                              </Text>
                            </Pressable>

                            {transcripcionExpandida === audio.id && (
                              <>
                                <Text style={styles.etiqueta}>
                                  Transcripción
                                </Text>

                                <TextInput
                                  style={[
                                    styles.campo,
                                    styles.campoTranscripcion,
                                  ]}
                                  value={transcripciones[audio.id] ?? ''}
                                  onChangeText={(texto) =>
                                    setTranscripciones((actuales) => ({
                                      ...actuales,
                                      [audio.id]: texto,
                                    }))
                                  }
                                  placeholder="Escribí aquí la transcripción del audio..."
                                  multiline
                                  textAlignVertical="top"
                                />

                                <Pressable
                                  style={[
                                    styles.botonSecundario,
                                    actualizandoAudioguia === audio.id &&
                                    styles.botonDeshabilitado,
                                  ]}
                                  disabled={actualizandoAudioguia !== null}
                                  onPress={() => guardarTranscripcion(audio.id)}
                                >
                                  {actualizandoAudioguia === audio.id ? (
                                    <ActivityIndicator color="#315C49" />
                                  ) : (
                                    <Text style={styles.textoBotonSecundario}>
                                      Guardar transcripción
                                    </Text>
                                  )}
                                </Pressable>
                              </>
                            )}
                          </View>
                        ))
                    )}
                  </>
                )}
              </View>
            )}
          </View>
        ) : (
          <EventosAdminPanel
            eventos={eventos}
            lugares={lugares}
            onRecargar={cargarDatos}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8F7F2',
  },
  contenido: {
    padding: 20,
    paddingBottom: 35,
  },
  centrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  textoCarga: {
    marginTop: 12,
    color: '#77736B',
    fontSize: 14,
  },
  titulo: {
    fontSize: 27,
    fontWeight: '800',
    color: '#253A32',
  },
  subtitulo: {
    fontSize: 14,
    color: '#77736B',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 21,
  },
  pestanas: {
    flexDirection: 'row',
    backgroundColor: '#EAE9E2',
    borderRadius: 12,
    padding: 4,
    marginBottom: 18,
  },
  pestana: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 9,
  },
  pestanaActiva: {
    backgroundColor: '#315C49',
  },
  textoPestana: {
    color: '#625F58',
    fontSize: 14,
    fontWeight: '700',
  },
  textoPestanaActivo: {
    color: '#FFFFFF',
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EAE8E0',
  },
  tituloTarjeta: {
    fontSize: 18,
    fontWeight: '800',
    color: '#253A32',
    marginBottom: 8,
  },
  textoSecundario: {
    fontSize: 13,
    color: '#77736B',
    lineHeight: 19,
    marginBottom: 5,
  },
  etiqueta: {
    color: '#454B45',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 17,
    marginBottom: 8,
  },
  opcionLugar: {
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#F7F6F1',
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#EAE8E0',
  },
  opcionLugarActiva: {
    borderColor: '#315C49',
    backgroundColor: '#EDF3EE',
  },
  filaLugar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nombreLugar: {
    color: '#253A32',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  marcaSeleccion: {
    color: '#315C49',
    fontSize: 18,
    fontWeight: '800',
  },
  campo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D6CD',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    color: '#253A32',
  },
  campoTranscripcion: {
    minHeight: 110,
    marginTop: 4,
  },
  filaIdiomas: {
    flexDirection: 'row',
    gap: 8,
  },
  botonIdioma: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D8D6CD',
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
  },
  botonIdiomaActivo: {
    backgroundColor: '#315C49',
    borderColor: '#315C49',
  },
  textoIdioma: {
    color: '#625F58',
    fontSize: 12,
    fontWeight: '700',
  },
  textoIdiomaActivo: {
    color: '#FFFFFF',
  },
  botonPrincipal: {
    backgroundColor: '#315C49',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 46,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  audioVersion: {
    borderWidth: 1,
    borderColor: '#EAE8E0',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    backgroundColor: '#F7F6F1',
  },
  insigniaActiva: {
    backgroundColor: '#EDF3EE',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  textoInsignia: {
    color: '#315C49',
    fontSize: 10,
    fontWeight: '800',
  },
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#315C49',
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 42,
  },
  textoBotonSecundario: {
    color: '#315C49',
    fontSize: 13,
    fontWeight: '800',
  },
  estadoActual: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: '#315C49',
    marginLeft: 7,
  },
  estadoCancelado: {
    color: '#B04444',
  },
  estadoSuspendido: {
    color: '#A36B20',
  },
  estadoFinalizado: {
    color: '#77736B',
  },
  filaEstados: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  botonEstado: {
    flex: 1,
    minWidth: 90,
    borderWidth: 1,
    borderColor: '#D8D6CD',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  botonEstadoActivo: {
    backgroundColor: '#EDF3EE',
    borderColor: '#315C49',
  },
  textoEstado: {
    color: '#625F58',
    fontSize: 11,
    fontWeight: '700',
  },
  textoEstadoActivo: {
    color: '#315C49',
  },
  error: {
    color: '#B04444',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 8,
  },
});