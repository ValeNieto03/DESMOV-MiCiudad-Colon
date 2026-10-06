import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITOS_KEY = 'mi-ciudad-favoritos';

type FavoritosPorUsuario = Record<string, string[]>;

// ------------------------------------------
// Obtener todos los favoritos guardados
// ------------------------------------------

async function obtenerFavoritosGuardados(): Promise<FavoritosPorUsuario> {
    const favoritosGuardados =
        await AsyncStorage.getItem(FAVORITOS_KEY);

    if (!favoritosGuardados) {
        return {};
    }

    try {
        return JSON.parse(
            favoritosGuardados
        ) as FavoritosPorUsuario;
    } catch {
        return {};
    }
}

// ------------------------------------------
// Guardar todos los favoritos
// ------------------------------------------

async function guardarFavoritos(
    favoritos: FavoritosPorUsuario
): Promise<void> {
    await AsyncStorage.setItem(
        FAVORITOS_KEY,
        JSON.stringify(favoritos)
    );
}

// ------------------------------------------
// Obtener favoritos de un usuario
// ------------------------------------------

export async function obtenerFavoritos(
    usuarioId: string
): Promise<string[]> {
    const favoritos =
        await obtenerFavoritosGuardados();

    return favoritos[usuarioId] ?? [];
}

// ------------------------------------------
// Saber si un lugar es favorito
// ------------------------------------------

export async function esFavorito(
    usuarioId: string,
    lugarId: string
): Promise<boolean> {
    const favoritos =
        await obtenerFavoritos(usuarioId);

    return favoritos.includes(lugarId);
}

// ------------------------------------------
// Agregar un favorito
// ------------------------------------------

export async function agregarFavorito(
    usuarioId: string,
    lugarId: string
): Promise<void> {
    const favoritos =
        await obtenerFavoritosGuardados();

    const favoritosUsuario =
        favoritos[usuarioId] ?? [];

    if (!favoritosUsuario.includes(lugarId)) {
        favoritos[usuarioId] = [
            ...favoritosUsuario,
            lugarId,
        ];
    }

    await guardarFavoritos(favoritos);

    console.log(
        '❤️ FAVORITO AGREGADO:',
        {
            usuarioId,
            lugarId,
        }
    );
}

// ------------------------------------------
// Eliminar un favorito
// ------------------------------------------

export async function eliminarFavorito(
    usuarioId: string,
    lugarId: string
): Promise<void> {
    const favoritos =
        await obtenerFavoritosGuardados();

    const favoritosUsuario =
        favoritos[usuarioId] ?? [];

    favoritos[usuarioId] =
        favoritosUsuario.filter(
            (id) => id !== lugarId
        );

    await guardarFavoritos(favoritos);

    console.log(
        '💔 FAVORITO ELIMINADO:',
        {
            usuarioId,
            lugarId,
        }
    );
}

// ------------------------------------------
// Alternar favorito
// ------------------------------------------

export async function alternarFavorito(
    usuarioId: string,
    lugarId: string
): Promise<boolean> {
    const favorito =
        await esFavorito(
            usuarioId,
            lugarId
        );

    if (favorito) {
        await eliminarFavorito(
            usuarioId,
            lugarId
        );

        return false;
    }

    await agregarFavorito(
        usuarioId,
        lugarId
    );

    return true;
}