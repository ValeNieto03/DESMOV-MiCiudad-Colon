import { useThemedStyles } from "@/hooks/use-theme";
import { useCallback, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { lugares } from '@/data/lugares';

import {
    obtenerUsuarioActual,
} from '@/servicios/autenticacion';

import {
    actualizarRecuerdosVisita,
    obtenerVisitas,
    type Visita,
} from '@/servicios/visitas';
import { sincronizarVisita } from '@/servicios/sincronizacion-visitas';

export default function MiRecorridoScreen() {
  const themedStyles = useThemedStyles(styles);
    const [visitas, setVisitas] = useState<Visita[]>([]);
    const [actualizando, setActualizando] = useState(false);
    const [visitaEnEdicion, setVisitaEnEdicion] = useState<Visita | null>(null);
    const [notaTemporal, setNotaTemporal] = useState('');
    const [fotoTemporalUri, setFotoTemporalUri] = useState<string | null>(null);
    const [guardandoRecuerdo, setGuardandoRecuerdo] = useState(false);
    const [sincronizando, setSincronizando] = useState(false);

    // ------------------------------------------
    // Cargar visitas del usuario actual
    // ------------------------------------------

    const cargarVisitas = useCallback(async () => {
        try {
            const usuario = await obtenerUsuarioActual();

            if (!usuario) {
                setVisitas([]);

                console.log(
                    '⚠️ No hay usuario con sesión iniciada'
                );

                return;
            }

            const visitasGuardadas = obtenerVisitas();

            const visitasDelUsuario =
                visitasGuardadas.filter(
                    (visita) =>
                        visita.usuarioId === usuario.id
                );

            setVisitas(visitasDelUsuario);

            console.log(
                '👤 Usuario actual:',
                usuario.id
            );

            console.log(
                '📚 Visitas del usuario cargadas desde SQLite:',
                visitasDelUsuario
            );
        } catch (error) {
            console.error(
                'Error al cargar las visitas:',
                error
            );

            setVisitas([]);
        }
    }, []);

    // ------------------------------------------
    // Recargar al entrar a la pantalla
    // ------------------------------------------

    useFocusEffect(
        useCallback(() => {
            cargarVisitas();
        }, [cargarVisitas])
    );

    // ------------------------------------------
    // Actualizar
    // ------------------------------------------

    const actualizar = async () => {
        setActualizando(true);

        await cargarVisitas();

        setActualizando(false);
    };

    const visitasPendientes = visitas.filter(
        (visita) => !visita.sincronizada && visita.origen !== 'demo'
    );

    const sincronizarPendientes = async () => {
        if (sincronizando || visitasPendientes.length === 0) return;

        setSincronizando(true);
        let cantidadSincronizada = 0;

        try {
            for (const visita of visitasPendientes) {
                try {
                    await sincronizarVisita(visita);
                    cantidadSincronizada += 1;
                } catch (error) {
                    console.error(
                        `No se pudo sincronizar la visita ${visita.id}:`,
                        error
                    );
                }
            }

            await cargarVisitas();

            const pendientesRestantes = visitasPendientes.length - cantidadSincronizada;
            Alert.alert(
                pendientesRestantes === 0
                    ? 'Sincronización completa'
                    : 'Sincronización parcial',
                pendientesRestantes === 0
                    ? `Se sincronizaron ${cantidadSincronizada} visitas.`
                    : `Se sincronizaron ${cantidadSincronizada} de ${visitasPendientes.length}. Revisá la conexión y volvé a intentar con las pendientes.`
            );
        } finally {
            setSincronizando(false);
        }
    };

    // ------------------------------------------
    // Obtener lugar
    // ------------------------------------------

    const obtenerLugar = (lugarId: string) => {
        return lugares.find(
            (item) => item.id === lugarId
        );
    };

    const editarRecuerdos = (visita: Visita) => {
        setVisitaEnEdicion(visita);
        setNotaTemporal(visita.nota ?? '');
        setFotoTemporalUri(visita.fotoUri);
    };

    const tomarFotoRecuerdo = async () => {
        try {
            const permiso = await ImagePicker.requestCameraPermissionsAsync();

            if (!permiso.granted) {
                Alert.alert(
                    'Permiso de cámara necesario',
                    'Permití el acceso a la cámara para agregar una foto.'
                );
                return;
            }

            const resultado = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.8,
            });

            if (!resultado.canceled && resultado.assets[0]) {
                setFotoTemporalUri(resultado.assets[0].uri);
            }
        } catch (error) {
            console.error('Error al tomar una foto del recuerdo:', error);
            Alert.alert('No se pudo abrir la cámara', 'Intentá nuevamente.');
        }
    };

    const guardarRecuerdos = async () => {
        if (!visitaEnEdicion) return;

        try {
            setGuardandoRecuerdo(true);
            let fotoUriGuardada = visitaEnEdicion.fotoUri;

            if (fotoTemporalUri && fotoTemporalUri !== visitaEnEdicion.fotoUri) {
                const directorio = new Directory(Paths.document, 'visitas');

                if (!directorio.exists) {
                    directorio.create({ intermediates: true });
                }

                const fotoTemporal = new File(fotoTemporalUri);
                const fotoPermanente = new File(
                    directorio,
                    `${visitaEnEdicion.id}.jpg`
                );
                await fotoTemporal.copy(fotoPermanente, { overwrite: true });
                fotoUriGuardada = fotoPermanente.uri;
            }

            actualizarRecuerdosVisita(
                visitaEnEdicion.id,
                notaTemporal.trim() || null,
                fotoUriGuardada
            );
            await cargarVisitas();
            setVisitaEnEdicion(null);
        } catch (error) {
            console.error('Error al guardar los recuerdos de la visita:', error);
            Alert.alert(
                'No se pudieron guardar',
                'Revisá el espacio disponible e intentá nuevamente.'
            );
        } finally {
            setGuardandoRecuerdo(false);
        }
    };

    // ------------------------------------------
    // Obtener icono según origen
    // ------------------------------------------

    const obtenerIconoOrigen = (
        origen: Visita['origen']
    ) => {
        switch (origen) {
            case 'qr':
                return '▣';

            case 'gps':
                return '⌖';

            case 'manual':
                return '✎';

            default:
                return '•';
        }
    };

    // ------------------------------------------
    // Obtener texto según origen
    // ------------------------------------------

    const obtenerTextoOrigen = (
        origen: Visita['origen']
    ) => {
        switch (origen) {
            case 'qr':
                return 'Registrada mediante código QR';

            case 'gps':
                return 'Registrada mediante ubicación';

            case 'manual':
                return 'Registrada manualmente';

            default:
                return 'Visita registrada';
        }
    };

    // ------------------------------------------
    // Formatear fecha
    // ------------------------------------------

    const formatearFecha = (fecha: string) => {
        const fechaObjeto = new Date(fecha);

        return fechaObjeto.toLocaleDateString(
            'es-AR',
            {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            }
        );
    };

    // ------------------------------------------
    // Formatear hora
    // ------------------------------------------

    const formatearHora = (fecha: string) => {
        const fechaObjeto = new Date(fecha);

        return fechaObjeto.toLocaleTimeString(
            'es-AR',
            {
                hour: '2-digit',
                minute: '2-digit',
            }
        );
    };

    // ------------------------------------------
    // Renderizar una visita
    // ------------------------------------------

    const renderVisita = ({
        item,
    }: {
        item: Visita;
    }) => {
        const lugar = obtenerLugar(item.lugarId);

        return (
            <View style={themedStyles.card}>

                {/* Encabezado */}
                <View style={themedStyles.cardHeader}>

                    {/* Imagen del lugar */}
                    {lugar?.imagen ? (
                        <Image
                            source={lugar.imagen}
                            style={themedStyles.placeImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={themedStyles.iconContainer}>
                            <Text style={themedStyles.icon}>
                                {obtenerIconoOrigen(item.origen)}
                            </Text>
                        </View>
                    )}

                    {/* Información del lugar */}
                    <View style={themedStyles.cardTitleContainer}>

                        <Text
                            style={themedStyles.placeName}
                            numberOfLines={2}
                        >
                            {lugar?.nombre ?? 'Lugar turístico'}
                        </Text>

                        <Text
                            style={themedStyles.origin}
                            numberOfLines={2}
                        >
                            {obtenerTextoOrigen(item.origen)}
                        </Text>

                    </View>

                </View>

                {/* Separador */}
                <View style={themedStyles.separator} />

                {/* Información */}
                <View style={themedStyles.infoContainer}>

                    <View style={themedStyles.infoRow}>
                        <Text style={themedStyles.infoLabel}>
                            Fecha
                        </Text>

                        <Text style={themedStyles.infoValue}>
                            {formatearFecha(item.fechaHora)}
                        </Text>
                    </View>

                    <View style={themedStyles.infoRow}>
                        <Text style={themedStyles.infoLabel}>
                            Hora
                        </Text>

                        <Text style={themedStyles.infoValue}>
                            {formatearHora(item.fechaHora)}
                        </Text>
                    </View>

                </View>

                {/* Estado de sincronización */}
                <View
                    style={
                        item.sincronizada
                            ? themedStyles.syncBadge
                            : themedStyles.pendingBadge
                    }
                >
                    <View
                        style={
                            item.sincronizada
                                ? themedStyles.syncDot
                                : themedStyles.pendingDot
                        }
                    />

                    <Text
                        style={
                            item.sincronizada
                                ? themedStyles.syncText
                                : themedStyles.pendingText
                        }
                    >
                        {item.sincronizada
                            ? 'Sincronizada'
                            : 'Pendiente de sincronización'}
                    </Text>
                </View>

                {/* Nota */}
                {item.nota && (
                    <View style={themedStyles.noteContainer}>

                        <Text style={themedStyles.noteTitle}>
                            Nota
                        </Text>

                        <Text style={themedStyles.noteText}>
                            {item.nota}
                        </Text>

                    </View>
                )}

                {/* Foto de la visita */}
                {item.fotoUri && (
                    <View style={themedStyles.photoContainer}>
                        <Image
                            source={{ uri: item.fotoUri }}
                            style={themedStyles.photoImage}
                            resizeMode="cover"
                            accessibilityLabel="Foto de la visita"
                        />
                        <Text style={themedStyles.photoText}>
                            Foto de la visita guardada
                        </Text>

                    </View>
                )}

                <Pressable
                    style={themedStyles.editMemoriesButton}
                    onPress={() => editarRecuerdos(item)}
                    accessibilityRole="button"
                    accessibilityLabel={item.nota || item.fotoUri
                        ? 'Editar nota o foto de la visita'
                        : 'Agregar nota o foto a la visita'}
                >
                    <Text style={themedStyles.editMemoriesButtonText}>
                        {item.nota || item.fotoUri
                            ? 'Editar nota o foto'
                            : 'Agregar nota o foto'}
                    </Text>
                </Pressable>

            </View>
        );
    };

    // ------------------------------------------
    // Pantalla
    // ------------------------------------------

    return (
        <SafeAreaView style={themedStyles.container}>

            {/* Encabezado */}
            <View style={themedStyles.header}>

                <View style={themedStyles.headerTextContainer}>
                    <Text style={themedStyles.smallTitle}>
                        MI EXPERIENCIA
                    </Text>

                    <Text style={themedStyles.title}>
                        Mi recorrido
                    </Text>

                    <Text style={themedStyles.subtitle}>
                        Los lugares que visitaste en Colón
                    </Text>
                </View>

                <View style={themedStyles.headerIcon}>
                    <Text style={themedStyles.headerIconText}>
                        ⌖
                    </Text>
                </View>

            </View>

            {visitasPendientes.length > 0 && (
                <Pressable
                    style={themedStyles.syncAction}
                    onPress={sincronizarPendientes}
                    disabled={sincronizando}
                    accessibilityRole="button"
                    accessibilityLabel={`Sincronizar ${visitasPendientes.length} visitas pendientes`}
                >
                    {sincronizando ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={themedStyles.syncActionText}>
                            Sincronizar {visitasPendientes.length} visitas pendientes
                        </Text>
                    )}
                </Pressable>
            )}

            {/* Contenido */}
            {visitas.length === 0 ? (

                <View style={themedStyles.emptyContainer}>

                    <View style={themedStyles.emptyIconContainer}>
                        <Text style={themedStyles.emptyIcon}>
                            ⌖
                        </Text>
                    </View>

                    <Text style={themedStyles.emptyTitle}>
                        Todavía no tenés visitas
                    </Text>

                    <Text style={themedStyles.emptyText}>
                        Cuando registres un lugar turístico,
                        aparecerá acá.
                    </Text>

                </View>

            ) : (

                <FlatList
                    data={visitas}
                    keyExtractor={(item) => item.id}
                    renderItem={renderVisita}
                    contentContainerStyle={themedStyles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={actualizando}
                            onRefresh={actualizar}
                            tintColor="#2F7F8F"
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />

            )}

            <Modal
                visible={visitaEnEdicion !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setVisitaEnEdicion(null)}
            >
                <View style={themedStyles.modalOverlay}>
                    <View style={themedStyles.modalCard}>
                        <Text style={themedStyles.modalTitle}>
                            Un recuerdo de tu visita
                        </Text>
                        <Text style={themedStyles.modalSubtitle}>
                            La nota y la foto son opcionales. Esto no cambia cómo registraste la visita.
                        </Text>

                        <TextInput
                            style={themedStyles.noteInput}
                            value={notaTemporal}
                            onChangeText={setNotaTemporal}
                            placeholder="Escribí una nota corta..."
                            placeholderTextColor="#77736B"
                            maxLength={160}
                            multiline
                            textAlignVertical="top"
                            accessibilityLabel="Nota opcional de la visita"
                        />

                        <Pressable
                            style={themedStyles.cameraButton}
                            onPress={tomarFotoRecuerdo}
                            accessibilityRole="button"
                        >
                            <Text style={themedStyles.cameraButtonText}>
                                {fotoTemporalUri ? '📷 Cambiar foto' : '📷 Sacar una foto'}
                            </Text>
                        </Pressable>

                        {fotoTemporalUri && (
                            <Image
                                source={{ uri: fotoTemporalUri }}
                                style={themedStyles.previewImage}
                                resizeMode="cover"
                                accessibilityLabel="Vista previa de la foto"
                            />
                        )}

                        <Pressable
                            style={themedStyles.saveButton}
                            onPress={guardarRecuerdos}
                            disabled={guardandoRecuerdo}
                        >
                            {guardandoRecuerdo ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={themedStyles.saveButtonText}>Guardar</Text>
                            )}
                        </Pressable>

                        <Pressable
                            style={themedStyles.cancelButton}
                            onPress={() => setVisitaEnEdicion(null)}
                            disabled={guardandoRecuerdo}
                        >
                            <Text style={themedStyles.cancelButtonText}>Cancelar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    // ------------------------------------------
    // Pantalla
    // ------------------------------------------

    container: {
        flex: 1,
        backgroundColor: '#F7F3E8',
    },

    // ------------------------------------------
    // Encabezado
    // ------------------------------------------

    header: {
        backgroundColor: '#F7F3E8',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    headerTextContainer: {
        flex: 1,
    },

    smallTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2F7F8F',
        letterSpacing: 1.5,
    },

    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#253A32',
        marginTop: 2,
    },

    subtitle: {
        fontSize: 14,
        color: '#77736B',
        marginTop: 3,
    },

    headerIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#DCE9E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },

    headerIconText: {
        fontSize: 23,
        color: '#2F7F8F',
    },

    syncAction: {
        marginHorizontal: 20,
        marginBottom: 12,
        paddingVertical: 13,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#28745A',
        alignItems: 'center',
    },

    syncActionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },

    // ------------------------------------------
    // Lista
    // ------------------------------------------

    list: {
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 30,
    },

    // ------------------------------------------
    // Tarjeta
    // ------------------------------------------

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E3E1D8',
    },

    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    // ------------------------------------------
    // Imagen del lugar
    // ------------------------------------------

    placeImage: {
        width: 78,
        height: 78,
        borderRadius: 14,
        marginRight: 13,
        backgroundColor: '#E5EFE4',
    },

    // ------------------------------------------
    // Imagen alternativa
    // ------------------------------------------

    iconContainer: {
        width: 78,
        height: 78,
        borderRadius: 14,
        backgroundColor: '#E5EFE4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 13,
    },

    icon: {
        fontSize: 30,
        color: '#6B8E5A',
        fontWeight: '700',
    },

    // ------------------------------------------
    // Información del lugar
    // ------------------------------------------

    cardTitleContainer: {
        flex: 1,
    },

    placeName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#253A32',
    },

    origin: {
        fontSize: 12,
        color: '#77736B',
        marginTop: 5,
        lineHeight: 17,
    },

    separator: {
        height: 1,
        backgroundColor: '#E8E5DD',
        marginVertical: 14,
    },

    // ------------------------------------------
    // Información
    // ------------------------------------------

    infoContainer: {
        gap: 8,
    },

    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    infoLabel: {
        fontSize: 13,
        color: '#77736B',
    },

    infoValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#30352F',
    },

    // ------------------------------------------
    // Sincronización
    // ------------------------------------------

    syncBadge: {
        marginTop: 14,
        paddingVertical: 9,
        paddingHorizontal: 11,
        borderRadius: 10,
        backgroundColor: '#E5EFE4',
        flexDirection: 'row',
        alignItems: 'center',
    },

    pendingBadge: {
        marginTop: 14,
        paddingVertical: 9,
        paddingHorizontal: 11,
        borderRadius: 10,
        backgroundColor: '#F0F3EC',
        flexDirection: 'row',
        alignItems: 'center',
    },

    syncDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#6B8E5A',
        marginRight: 8,
    },

    pendingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#2F7F8F',
        marginRight: 8,
    },

    syncText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#557448',
    },

    pendingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2F7F8F',
    },

    // ------------------------------------------
    // Nota
    // ------------------------------------------

    noteContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#F7F3E8',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E8E5DD',
    },

    noteTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#253A32',
        marginBottom: 5,
    },

    noteText: {
        fontSize: 13,
        color: '#55584F',
        lineHeight: 19,
    },

    // ------------------------------------------
    // Foto de visita
    // ------------------------------------------

    photoContainer: {
        marginTop: 12,
        padding: 10,
        backgroundColor: '#DCE9E8',
        borderRadius: 10,
    },

    photoImage: {
        width: '100%',
        height: 180,
        borderRadius: 8,
        marginBottom: 8,
    },

    photoText: {
        fontSize: 12,
        color: '#2F7F8F',
        fontWeight: '700',
    },

    editMemoriesButton: {
        marginTop: 12,
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: '#DCE9E8',
        alignItems: 'center',
    },

    editMemoriesButtonText: {
        color: '#2F7F8F',
        fontSize: 14,
        fontWeight: '700',
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        padding: 20,
    },

    modalCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        maxHeight: '90%',
    },

    modalTitle: {
        color: '#253A32',
        fontSize: 22,
        fontWeight: '800',
    },

    modalSubtitle: {
        color: '#77736B',
        marginTop: 8,
        marginBottom: 14,
        lineHeight: 20,
    },

    noteInput: {
        minHeight: 90,
        borderWidth: 1,
        borderColor: '#D8D2C4',
        borderRadius: 10,
        padding: 12,
        color: '#253A32',
        backgroundColor: '#F7F3E8',
    },

    cameraButton: {
        marginTop: 12,
        padding: 13,
        backgroundColor: '#DCE9E8',
        borderRadius: 10,
        alignItems: 'center',
    },

    cameraButtonText: {
        color: '#2F7F8F',
        fontWeight: '700',
    },

    previewImage: {
        height: 150,
        width: '100%',
        borderRadius: 10,
        marginTop: 12,
    },

    saveButton: {
        marginTop: 16,
        padding: 14,
        backgroundColor: '#28745A',
        borderRadius: 10,
        alignItems: 'center',
    },

    saveButtonText: {
        color: '#FFFFFF',
        fontWeight: '800',
    },

    cancelButton: {
        padding: 12,
        alignItems: 'center',
    },

    cancelButtonText: {
        color: '#77736B',
        fontWeight: '700',
    },

    // ------------------------------------------
    // Estado vacío
    // ------------------------------------------

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 35,
    },

    emptyIconContainer: {
        width: 82,
        height: 82,
        borderRadius: 41,
        backgroundColor: '#DCE9E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },

    emptyIcon: {
        fontSize: 38,
        color: '#2F7F8F',
    },

    emptyTitle: {
        fontSize: 21,
        fontWeight: '800',
        color: '#253A32',
        textAlign: 'center',
        marginBottom: 8,
    },

    emptyText: {
        fontSize: 14,
        color: '#77736B',
        textAlign: 'center',
        lineHeight: 21,
        maxWidth: 300,
    },

});