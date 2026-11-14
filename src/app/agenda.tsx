
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  consultarAPI,
  EventoAPI,
  LugarAPI,
  prepararUrlImagen,
  obtenerEventosGuardadosAPI,
  guardarEventoAPI,
  quitarEventoGuardadoAPI,
} from '@/servicios/api';

import {
  programarRecordatorioEvento,
  cancelarRecordatorioEvento,
} from '@/servicios/recordatorios-eventos';

import { useThemeContext } from '@/contexts/ThemeContext';

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
}

export default function AgendaScreen() {
  const { colors } = useThemeContext();

  const [eventos, setEventos] = useState<EventoAPI[]>([]);
  const [lugares, setLugares] = useState<LugarAPI[]>([]);
  const [guardadosIds, setGuardadosIds] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [actualizandoId, setActualizandoId] = useState<string | null>(null);

  const cargarAgenda = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const [eventosObtenidos, lugaresObtenidos, guardadosObtenidos] =
        await Promise.all([
          consultarAPI<EventoAPI[]>(
            '/eventos?desde=2020-01-01&porPagina=100',
          ),
          consultarAPI<LugarAPI[]>('/lugares?porPagina=500'),
          obtenerEventosGuardadosAPI(),
        ]);

      setEventos(eventosObtenidos);
      setLugares(lugaresObtenidos);
      setGuardadosIds(guardadosObtenidos.map((evento) => evento.id));
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

      setError(mensaje);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarAgenda();
  }, [cargarAgenda]);

  const eventosFuturos = eventos
    .filter(
      (evento) =>
        (evento.estado === 'programado' ||
          evento.estado === 'suspendido') &&
        new Date(evento.inicio).getTime() >= Date.now(),
    )
    .sort(
      (a, b) =>
        new Date(a.inicio).getTime() -
        new Date(b.inicio).getTime(),
    );

  function obtenerNombreLugar(evento: EventoAPI): string {
    if (evento.lugarId) {
      const lugar = lugares.find(
        (item) => item.id === evento.lugarId,
      );

      if (lugar) return lugar.nombre;
    }

    return evento.direccionLibre || 'Ubicación a confirmar';
  }

  async function alternarEvento(evento: EventoAPI) {
    if (actualizandoId) return;

    const yaGuardado = guardadosIds.includes(evento.id);

    setActualizandoId(evento.id);

    try {
      if (yaGuardado) {
        await quitarEventoGuardadoAPI(evento.id);

        await cancelarRecordatorioEvento(evento.id);
        setGuardadosIds((actuales) =>
          actuales.filter((id) => id !== evento.id),
        );

        Alert.alert(
          'Evento quitado',
          'El evento ya no está en tu agenda personal.',
        );
      } else {
        await guardarEventoAPI(evento.id);

        await programarRecordatorioEvento(evento);

        setGuardadosIds((actuales) =>
          actuales.includes(evento.id)
            ? actuales
            : [...actuales, evento.id],
        );

        Alert.alert(
          '¡Evento agendado!',
          'El evento se agregó correctamente a tu agenda personal.',
        );
      }
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

      if (
        mensaje === 'SESION_NO_INICIADA' ||
        mensaje === 'SESION_NO_VALIDA' ||
        mensaje === 'NO_AUTENTICADO'
      ) {
        Alert.alert(
          'Iniciá sesión',
          'Necesitás tener una sesión activa para agendar eventos.',
        );
      } else if (mensaje === 'EVENTO_NO_VIGENTE') {
        Alert.alert(
          'Evento no disponible',
          'Este evento ya no se puede agendar porque fue cancelado o terminó.',
        );

        await cargarAgenda();
      } else {
        Alert.alert(
          'No se pudo actualizar tu agenda',
          mensaje,
        );
      }
    } finally {
      setActualizandoId(null);
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contenido: {
      padding: 18,
      paddingBottom: 35,
    },
    encabezado: {
      marginTop: 12,
      marginBottom: 18,
    },
    titulo: {
      fontSize: 29,
      fontWeight: '800',
      color: colors.text,
    },
    subtitulo: {
      marginTop: 7,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    botonActualizar: {
      alignSelf: 'flex-start',
      backgroundColor: colors.successBackground,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      marginBottom: 18,
    },
    textoBotonActualizar: {
      color: colors.success,
      fontWeight: '700',
      fontSize: 14,
    },
    contador: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: '600',
      marginBottom: 12,
    },
    tarjeta: {
      backgroundColor: colors.backgroundElement,
      borderRadius: 18,
      overflow: 'hidden',
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    imagen: {
      width: '100%',
      height: 190,
      backgroundColor: colors.backgroundSelected,
    },
    imagenVacia: {
      height: 150,
      backgroundColor: colors.backgroundSelected,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emojiImagen: {
      fontSize: 38,
    },
    textoImagenVacia: {
      color: colors.textSecondary,
      marginTop: 7,
      fontWeight: '600',
    },
    contenidoTarjeta: {
      padding: 17,
    },
    etiquetaEstado: {
      alignSelf: 'flex-start',
      backgroundColor: colors.successBackground,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 7,
      marginBottom: 10,
    },
    textoEtiquetaEstado: {
      color: colors.success,
      fontSize: 11,
      fontWeight: '800',
    },
    etiquetaSuspendido: {
      backgroundColor: colors.dangerBackground,
    },
    textoSuspendido: {
      color: colors.danger,
    },
    tituloEvento: {
      fontSize: 21,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 13,
    },
    dato: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 9,
    },
    iconoDato: {
      fontSize: 16,
      marginRight: 9,
    },
    textoDato: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
    },
    descripcion: {
      marginTop: 9,
      fontSize: 14,
      lineHeight: 22,
      color: colors.textSecondary,
    },
    separador: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 13,
    },
    precio: {
      color: colors.success,
      fontSize: 14,
      fontWeight: '700',
    },
    botonAgendar: {
      backgroundColor: colors.primary,
      paddingVertical: 13,
      borderRadius: 11,
      alignItems: 'center',
      marginTop: 16,
    },
    botonGuardado: {
      backgroundColor: colors.success,
    },
    botonDeshabilitado: {
      opacity: 0.6,
    },
    textoBotonAgendar: {
      color: colors.onPrimary,
      fontWeight: '800',
      fontSize: 14,
    },
    estado: {
      alignItems: 'center',
      padding: 35,
    },
    tarjetaEstado: {
      backgroundColor: colors.backgroundElement,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    emojiVacio: {
      fontSize: 38,
      marginBottom: 12,
    },
    tituloEstado: {
      color: colors.text,
      fontSize: 19,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 9,
    },
    textoEstado: {
      color: colors.textSecondary,
      fontSize: 14,
      lineHeight: 21,
      textAlign: 'center',
      marginTop: 9,
    },
    botonReintentar: {
      marginTop: 18,
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 11,
      borderRadius: 10,
    },
    textoBotonReintentar: {
      color: colors.onPrimary,
      fontWeight: '700',
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contenido}
    >
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>Agenda de Colón</Text>

        <Text style={styles.subtitulo}>
          Descubrí actividades y guardá los eventos que quieras disfrutar.
        </Text>
      </View>

      <Pressable
        style={styles.botonActualizar}
        onPress={cargarAgenda}
        disabled={cargando || actualizandoId !== null}
      >
        <Text style={styles.textoBotonActualizar}>
          {cargando ? 'Actualizando...' : '↻ Actualizar agenda'}
        </Text>
      </Pressable>

      {cargando ? (
        <View style={styles.estado}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.textoEstado}>
            Buscando próximos eventos...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.tarjetaEstado}>
          <Text style={styles.tituloEstado}>
            No pudimos cargar la agenda
          </Text>

          <Text style={styles.textoEstado}>
            {error === 'API_NO_DISPONIBLE'
              ? 'No se pudo conectar con el servidor. Revisá tu conexión.'
              : error === 'SESION_NO_INICIADA' ||
                error === 'SESION_NO_VALIDA' ||
                error === 'NO_AUTENTICADO'
                ? 'Necesitás iniciar sesión como turista para consultar tu agenda personal.'
                : error}
          </Text>

          <Pressable
            style={styles.botonReintentar}
            onPress={cargarAgenda}
          >
            <Text style={styles.textoBotonReintentar}>
              Intentar nuevamente
            </Text>
          </Pressable>
        </View>
      ) : eventosFuturos.length === 0 ? (
        <View style={styles.tarjetaEstado}>
          <Text style={styles.emojiVacio}>📅</Text>

          <Text style={styles.tituloEstado}>
            No hay próximos eventos
          </Text>

          <Text style={styles.textoEstado}>
            Por el momento no hay actividades programadas para los próximos días.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.contador}>
            {eventosFuturos.length}{' '}
            {eventosFuturos.length === 1
              ? 'evento próximo'
              : 'eventos próximos'}
          </Text>

          {eventosFuturos.map((evento) => {
            const guardado = guardadosIds.includes(evento.id);
            const actualizando = actualizandoId === evento.id;

            return (
              <View key={evento.id} style={styles.tarjeta}>
                {evento.imagenUrl ? (
                  <Image
                    source={{
                      uri: prepararUrlImagen(evento.imagenUrl),
                    }}
                    style={styles.imagen}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagenVacia}>
                    <Text style={styles.emojiImagen}>🎭</Text>
                    <Text style={styles.textoImagenVacia}>
                      Evento de Colón
                    </Text>
                  </View>
                )}

                <View style={styles.contenidoTarjeta}>
                  <View
                    style={[
                      styles.etiquetaEstado,
                      evento.estado === 'suspendido' &&
                      styles.etiquetaSuspendido,
                    ]}
                  >
                    <Text
                      style={[
                        styles.textoEtiquetaEstado,
                        evento.estado === 'suspendido' &&
                        styles.textoSuspendido,
                      ]}
                    >
                      {evento.estado === 'suspendido'
                        ? 'EVENTO SUSPENDIDO'
                        : 'PRÓXIMO EVENTO'}
                    </Text>
                  </View>

                  <Text style={styles.tituloEvento}>
                    {evento.titulo}
                  </Text>

                  <View style={styles.dato}>
                    <Text style={styles.iconoDato}>📅</Text>
                    <Text style={styles.textoDato}>
                      {formatearFecha(evento.inicio)}
                    </Text>
                  </View>

                  <View style={styles.dato}>
                    <Text style={styles.iconoDato}>📍</Text>
                    <Text style={styles.textoDato}>
                      {obtenerNombreLugar(evento)}
                    </Text>
                  </View>

                  {evento.descripcion ? (
                    <Text style={styles.descripcion}>
                      {evento.descripcion}
                    </Text>
                  ) : null}

                  <View style={styles.separador} />

                  <Text style={styles.precio}>
                    {evento.precio == null || evento.precio === 0
                      ? 'Entrada gratuita o sin precio informado'
                      : `Entrada: ${new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                        maximumFractionDigits: 0,
                      }).format(evento.precio)}`}
                  </Text>

                  <Pressable
                    style={[
                      styles.botonAgendar,
                      guardado && styles.botonGuardado,
                      actualizando && styles.botonDeshabilitado,
                    ]}
                    onPress={() => alternarEvento(evento)}
                    disabled={
                      actualizandoId !== null ||
                      evento.estado === 'suspendido'
                    }
                  >
                    {actualizando ? (
                      <ActivityIndicator color={colors.onPrimary} />
                    ) : (
                      <Text style={styles.textoBotonAgendar}>
                        {evento.estado === 'suspendido'
                          ? 'Evento suspendido'
                          : guardado
                            ? '✓ Quitar de mi agenda'
                            : '＋ Agendar evento'}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}