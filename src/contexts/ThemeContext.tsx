
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';

import Storage from 'expo-sqlite/kv-store';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { obtenerSesion } from '@/servicios/autenticacion';
import { consultarAPI } from '@/servicios/api';
import type { Usuario } from '@/tipos/usuario';

export type PreferenciaTema = 'claro' | 'oscuro' | 'sistema';
export type TemaVisual = 'light' | 'dark';

interface ThemeContextValue {
    preference: PreferenciaTema;
    theme: TemaVisual;
    colors: (typeof Colors)[TemaVisual];
    isReady: boolean;
    setPreference: (tema: PreferenciaTema) => Promise<void>;
    establecerUsuario: (usuario: Usuario | null) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(
    undefined,
);

const CLAVE_TEMA_INVITADO = 'mi-ciudad-theme-preference:guest';

function obtenerClaveTema(usuarioId: string) {
    return `mi-ciudad-theme-preference:${usuarioId}`;
}

function obtenerClavePendiente(usuarioId: string) {
    return `mi-ciudad-theme-pending:${usuarioId}`;
}

function esPreferenciaTema(valor: string | null): valor is PreferenciaTema {
    return valor === 'claro' || valor === 'oscuro' || valor === 'sistema';
}

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const esquemaSistema = useColorScheme();

    const [preference, setPreferenceState] =
        useState<PreferenciaTema>('sistema');

    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [isReady, setIsReady] = useState(false);

    const versionRef = useRef(0);

    const theme: TemaVisual =
        preference === 'sistema'
            ? esquemaSistema === 'dark'
                ? 'dark'
                : 'light'
            : preference === 'oscuro'
                ? 'dark'
                : 'light';

    const colors = Colors[theme];

    const sincronizarPreferencia = useCallback(
        async (usuarioId: string, tema: PreferenciaTema) => {
            const clavePendiente = obtenerClavePendiente(usuarioId);

            try {
                await consultarAPI<Usuario>(
                    '/yo',
                    {
                        method: 'PATCH',
                        body: JSON.stringify({
                            preferencias: { tema },
                        }),
                    },
                    true,
                );

                await Storage.removeItemAsync(clavePendiente);
            } catch (error) {
                console.warn(
                    'No se pudo sincronizar la preferencia de tema. Se intentará nuevamente.',
                    error,
                );
            }
        },
        [],
    );

    const establecerUsuario = useCallback(
        async (nuevoUsuario: Usuario | null) => {
            const version = ++versionRef.current;

            setUsuario(nuevoUsuario);

            if (!nuevoUsuario) {
                const temaInvitado = await Storage.getItemAsync(
                    CLAVE_TEMA_INVITADO,
                );

                if (version !== versionRef.current) return;

                setPreferenceState(
                    esPreferenciaTema(temaInvitado) ? temaInvitado : 'sistema',
                );

                return;
            }

            const claveTema = obtenerClaveTema(nuevoUsuario.id);
            const clavePendiente = obtenerClavePendiente(nuevoUsuario.id);

            const [temaGuardado, sincronizacionPendiente] = await Promise.all([
                Storage.getItemAsync(claveTema),
                Storage.getItemAsync(clavePendiente),
            ]);

            if (version !== versionRef.current) return;

            let tema: PreferenciaTema;

            if (esPreferenciaTema(temaGuardado)) {
                tema = temaGuardado;
            } else {
                tema = esPreferenciaTema(nuevoUsuario.preferencias?.tema)
                    ? nuevoUsuario.preferencias.tema
                    : 'sistema';

                await Storage.setItemAsync(claveTema, tema);
            }

            if (version !== versionRef.current) return;

            setPreferenceState(tema);

            if (sincronizacionPendiente === 'true') {
                void sincronizarPreferencia(nuevoUsuario.id, tema);
            }
        },
        [sincronizarPreferencia],
    );

    useEffect(() => {
        let activo = true;

        async function inicializar() {
            try {
                const sesion = await obtenerSesion();

                if (!activo) return;

                await establecerUsuario(sesion?.usuario ?? null);
            } catch (error) {
                console.warn(
                    'No se pudo recuperar la preferencia de tema.',
                    error,
                );
            } finally {
                if (activo) {
                    setIsReady(true);
                }
            }
        }

        void inicializar();

        return () => {
            activo = false;
        };
    }, [establecerUsuario]);

    const setPreference = useCallback(
        async (nuevoTema: PreferenciaTema) => {
            setPreferenceState(nuevoTema);

            try {
                if (!usuario) {
                    await Storage.setItemAsync(CLAVE_TEMA_INVITADO, nuevoTema);
                    return;
                }

                const claveTema = obtenerClaveTema(usuario.id);
                const clavePendiente = obtenerClavePendiente(usuario.id);

                await Storage.setItemAsync(claveTema, nuevoTema);
                await Storage.setItemAsync(clavePendiente, 'true');

                await sincronizarPreferencia(usuario.id, nuevoTema);
            } catch (error) {
                console.warn(
                    'No se pudo guardar la preferencia de tema.',
                    error,
                );
            }
        },
        [usuario, sincronizarPreferencia],
    );

    const value = useMemo(
        () => ({
            preference,
            theme,
            colors,
            isReady,
            setPreference,
            establecerUsuario,
        }),
        [
            preference,
            theme,
            colors,
            isReady,
            setPreference,
            establecerUsuario,
        ],
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useThemeContext() {
    const context = useContext(ThemeContext);

    if (!context) {
        throw new Error(
            'useThemeContext debe utilizarse dentro de ThemeProvider.',
        );
    }

    return context;
}