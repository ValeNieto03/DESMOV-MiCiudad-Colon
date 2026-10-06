import { useCallback, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { lugares } from '@/data/lugares';
import {
    eliminarFavorito,
    obtenerFavoritos,
} from '@/servicios/favoritos';
import { obtenerUsuarioActual } from '@/servicios/autenticacion';

export default function FavoritosScreen() {
    const router = useRouter();

    const [favoritos, setFavoritos] = useState<string[]>([]);
    const [cargando, setCargando] = useState(true);

    const cargarFavoritos = useCallback(async () => {
        try {
            setCargando(true);

            const usuario = await obtenerUsuarioActual();

            if (!usuario) {
                setFavoritos([]);
                return;
            }

            const favoritosGuardados = await obtenerFavoritos(usuario.id);

            setFavoritos(favoritosGuardados);
        } catch (error) {
            console.log('❌ ERROR AL CARGAR FAVORITOS:', error);
            Alert.alert(
                'Error',
                'No se pudieron cargar tus favoritos.'
            );
        } finally {
            setCargando(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            cargarFavoritos();
        }, [cargarFavoritos])
    );

    const lugaresFavoritos = lugares.filter((lugar) =>
        favoritos.includes(lugar.id)
    );

    const quitarFavorito = async (lugarId: string) => {
        try {
            const usuario = await obtenerUsuarioActual();

            if (!usuario) {
                Alert.alert(
                    'Iniciar sesión',
                    'Necesitás iniciar sesión para administrar tus favoritos.'
                );
                return;
            }

            await eliminarFavorito(usuario.id, lugarId);

            setFavoritos((favoritosActuales) =>
                favoritosActuales.filter((id) => id !== lugarId)
            );

            Alert.alert(
                'Favorito eliminado',
                'El lugar se quitó de tus favoritos.'
            );
        } catch (error) {
            console.log(
                '❌ ERROR AL ELIMINAR FAVORITO:',
                error
            );

            Alert.alert(
                'Error',
                'No se pudo eliminar el favorito.'
            );
        }
    };

    const abrirLugar = (lugarId: string) => {
        router.push({
            pathname: '/lugar-detalle',
            params: {
                id: lugarId,
            },
        });
    };

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={['top']}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backIcon}>‹</Text>
                    </Pressable>

                    <View style={styles.headerTextContainer}>
                        <Text style={styles.title}>Mis favoritos</Text>
                        <Text style={styles.subtitle}>
                            Lugares que guardaste para visitar
                        </Text>
                    </View>
                </View>

                {cargando ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>♡</Text>

                        <Text style={styles.emptyTitle}>
                            Cargando favoritos...
                        </Text>
                    </View>
                ) : lugaresFavoritos.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>♡</Text>

                        <Text style={styles.emptyTitle}>
                            Todavía no tenés favoritos
                        </Text>

                        <Text style={styles.emptyText}>
                            Cuando encuentres un lugar que te interese,
                            tocá el corazón para guardarlo acá.
                        </Text>

                        <Pressable
                            style={styles.exploreButton}
                            onPress={() => router.push('/')}
                        >
                            <Text style={styles.exploreButtonText}>
                                Explorar lugares
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.countContainer}>
                            <Text style={styles.countText}>
                                {lugaresFavoritos.length}{' '}
                                {lugaresFavoritos.length === 1
                                    ? 'lugar guardado'
                                    : 'lugares guardados'}
                            </Text>
                        </View>

                        {lugaresFavoritos.map((lugar) => (
                            <Pressable
                                key={lugar.id}
                                style={styles.card}
                                onPress={() => abrirLugar(lugar.id)}
                            >
                                <Image
                                    source={lugar.imagen}
                                    style={styles.image}
                                    resizeMode="cover"
                                />

                                <View style={styles.cardContent}>
                                    <Text
                                        style={styles.category}
                                        numberOfLines={1}
                                    >
                                        {lugar.categoria}
                                    </Text>

                                    <Text
                                        style={styles.placeName}
                                        numberOfLines={2}
                                    >
                                        {lugar.nombre}
                                    </Text>

                                    <Text
                                        style={styles.address}
                                        numberOfLines={2}
                                    >
                                        {lugar.direccion}
                                    </Text>
                                </View>

                                <Pressable
                                    style={styles.removeButton}
                                    onPress={(event) => {
                                        event.stopPropagation();
                                        quitarFavorito(lugar.id);
                                    }}
                                >
                                    <Text style={styles.removeIcon}>♥</Text>
                                </Pressable>
                            </Pressable>
                        ))}
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F7F3E8',
    },

    container: {
        flex: 1,
        backgroundColor: '#F7F3E8',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E3E1D8',
        backgroundColor: '#F7F3E8',
    },

    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E3E1D8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },

    backIcon: {
        fontSize: 32,
        lineHeight: 34,
        color: '#253A32',
        marginTop: -3,
    },

    headerTextContainer: {
        flex: 1,
    },

    title: {
        fontSize: 25,
        fontWeight: '800',
        color: '#253A32',
    },

    subtitle: {
        marginTop: 3,
        fontSize: 14,
        color: '#6E756F',
    },

    list: {
        padding: 20,
        paddingBottom: 110,
    },

    countContainer: {
        marginBottom: 12,
    },

    countText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B8E5A',
    },

    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 10,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E8E5DD',
    },

    image: {
        width: 82,
        height: 82,
        borderRadius: 14,
        backgroundColor: '#DCE9E8',
    },

    cardContent: {
        flex: 1,
        marginLeft: 12,
        marginRight: 8,
    },

    category: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2F7F8F',
        textTransform: 'uppercase',
        marginBottom: 3,
    },

    placeName: {
        fontSize: 17,
        fontWeight: '800',
        color: '#253A32',
        lineHeight: 21,
    },

    address: {
        fontSize: 12,
        color: '#777D78',
        marginTop: 5,
        lineHeight: 16,
    },

    removeButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#E5EFE4',
        justifyContent: 'center',
        alignItems: 'center',
    },

    removeIcon: {
        fontSize: 22,
        color: '#6B8E5A',
    },

    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 35,
        paddingBottom: 80,
    },

    emptyIcon: {
        fontSize: 58,
        color: '#6B8E5A',
        marginBottom: 12,
    },

    emptyTitle: {
        fontSize: 21,
        fontWeight: '800',
        color: '#253A32',
        textAlign: 'center',
    },

    emptyText: {
        marginTop: 10,
        fontSize: 15,
        lineHeight: 22,
        color: '#6E756F',
        textAlign: 'center',
    },

    exploreButton: {
        marginTop: 22,
        paddingHorizontal: 24,
        paddingVertical: 13,
        borderRadius: 14,
        backgroundColor: '#2F7F8F',
    },

    exploreButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
});