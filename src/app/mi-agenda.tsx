import { useThemedStyles } from "@/hooks/use-theme";
import { useThemeContext } from '@/contexts/theme-context';

import { useCallback, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import {
    EventoAPI,
    obtenerEventosGuardadosAPI,
    prepararUrlImagen,
    quitarEventoGuardadoAPI,
} from '@/servicios/api';

function formatearFecha(fecha: string): string {
    const fechaNormalizada = fecha.includes('T')
        ? fecha
        : fecha.replace(' ', 'T');

    return new Date(fechaNormalizada).toLocaleString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires',
    });
}

function obtenerEstado(estado: EventoAPI['estado']): string {
    switch (estado) {
        case 'programado':
            return 'PROGRAMADO';
        case 'suspendido':
            return 'SUSPENDIDO';
        case 'cancelado':
            return 'CANCELADO';
        case 'finalizado':
            return 'FINALIZADO';
    }
}

export default function MiAgendaScreen() {
  const themedStyles = useThemedStyles(styles);
  const { colors } = useThemeContext();
    const [eventos, setEventos] = useState<EventoAPI[]>([]);
    const [cargando, setCargando] = useState(true);
    const [actualizandoId, setActualizandoId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const cargarEventosGuardados = useCallback(async () => {
        try {
            setCargando(true);
            setError('');

            const guardados = await obtenerEventosGuardadosAPI();

            setEventos(guardados);
        } catch (e) {
            const mensaje =
                e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

            setError(mensaje);
        } finally {
            setCargando(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargarEventosGuardados();
        }, [cargarEventosGuardados])
    );

    function confirmarQuitar(evento: EventoAPI) {
        Alert.alert(
            'Quitar de mi agenda',
            `¿Querés quitar "${evento.titulo}" de tus eventos guardados?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Quitar',
                    style: 'destructive',
                    onPress: () => quitarEvento(evento),
                },
            ]
        );
    }

    async function quitarEvento(evento: EventoAPI) {
        if (actualizandoId !== null) return;

        setActualizandoId(evento.id);

        try {
            await quitarEventoGuardadoAPI(evento.id);

            setEventos((actuales) =>
                actuales.filter((item) => item.id !== evento.id)
            );

            Alert.alert(
                'Evento quitado',
                'El evento ya no aparece en tu agenda personal.'
            );
        } catch (e) {
            const mensaje =
                e instanceof Error ? e.message : 'ERROR_DESCONOCIDO';

            Alert.alert(
                'No se pudo quitar el evento',
                mensaje
            );
        } finally {
            setActualizandoId(null);
        }
    }

    return (
        <SafeAreaView style={themedStyles.container}>
            <ScrollView
                contentContainerStyle={themedStyles.contenido}
                showsVerticalScrollIndicator={false}
            >
                <View style={themedStyles.encabezado}>
                    <Text style={themedStyles.titulo}>Mi agenda</Text>

                    <Text style={themedStyles.subtitulo}>
                        Acá encontrás los eventos que guardaste para disfrutar en Colón.
                    </Text>
                </View>

                <Pressable
                    style={themedStyles.botonActualizar}
                    onPress={cargarEventosGuardados}
                    disabled={cargando || actualizandoId !== null}
                >
                    <Text style={themedStyles.textoBotonActualizar}>
                        ↻ Actualizar agenda
                    </Text>
                </Pressable>

                {cargando ? (
                    <View style={themedStyles.estado}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={themedStyles.textoEstado}>
                            Cargando tus eventos...
                        </Text>
                    </View>
                ) : error ? (
                    <View style={themedStyles.tarjetaEstado}>
                        <Text style={themedStyles.emojiEstado}>⚠️</Text>

                        <Text style={themedStyles.tituloEstado}>
                            No pudimos cargar tu agenda
                        </Text>

                        <Text style={themedStyles.textoEstado}>
                            {error === 'SESION_NO_INICIADA' ||
                                error === 'SESION_NO_VALIDA' ||
                                error === 'NO_AUTENTICADO'
                                ? 'Necesitás iniciar sesión para consultar tus eventos guardados.'
                                : error === 'API_NO_DISPONIBLE'
                                    ? 'No se pudo conectar con el servidor. Revisá tu conexión.'
                                    : error}
                        </Text>

                        <Pressable
                            style={themedStyles.botonReintentar}
                            onPress={cargarEventosGuardados}
                        >
                            <Text style={themedStyles.textoBotonReintentar}>
                                Intentar nuevamente
                            </Text>
                        </Pressable>
                    </View>
                ) : eventos.length === 0 ? (
                    <View style={themedStyles.tarjetaEstado}>
                        <Text style={themedStyles.emojiEstado}>📅</Text>

                        <Text style={themedStyles.tituloEstado}>
                            Todavía no tenés eventos agendados
                        </Text>

                        <Text style={themedStyles.textoEstado}>
                            Explorá la Agenda de Colón y tocá «Agendar evento» en las
                            actividades que quieras guardar.
                        </Text>
                    </View>
                ) : (
                    <>
                        <Text style={themedStyles.contador}>
                            {eventos.length}{' '}
                            {eventos.length === 1
                                ? 'evento guardado'
                                : 'eventos guardados'}
                        </Text>

                        {eventos.map((evento) => {
                            const actualizando = actualizandoId === evento.id;

                            return (
                                <View key={evento.id} style={themedStyles.tarjeta}>
                                    {evento.imagenUrl ? (
                                        <Image
                                            source={{
                                                uri: prepararUrlImagen(evento.imagenUrl),
                                            }}
                                            style={themedStyles.imagen}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={themedStyles.imagenVacia}>
                                            <Text style={themedStyles.emojiImagen}>🎭</Text>
                                            <Text style={themedStyles.textoImagenVacia}>
                                                Evento de Colón
                                            </Text>
                                        </View>
                                    )}

                                    <View style={themedStyles.contenidoTarjeta}>
                                        <View
                                            style={[
                                                themedStyles.etiquetaEstado,
                                                evento.estado !== 'programado' &&
                                                themedStyles.etiquetaOtroEstado,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    themedStyles.textoEtiquetaEstado,
                                                    evento.estado !== 'programado' &&
                                                    themedStyles.textoOtroEstado,
                                                ]}
                                            >
                                                {obtenerEstado(evento.estado)}
                                            </Text>
                                        </View>

                                        <Text style={themedStyles.tituloEvento}>
                                            {evento.titulo}
                                        </Text>

                                        <View style={themedStyles.dato}>
                                            <Text style={themedStyles.iconoDato}>📅</Text>
                                            <Text style={themedStyles.textoDato}>
                                                {formatearFecha(evento.inicio)}
                                            </Text>
                                        </View>

                                        {evento.fin ? (
                                            <View style={themedStyles.dato}>
                                                <Text style={themedStyles.iconoDato}>🕒</Text>
                                                <Text style={themedStyles.textoDato}>
                                                    Finaliza: {formatearFecha(evento.fin)}
                                                </Text>
                                            </View>
                                        ) : null}

                                        <View style={themedStyles.dato}>
                                            <Text style={themedStyles.iconoDato}>📍</Text>
                                            <Text style={themedStyles.textoDato}>
                                                {evento.direccionLibre ||
                                                    'Consultá la ubicación del evento'}
                                            </Text>
                                        </View>

                                        {evento.descripcion ? (
                                            <Text style={themedStyles.descripcion}>
                                                {evento.descripcion}
                                            </Text>
                                        ) : null}

                                        <View style={themedStyles.separador} />

                                        <Text style={themedStyles.precio}>
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
                                                themedStyles.botonQuitar,
                                                actualizando && themedStyles.botonDeshabilitado,
                                            ]}
                                            onPress={() => confirmarQuitar(evento)}
                                            disabled={actualizandoId !== null}
                                        >
                                            {actualizando ? (
                                                <ActivityIndicator color={colors.danger} />
                                            ) : (
                                                <Text style={themedStyles.textoBotonQuitar}>
                                                    Quitar de mi agenda
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6F1',
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
        color: '#253A32',
    },
    subtitulo: {
        marginTop: 7,
        fontSize: 15,
        lineHeight: 22,
        color: '#77736B',
    },
    botonActualizar: {
        alignSelf: 'flex-start',
        backgroundColor: '#E5EEE8',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 18,
    },
    textoBotonActualizar: {
        color: '#28745A',
        fontWeight: '700',
        fontSize: 14,
    },
    contador: {
        fontSize: 15,
        color: '#77736B',
        fontWeight: '600',
        marginBottom: 12,
    },
    tarjeta: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#EAE7DF',
    },
    imagen: {
        width: '100%',
        height: 190,
        backgroundColor: '#EAE7DF',
    },
    imagenVacia: {
        height: 150,
        backgroundColor: '#E8EEE8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emojiImagen: {
        fontSize: 38,
    },
    textoImagenVacia: {
        color: '#61756A',
        marginTop: 7,
        fontWeight: '600',
    },
    contenidoTarjeta: {
        padding: 17,
    },
    etiquetaEstado: {
        alignSelf: 'flex-start',
        backgroundColor: '#E5F1E8',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 7,
        marginBottom: 10,
    },
    textoEtiquetaEstado: {
        color: '#28745A',
        fontSize: 11,
        fontWeight: '800',
    },
    etiquetaOtroEstado: {
        backgroundColor: '#FCE8E6',
    },
    textoOtroEstado: {
        color: '#A13A32',
    },
    tituloEvento: {
        fontSize: 21,
        fontWeight: '800',
        color: '#253A32',
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
        color: '#555B55',
        fontSize: 14,
        lineHeight: 21,
    },
    descripcion: {
        marginTop: 9,
        fontSize: 14,
        lineHeight: 22,
        color: '#66665F',
    },
    separador: {
        height: 1,
        backgroundColor: '#EAE7DF',
        marginVertical: 13,
    },
    precio: {
        color: '#28745A',
        fontSize: 14,
        fontWeight: '700',
    },
    botonQuitar: {
        backgroundColor: '#F9ECE9',
        paddingVertical: 13,
        borderRadius: 11,
        alignItems: 'center',
        marginTop: 16,
    },
    botonDeshabilitado: {
        opacity: 0.6,
    },
    textoBotonQuitar: {
        color: '#A34A3A',
        fontWeight: '800',
        fontSize: 14,
    },
    estado: {
        alignItems: 'center',
        padding: 35,
    },
    tarjetaEstado: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EAE7DF',
    },
    emojiEstado: {
        fontSize: 38,
        marginBottom: 12,
    },
    tituloEstado: {
        color: '#253A32',
        fontSize: 19,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 9,
    },
    textoEstado: {
        color: '#77736B',
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        marginTop: 9,
    },
    botonReintentar: {
        marginTop: 18,
        backgroundColor: '#28745A',
        paddingHorizontal: 20,
        paddingVertical: 11,
        borderRadius: 10,
    },
    textoBotonReintentar: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
