
import AsyncStorage from '@react-native-async-storage/async-storage';

import { consultarAPI } from '@/servicios/api';

const FAVORITOS_KEY = 'mi-ciudad-favoritos';
const OPERACIONES_PENDIENTES_KEY = 'mi-ciudad-favoritos-pendientes';

type FavoritosPorUsuario = Record<string, string[]>;
type OperacionesPendientes = Record<string, Record<string, boolean>>;

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

async function obtenerOperacionesPendientes(): Promise<OperacionesPendientes> {
    const guardadas = await AsyncStorage.getItem(OPERACIONES_PENDIENTES_KEY);

    if (!guardadas) return {};

    try {
        return JSON.parse(guardadas) as OperacionesPendientes;
    } catch {
        return {};
    }
}

async function guardarOperacionesPendientes(
    operaciones: OperacionesPendientes,
): Promise<void> {
    await AsyncStorage.setItem(
        OPERACIONES_PENDIENTES_KEY,
        JSON.stringify(operaciones),
    );
}

function esErrorDeConexion(error: unknown): boolean {
    return error instanceof Error && error.message === 'API_NO_DISPONIBLE';
}

async function enviarOperacion(
    lugarId: string,
    guardar: boolean,
): Promise<void> {
    await consultarAPI(
        `/yo/favoritos/${encodeURIComponent(lugarId)}`,
        { method: guardar ? 'PUT' : 'DELETE' },
        true,
    );
}

async function quitarOperacionPendiente(
    usuarioId: string,
    lugarId: string,
): Promise<void> {
    const operaciones = await obtenerOperacionesPendientes();
    delete operaciones[usuarioId]?.[lugarId];

    if (operaciones[usuarioId] && Object.keys(operaciones[usuarioId]).length === 0) {
        delete operaciones[usuarioId];
    }

    await guardarOperacionesPendientes(operaciones);
}

async function sincronizarOperacionesPendientes(usuarioId: string): Promise<void> {
    const operaciones = await obtenerOperacionesPendientes();
    const delUsuario = operaciones[usuarioId] ?? {};

    for (const [lugarId, guardar] of Object.entries(delUsuario)) {
        try {
            await enviarOperacion(lugarId, guardar);
            await quitarOperacionPendiente(usuarioId, lugarId);
        } catch (error) {
            if (esErrorDeConexion(error)) return;
            throw error;
        }
    }
}

async function actualizarFavoritoLocal(
    usuarioId: string,
    lugarId: string,
    guardar: boolean,
): Promise<void> {
    const favoritos = await obtenerFavoritosGuardados();
    const operaciones = await obtenerOperacionesPendientes();
    const favoritosAnteriores = { ...favoritos };
    const operacionesAnteriores = JSON.parse(JSON.stringify(operaciones)) as OperacionesPendientes;
    const favoritosUsuario = new Set(favoritos[usuarioId] ?? []);

    if (guardar) favoritosUsuario.add(lugarId);
    else favoritosUsuario.delete(lugarId);

    favoritos[usuarioId] = Array.from(favoritosUsuario);
    operaciones[usuarioId] = {
        ...(operaciones[usuarioId] ?? {}),
        [lugarId]: guardar,
    };

    await guardarFavoritos(favoritos);
    await guardarOperacionesPendientes(operaciones);

    try {
        await enviarOperacion(lugarId, guardar);
        await quitarOperacionPendiente(usuarioId, lugarId);
    } catch (error) {
        if (esErrorDeConexion(error)) return;

        await guardarFavoritos(favoritosAnteriores);
        await guardarOperacionesPendientes(operacionesAnteriores);
        throw error;
    }
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
        await sincronizarOperacionesPendientes(usuarioId);

        const favoritosAPI = await consultarAPI<FavoritoAPI[]>(
            '/yo/favoritos',
            {},
            true,
        );

        console.log('⭐ Favoritos recibidos del backend:', favoritosAPI);

        const favoritosRemotos = new Set(favoritosAPI.map(
            (favorito) => favorito.lugarId,
        ));
        const operacionesPendientes = await obtenerOperacionesPendientes();

        for (const [lugarId, guardar] of Object.entries(
            operacionesPendientes[usuarioId] ?? {},
        )) {
            if (guardar) favoritosRemotos.add(lugarId);
            else favoritosRemotos.delete(lugarId);
        }

        const lugarIds = Array.from(favoritosRemotos);

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
    await actualizarFavoritoLocal(usuarioId, lugarId, true);
}

// ------------------------------------------
// Eliminar un favorito
// ------------------------------------------

export async function eliminarFavorito(
    usuarioId: string,
    lugarId: string,
): Promise<void> {
    await actualizarFavoritoLocal(usuarioId, lugarId, false);
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
