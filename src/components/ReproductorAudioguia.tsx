
import { useRef, useState } from 'react';
import {
    PanResponder,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import type { AudioSource } from 'expo-audio';
import { useAudioguia } from '@/servicios/AudioProvider';

import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';

type Props = {
    fuente: AudioSource;
    lugarId: string;
    nombre: string;
};

function formatearTiempo(segundos: number): string {
    if (!Number.isFinite(segundos) || segundos < 0) {
        return '0:00';
    }

    const minutos = Math.floor(segundos / 60);
    const resto = Math.floor(segundos % 60);

    return `${minutos}:${String(resto).padStart(2, '0')}`;
}

export default function ReproductorAudioguia({
    fuente,
    lugarId,
    nombre,
}: Props) {
    const { colors } = useThemeContext();
    const styles = crearEstilos(colors);
    const {
        pistaActual,
        estado,
        reproducirOPausar,
        irA,
    } = useAudioguia();

    const esEstaPista = pistaActual?.id === lugarId;

    const duracion =
        esEstaPista && Number.isFinite(estado.duration)
            ? estado.duration
            : 0;

    const tiempoActual =
        esEstaPista && Number.isFinite(estado.currentTime)
            ? estado.currentTime
            : 0;

    const estaReproduciendo = esEstaPista && estado.playing;

    const progresoReal = duracion > 0
        ? Math.min(1, Math.max(0, tiempoActual / duracion))
        : 0;

    const [anchoBarra, setAnchoBarra] = useState(1);
    const [progresoTemporal, setProgresoTemporal] =
        useState<number | null>(null);

    const progresoTemporalRef = useRef<number | null>(null);
    const progresoInicialArrastre = useRef(0);
    const anchoBarraRef = useRef(1);
    const duracionRef = useRef(0);

    // Mantener siempre la función irA más reciente.
    const irARef = useRef(irA);
    irARef.current = irA;

    const progreso = progresoTemporal ?? progresoReal;

    anchoBarraRef.current = anchoBarra;
    duracionRef.current = duracion;

    const confirmarPosicion = async (proporcion: number) => {
        try {
            await irARef.current(
                proporcion * duracionRef.current
            );
        } catch (error) {
            console.error(
                'No se pudo cambiar la posición de la audioguía:',
                error
            );
        } finally {
            progresoTemporalRef.current = null;
            setProgresoTemporal(null);
        }
    };

    const responderBarra = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            onPanResponderGrant: (evento) => {
                const ancho = anchoBarraRef.current;
                if (ancho <= 0) return;

                const proporcion = Math.max(
                    0,
                    Math.min(
                        1,
                        evento.nativeEvent.locationX / ancho
                    )
                );

                progresoInicialArrastre.current = proporcion;
                progresoTemporalRef.current = proporcion;
                setProgresoTemporal(proporcion);
            },

            onPanResponderMove: (_, gesto) => {
                const ancho = anchoBarraRef.current;
                if (ancho <= 0) return;

                const proporcion = Math.max(
                    0,
                    Math.min(
                        1,
                        progresoInicialArrastre.current +
                        gesto.dx / ancho
                    )
                );

                progresoTemporalRef.current = proporcion;
                setProgresoTemporal(proporcion);
            },

            onPanResponderRelease: () => {
                const proporcion = progresoTemporalRef.current;

                if (proporcion !== null) {
                    void confirmarPosicion(proporcion);
                }
            },

            onPanResponderTerminate: () => {
                const proporcion = progresoTemporalRef.current;

                if (proporcion !== null) {
                    void confirmarPosicion(proporcion);
                }
            },
        })
    ).current;

    const manejarReproduccion = () => {
        reproducirOPausar(fuente, {
            id: lugarId,
            nombre,
        });
    };

    return (
        <View style={styles.contenedor}>
            <View style={styles.filaControles}>
                <Pressable
                    style={styles.boton}
                    onPress={() => void irA(tiempoActual - 10)}
                    disabled={!esEstaPista}
                >
                    <Text style={styles.textoBoton}>-10 s</Text>
                </Pressable>

                <Pressable
                    style={styles.botonPrincipal}
                    onPress={manejarReproduccion}
                >
                    <Text style={styles.textoPrincipal}>
                        {estaReproduciendo
                            ? '⏸ Pausar'
                            : '▶ Reproducir'}
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.boton}
                    onPress={() => void irA(tiempoActual + 10)}
                    disabled={!esEstaPista}
                >
                    <Text style={styles.textoBoton}>+10 s</Text>
                </Pressable>
            </View>

            <View
                style={styles.zonaBarra}
                onLayout={(evento) =>
                    setAnchoBarra(evento.nativeEvent.layout.width)
                }
                {...responderBarra.panHandlers}
            >
                <View style={styles.fondoBarra}>
                    <View
                        style={[
                            styles.progresoBarra,
                            { width: `${progreso * 100}%` },
                        ]}
                    />

                    <View
                        style={[
                            styles.indicador,
                            { left: `${progreso * 100}%` },
                        ]}
                    />
                </View>
            </View>

            <View style={styles.filaTiempo}>
                <Text style={styles.tiempo}>
                    {formatearTiempo(tiempoActual)}
                </Text>

                <Text style={styles.tiempo}>
                    {formatearTiempo(duracion)}
                </Text>
            </View>
        </View>
    );
}

function crearEstilos(
    colors: (typeof Colors)[keyof typeof Colors],
) {
    return StyleSheet.create({
        contenedor: {
            backgroundColor: colors.backgroundElement,
            borderRadius: 12,
            padding: 12,
            marginTop: 10,
            borderWidth: 1,
            borderColor: colors.border,
        },

        filaControles: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
        },

        boton: {
            flex: 1,
            minHeight: 42,
            borderRadius: 9,
            backgroundColor: colors.backgroundSelected,
            alignItems: 'center',
            justifyContent: 'center',
        },

        botonPrincipal: {
            flex: 1.5,
            minHeight: 42,
            borderRadius: 9,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },

        textoBoton: {
            color: colors.text,
            fontWeight: '800',
            fontSize: 13,
        },

        textoPrincipal: {
            color: colors.onPrimary,
            fontWeight: '800',
            fontSize: 13,
        },

        zonaBarra: {
            height: 28,
            justifyContent: 'center',
            marginTop: 8,
        },

        fondoBarra: {
            height: 6,
            borderRadius: 5,
            backgroundColor: colors.border,
            justifyContent: 'center',
        },

        progresoBarra: {
            height: 6,
            borderRadius: 5,
            backgroundColor: colors.primary,
        },

        indicador: {
            position: 'absolute',
            width: 15,
            height: 15,
            borderRadius: 8,
            backgroundColor: colors.primary,
            borderWidth: 2,
            borderColor: colors.backgroundElement,
            marginLeft: -7,
        },

        filaTiempo: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },

        tiempo: {
            color: colors.textSecondary,
            fontSize: 12,
            fontWeight: '600',
        },
    });
}