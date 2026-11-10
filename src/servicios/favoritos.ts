
import AsyncStorage from '@react-native-async-storage/async-storage';

import { consultarAPI } from '@/servicios/api';

const FAVORITOS_KEY = 'mi-ciudad-favoritos';

type FavoritosPorUsuario = Record<string, string[]>;

export interface FavoritoAPI {
    id: string;
    usuarioId: string;
    lugarId: string;
    creadoEn: string;
}

interface RespuestaFavoritosAPI {
    datos: FavoritoAPI[];
    meta: {
        total: number;
        pagina: number;
        porPagina: number;
    } | null;
}

// ------------------------------------------
// Obtener favoritos guardados localmente
// ------------------------------------------

async function obtenerFavoritosGuardados(): Promise<FavoritosPorUsuario> {
    const favoritosGuardados = await AsyncStorage.getItem(FAVORITOS_KEY);

    if (!favoritosGuardados) {
        return {};
    }

    try {
        return JSON.parse(favoritosGuardados) as FavoritosPorUsuario;
    } catch {
        return {};
    }
}

// ------------------------------------------
// Guardar favoritos localmente
// ------------------------------------------

async function guardarFavoritos(
    favoritos: FavoritosPorUsuario,
): Promise<void> {
    await AsyncStorage.setItem(
        FAVORITOS_KEY,
        JSON.stringify(favoritos),
    );
}

// ------------------------------------------
// Actualizar respaldo local
// ------------------------------------------

async function actualizarFavoritosLocales(
    usuarioId: string,
    lugarIds: string[],
): Promise<void> {
    const favoritos = await obtenerFavoritosGuardados();

    favoritos[usuarioId] = lugarIds;

    await guardarFavoritos(favoritos);
}

// ------------------------------------------
// Obtener favoritos del backend
// ------------------------------------------


export async function obtenerFavoritos(
    usuarioId: string,
): Promise<string[]> {
    try {
        const favoritosAPI = await consultarAPI<FavoritoAPI[]>(
            '/yo/favoritos',
            {},
            true,
        );

        console.log('⭐ Favoritos recibidos del backend:', favoritosAPI);

        const lugarIds = favoritosAPI.map(
            (favorito) => favorito.lugarId,
        );

        console.log('⭐ IDs de lugares favoritos:', lugarIds);

        await actualizarFavoritosLocales(usuarioId, lugarIds);

        return lugarIds;
    } catch (error) {
        console.error('❌ Error al obtener favoritos:', error);

        if (
            error instanceof Error &&
            error.message === 'API_NO_DISPONIBLE'
        ) {
            const favoritos = await obtenerFavoritosGuardados();
            return favoritos[usuarioId] ?? [];
        }

        throw error;
    }
}

// ------------------------------------------
// Saber si un lugar es favorito
// ------------------------------------------

export async function esFavorito(
    usuarioId: string,
    lugarId: string,
): Promise<boolean> {
    const favoritos = await obtenerFavoritos(usuarioId);

    return favoritos.includes(lugarId);
}

// ------------------------------------------
// Agregar un favorito
// ------------------------------------------

export async function agregarFavorito(
    usuarioId: string,
    lugarId: string,
): Promise<void> {
    await consultarAPI(
        `/yo/favoritos/${encodeURIComponent(lugarId)}`,
        {
            method: 'PUT',
        },
        true,
    );

    const favoritos = await obtenerFavoritosGuardados();
    const favoritosUsuario = favoritos[usuarioId] ?? [];

    if (!favoritosUsuario.includes(lugarId)) {
        favoritos[usuarioId] = [
            ...favoritosUsuario,
            lugarId,
        ];

        await guardarFavoritos(favoritos);
    }
}

// ------------------------------------------
// Eliminar un favorito
// ------------------------------------------

export async function eliminarFavorito(
    usuarioId: string,
    lugarId: string,
): Promise<void> {
    await consultarAPI(
        `/yo/favoritos/${encodeURIComponent(lugarId)}`,
        {
            method: 'DELETE',
        },
        true,
    );

    const favoritos = await obtenerFavoritosGuardados();

    favoritos[usuarioId] = (
        favoritos[usuarioId] ?? []
    ).filter((id) => id !== lugarId);

    await guardarFavoritos(favoritos);
}

// ------------------------------------------
// Alternar favorito
// ------------------------------------------

export async function alternarFavorito(
    usuarioId: string,
    lugarId: string,
): Promise<boolean> {
    const favorito = await esFavorito(usuarioId, lugarId);

    if (favorito) {
        await eliminarFavorito(usuarioId, lugarId);
        return false;
    }

    await agregarFavorito(usuarioId, lugarId);
    return true;
}
