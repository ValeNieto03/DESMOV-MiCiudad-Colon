
import { useCallback, useState } from 'react';
import {
    FlatList,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { useCatalogo } from '@/servicios/CatalogoProvider';
import { useThemeContext } from '@/contexts/ThemeContext';

import {
    obtenerUsuarioActual,
} from '@/servicios/autenticacion';

import {
    obtenerVisitas,
    type Visita,
} from '@/servicios/visitas';

export default function MiRecorridoScreen() {
    const { colors } = useThemeContext();

    const { lugaresDisponibles } = useCatalogo();

    const [visitas, setVisitas] = useState<Visita[]>([]);
    const [actualizando, setActualizando] = useState(false);

    const styles = StyleSheet.create({

        container: {
            flex: 1,
            backgroundColor: colors.background,
        },

        header: {
            backgroundColor: colors.background,
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
            color: colors.primary,
            letterSpacing: 1.5,
        },

        title: {
            fontSize: 30,
            fontWeight: '800',
            color: colors.text,
            marginTop: 2,
        },

        subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 3,
        },

        headerIcon: {
            width: 46,
            height: 46,
            borderRadius: 23,
            backgroundColor: colors.backgroundSelected,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 12,
        },

        headerIconText: {
            fontSize: 23,
            color: colors.primary,
        },

        list: {
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 30,
        },

        card: {
            backgroundColor: colors.backgroundElement,
            borderRadius: 18,
            padding: 16,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: colors.border,
        },

        cardHeader: {
            flexDirection: 'row',
            alignItems: 'center',
        },

        placeImage: {
            width: 78,
            height: 78,
            borderRadius: 14,
            marginRight: 13,
            backgroundColor: colors.successBackground,
        },

        iconContainer: {
            width: 78,
            height: 78,
            borderRadius: 14,
            backgroundColor: colors.successBackground,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 13,
        },

        icon: {
            fontSize: 30,
            color: colors.success,
            fontWeight: '700',
        },

        cardTitleContainer: {
            flex: 1,
        },

        placeName: {
            fontSize: 18,
            fontWeight: '800',
            color: colors.text,
        },

        origin: {
            fontSize: 12,
            color: colors.textSecondary,
            marginTop: 5,
            lineHeight: 17,
        },

        separator: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 14,
        },

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
            color: colors.textSecondary,
        },

        infoValue: {
            fontSize: 13,
            fontWeight: '700',
            color: colors.text,
        },

        syncBadge: {
            marginTop: 14,
            paddingVertical: 9,
            paddingHorizontal: 11,
            borderRadius: 10,
            backgroundColor: colors.successBackground,
            flexDirection: 'row',
            alignItems: 'center',
        },

        pendingBadge: {
            marginTop: 14,
            paddingVertical: 9,
            paddingHorizontal: 11,
            borderRadius: 10,
            backgroundColor: colors.warningBackground,
            flexDirection: 'row',
            alignItems: 'center',
        },

        syncDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.success,
            marginRight: 8,
        },

        pendingDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.warning,
            marginRight: 8,
        },

        syncText: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.success,
        },

        pendingText: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.warning,
        },

        noteContainer: {
            marginTop: 12,
            padding: 12,
            backgroundColor: colors.background,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
        },

        noteTitle: {
            fontSize: 12,
            fontWeight: '800',
            color: colors.text,
            marginBottom: 5,
        },

        noteText: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 19,
        },

        photoContainer: {
            marginTop: 12,
            padding: 10,
            backgroundColor: colors.backgroundSelected,
            borderRadius: 10,
        },

        photoText: {
            fontSize: 12,
            color: colors.primary,
            fontWeight: '700',
        },

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
            backgroundColor: colors.backgroundSelected,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
        },

        emptyIcon: {
            fontSize: 38,
            color: colors.primary,
        },

        emptyTitle: {
            fontSize: 21,
            fontWeight: '800',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 8,
        },

        emptyText: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 21,
            maxWidth: 300,
        },
    });

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

        try {
            await cargarVisitas();
        } finally {
            setActualizando(false);
        }
    };

    // ------------------------------------------
    // Obtener lugar
    // ------------------------------------------

    const obtenerLugar = (lugarId: string) => {
        return lugaresDisponibles.find(
            (item) =>
                item.id === lugarId ||
                item.apiId === lugarId
        );
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
            <View style={styles.card}>

                {/* Encabezado */}
                <View style={styles.cardHeader}>

                    {/* Imagen del lugar */}
                    {lugar?.imagen ? (
                        <Image
                            source={lugar.imagen}
                            style={styles.placeImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>
                                {obtenerIconoOrigen(item.origen)}
                            </Text>
                        </View>
                    )}

                    {/* Información del lugar */}
                    <View style={styles.cardTitleContainer}>

                        <Text
                            style={styles.placeName}
                            numberOfLines={2}
                        >
                            {lugar?.nombre ?? 'Lugar turístico'}
                        </Text>

                        <Text
                            style={styles.origin}
                            numberOfLines={2}
                        >
                            {obtenerTextoOrigen(item.origen)}
                        </Text>

                    </View>

                </View>

                {/* Separador */}
                <View style={styles.separator} />

                {/* Información */}
                <View style={styles.infoContainer}>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Fecha
                        </Text>

                        <Text style={styles.infoValue}>
                            {formatearFecha(item.fechaHora)}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>
                            Hora
                        </Text>

                        <Text style={styles.infoValue}>
                            {formatearHora(item.fechaHora)}
                        </Text>
                    </View>

                </View>

                {/* Estado de sincronización */}
                <View
                    style={
                        item.sincronizada
                            ? styles.syncBadge
                            : styles.pendingBadge
                    }
                >
                    <View
                        style={
                            item.sincronizada
                                ? styles.syncDot
                                : styles.pendingDot
                        }
                    />

                    <Text
                        style={
                            item.sincronizada
                                ? styles.syncText
                                : styles.pendingText
                        }
                    >
                        {item.sincronizada
                            ? 'Sincronizada'
                            : 'Pendiente de sincronización'}
                    </Text>
                </View>

                {/* Nota */}
                {item.nota && (
                    <View style={styles.noteContainer}>

                        <Text style={styles.noteTitle}>
                            Nota
                        </Text>

                        <Text style={styles.noteText}>
                            {item.nota}
                        </Text>

                    </View>
                )}

                {/* Foto de la visita */}
                {item.fotoUri && (
                    <View style={styles.photoContainer}>

                        <Text style={styles.photoText}>
                            Foto de la visita guardada
                        </Text>

                    </View>
                )}

            </View>
        );
    };

    // ------------------------------------------
    // Pantalla
    // ------------------------------------------

    return (
        <SafeAreaView style={styles.container}>

            {/* Encabezado */}
            <View style={styles.header}>

                <View style={styles.headerTextContainer}>
                    <Text style={styles.smallTitle}>
                        MI EXPERIENCIA
                    </Text>

                    <Text style={styles.title}>
                        Mi recorrido
                    </Text>

                    <Text style={styles.subtitle}>
                        Los lugares que visitaste en Colón
                    </Text>
                </View>

                <View style={styles.headerIcon}>
                    <Text style={styles.headerIconText}>
                        ⌖
                    </Text>
                </View>

            </View>

            {/* Contenido */}
            {visitas.length === 0 ? (

                <View style={styles.emptyContainer}>

                    <View style={styles.emptyIconContainer}>
                        <Text style={styles.emptyIcon}>
                            ⌖
                        </Text>
                    </View>

                    <Text style={styles.emptyTitle}>
                        Todavía no tenés visitas
                    </Text>

                    <Text style={styles.emptyText}>
                        Cuando registres un lugar turístico,
                        aparecerá acá.
                    </Text>

                </View>

            ) : (

                <FlatList
                    data={visitas}
                    keyExtractor={(item) => item.id}
                    renderItem={renderVisita}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={actualizando}
                            onRefresh={actualizar}
                            tintColor={colors.primary}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                />

            )}

        </SafeAreaView>
    );
}