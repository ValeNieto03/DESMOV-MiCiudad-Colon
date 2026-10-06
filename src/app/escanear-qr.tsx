import { useRef, useState } from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { lugares } from '@/data/lugares';

import {
    obtenerUsuarioActual,
} from '@/servicios/autenticacion';

import {
    guardarVisita,
    Visita,
} from '@/servicios/visitas';

const PREFIJO_QR = 'MICiudad:lugar:';

export default function EscanearQRScreen() {
    const router = useRouter();

    const { lugarId } = useLocalSearchParams<{
        lugarId?: string;
    }>();

    const [permission, requestPermission] =
        useCameraPermissions();

    const [escaneando, setEscaneando] = useState(true);

    // Evita que la cámara procese el mismo QR varias veces seguidas.
    const procesandoQR = useRef(false);

    const lugarEsperado = lugares.find(
        (item) => item.id === lugarId
    );

    const normalizar = (texto: string) => {
        return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, '-');
    };

    const manejarCodigoEscaneado = ({
        data,
    }: {
        data: string;
    }) => {
        // Si ya estamos procesando un QR, ignoramos nuevas detecciones.
        if (procesandoQR.current) {
            return;
        }

        procesandoQR.current = true;
        setEscaneando(false);

        console.log('QR leído:', data);

        // ------------------------------------------
        // 1. Verificar que sea un QR de Mi Ciudad
        // ------------------------------------------

        if (!data.startsWith(PREFIJO_QR)) {
            Alert.alert(
                'QR no válido',
                'Este código QR no pertenece a Mi Ciudad.',
                [
                    {
                        text: 'Intentar de nuevo',
                        onPress: () => {
                            procesandoQR.current = false;
                            setEscaneando(true);
                        },
                    },
                ]
            );

            return;
        }

        // ------------------------------------------
        // 2. Obtener el identificador del lugar
        // ------------------------------------------

        const identificadorQR = data
            .replace(PREFIJO_QR, '')
            .trim();

        const identificadorNormalizado =
            normalizar(identificadorQR);

        // ------------------------------------------
        // 3. Buscar el lugar correspondiente
        // ------------------------------------------

        const equivalenciasQR: Record<string, string> = {
            'museo-historico':
                'museo-historico-regional-de-colon',
        };

        const identificadorFinal =
            equivalenciasQR[identificadorNormalizado] ??
            identificadorNormalizado;

        const lugarQR = lugares.find(
            (lugar) =>
                normalizar(lugar.nombre) ===
                identificadorFinal
        );

        // ------------------------------------------
        // 4. Verificar que el QR exista
        // ------------------------------------------

        if (!lugarQR) {
            Alert.alert(
                'QR no válido',
                'No encontramos un lugar asociado a este código QR.',
                [
                    {
                        text: 'Intentar de nuevo',
                        onPress: () => {
                            procesandoQR.current = false;
                            setEscaneando(true);
                        },
                    },
                ]
            );

            return;
        }

        // ------------------------------------------
        // 5. Verificar que sea el lugar seleccionado
        // ------------------------------------------

        if (
            !lugarEsperado ||
            lugarQR.id !== lugarEsperado.id
        ) {
            Alert.alert(
                'QR incorrecto',
                `Este código corresponde a ${lugarQR.nombre}.\n\nEstás intentando registrar la visita a ${lugarEsperado?.nombre ?? 'otro lugar'
                }.`,
                [
                    {
                        text: 'Intentar de nuevo',
                        onPress: () => {
                            procesandoQR.current = false;
                            setEscaneando(true);
                        },
                    },
                ]
            );

            return;
        }

        // ------------------------------------------
        // 6. Obtener el usuario actual
        // ------------------------------------------

        obtenerUsuarioActual()
            .then((usuario) => {
                if (!usuario) {
                    Alert.alert(
                        'Iniciar sesión',
                        'Necesitás iniciar sesión para registrar una visita.',
                        [
                            {
                                text: 'Aceptar',
                                onPress: () => {
                                    router.back();
                                },
                            },
                        ]
                    );

                    return;
                }

                console.log(
                    '👤 USUARIO ACTUAL:',
                    usuario
                );

                // ------------------------------------------
                // 7. Crear la visita
                // ------------------------------------------

                const nuevaVisita: Visita = {
                    id: `vis-${Date.now()}`,
                    usuarioId: usuario.id,
                    lugarId: lugarQR.id,
                    fechaHora: new Date().toISOString(),
                    origen: 'qr',
                    fotoUri: null,
                    nota: null,
                    sincronizada: false,
                };

                try {
                    guardarVisita(nuevaVisita);

                    console.log(
                        '✅ VISITA QR GUARDADA:',
                        nuevaVisita
                    );

                    // ------------------------------------------
                    // 8. Avisar que se registró correctamente
                    // ------------------------------------------

                    Alert.alert(
                        '¡Visita registrada!',
                        `Visitaste ${lugarQR.nombre}.`,
                        [
                            {
                                text: 'Aceptar',
                                onPress: () => {
                                    router.back();
                                },
                            },
                        ]
                    );
                } catch (error) {
                    console.error(
                        'Error al guardar la visita:',
                        error
                    );

                    Alert.alert(
                        'Error',
                        'No se pudo guardar la visita. Intentá nuevamente.',
                        [
                            {
                                text: 'Intentar de nuevo',
                                onPress: () => {
                                    procesandoQR.current = false;
                                    setEscaneando(true);
                                },
                            },
                        ]
                    );
                }
            })
            .catch((error) => {
                console.error(
                    'Error al obtener el usuario actual:',
                    error
                );

                Alert.alert(
                    'Error',
                    'No se pudo obtener la sesión del usuario.',
                    [
                        {
                            text: 'Intentar de nuevo',
                            onPress: () => {
                                procesandoQR.current = false;
                                setEscaneando(true);
                            },
                        },
                    ]
                );
            });
    };

    // ------------------------------------------
    // Permiso de cámara
    // ------------------------------------------

    if (!permission) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.text}>
                        Cargando cámara...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.title}>
                        Necesitamos acceder a la cámara
                    </Text>

                    <Text style={styles.description}>
                        La cámara se utiliza para escanear el código QR
                        del lugar turístico.
                    </Text>

                    <Pressable
                        style={styles.button}
                        onPress={requestPermission}
                    >
                        <Text style={styles.buttonText}>
                            Dar permiso a la cámara
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.secondaryButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.secondaryButtonText}>
                            Volver
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    // ------------------------------------------
    // Pantalla del escáner
    // ------------------------------------------

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>
                    Escanear código QR
                </Text>

                {lugarEsperado && (
                    <Text style={styles.lugarEsperado}>
                        Apuntá la cámara al código QR de:
                        {'\n'}
                        <Text style={styles.lugarNombre}>
                            {lugarEsperado.nombre}
                        </Text>
                    </Text>
                )}
            </View>

            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={
                        escaneando
                            ? manejarCodigoEscaneado
                            : undefined
                    }
                />

                <View style={styles.scanBox}>
                    <View
                        style={[
                            styles.corner,
                            styles.topLeft,
                        ]}
                    />

                    <View
                        style={[
                            styles.corner,
                            styles.topRight,
                        ]}
                    />

                    <View
                        style={[
                            styles.corner,
                            styles.bottomLeft,
                        ]}
                    />

                    <View
                        style={[
                            styles.corner,
                            styles.bottomRight,
                        ]}
                    />
                </View>
            </View>

            <View style={styles.bottom}>
                <Text style={styles.instruction}>
                    Colocá el código QR dentro del recuadro
                </Text>

                <Pressable
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.cancelButtonText}>
                        Cancelar
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
    },

    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },

    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        alignItems: 'center',
    },

    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },

    description: {
        fontSize: 16,
        color: '#ddd',
        textAlign: 'center',
        lineHeight: 23,
        marginBottom: 25,
    },

    text: {
        color: '#fff',
        fontSize: 16,
    },

    lugarEsperado: {
        color: '#ddd',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },

    lugarNombre: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },

    cameraContainer: {
        flex: 1,
        marginHorizontal: 20,
        borderRadius: 20,
        overflow: 'hidden',
        position: 'relative',
    },

    camera: {
        flex: 1,
    },

    scanBox: {
        position: 'absolute',
        width: 250,
        height: 250,
        top: '50%',
        left: '50%',
        marginLeft: -125,
        marginTop: -125,
    },

    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#fff',
    },

    topLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },

    topRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },

    bottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },

    bottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },

    bottom: {
        padding: 20,
        alignItems: 'center',
    },

    instruction: {
        color: '#ddd',
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 15,
    },

    button: {
        backgroundColor: '#2e7d32',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 10,
        marginBottom: 12,
    },

    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    secondaryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
    },

    secondaryButtonText: {
        color: '#fff',
        fontSize: 16,
    },

    cancelButton: {
        backgroundColor: '#333',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 10,
    },

    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});