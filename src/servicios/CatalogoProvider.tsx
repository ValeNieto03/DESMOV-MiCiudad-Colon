import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

import { lugares } from '@/data/lugares';
import type { Place } from '@/data/lugares';

import {
    inicializarBaseDeDatos,
    obtenerLugaresLocales,
} from '@/servicios/visitas';

import { obtenerLugaresIntegrados } from '@/servicios/lugares-integrados';

import { AppState } from 'react-native';
import * as Network from 'expo-network';

import { sincronizarVisitasPendientes } from '@/servicios/sincronizacion-visitas';

type CatalogoContextType = {
    lugaresDisponibles: Place[];
    cargandoCatalogo: boolean;
};

const CatalogoContext = createContext<CatalogoContextType | undefined>(
    undefined
);

// Evita iniciar más de una actualización del catálogo durante la vida
// de la aplicación, incluso si el proveedor se vuelve a montar.
let promesaActualizacion: Promise<Place[]> | null = null;

function actualizarCatalogoUnaVez(): Promise<Place[]> {
    if (!promesaActualizacion) {
        promesaActualizacion = obtenerLugaresIntegrados();
    }

    return promesaActualizacion;
}

type CatalogoProviderProps = {
    children: ReactNode;
};

export function CatalogoProvider({
    children,
}: CatalogoProviderProps) {
    const [lugaresDisponibles, setLugaresDisponibles] =
        useState<Place[]>(lugares);

    const [cargandoCatalogo, setCargandoCatalogo] = useState(true);

    useEffect(() => {
        let activo = true;
        let catalogoListo = false;
        let sincronizacionEnCurso = false;

        let suscripcionRed:
            ReturnType<typeof Network.addNetworkStateListener> | null = null;

        let suscripcionApp:
            ReturnType<typeof AppState.addEventListener> | null = null;

        async function intentarSincronizar() {
            if (!activo || !catalogoListo || sincronizacionEnCurso) {
                return;
            }

            sincronizacionEnCurso = true;

            try {
                const estadoRed = await Network.getNetworkStateAsync();

                if (
                    estadoRed.isConnected &&
                    estadoRed.isInternetReachable !== false
                ) {
                    await sincronizarVisitasPendientes();
                }
            } catch (error) {
                console.warn(
                    'No se pudieron sincronizar las visitas pendientes:',
                    error
                );
            } finally {
                sincronizacionEnCurso = false;
            }
        }

        async function cargarCatalogo() {
            try {
                inicializarBaseDeDatos();

                const lugaresLocales = obtenerLugaresLocales();

                if (activo && lugaresLocales.length > 0) {
                    setLugaresDisponibles(lugaresLocales);
                    setCargandoCatalogo(false);
                }

                const lugaresActualizados =
                    await actualizarCatalogoUnaVez();

                if (activo && lugaresActualizados.length > 0) {
                    setLugaresDisponibles(lugaresActualizados);
                }
            } catch (error) {
                console.warn(
                    'No se pudo inicializar el catálogo compartido:',
                    error
                );
            } finally {
                if (activo) {
                    catalogoListo = true;
                    setCargandoCatalogo(false);

                    suscripcionRed = Network.addNetworkStateListener(
                        (estado) => {
                            if (
                                estado.isConnected &&
                                estado.isInternetReachable !== false
                            ) {
                                void intentarSincronizar();
                            }
                        }
                    );

                    suscripcionApp = AppState.addEventListener(
                        'change',
                        (estado) => {
                            if (estado === 'active') {
                                void intentarSincronizar();
                            }
                        }
                    );

                    void intentarSincronizar();
                }
            }
        }

        void cargarCatalogo();

        return () => {
            activo = false;
            suscripcionRed?.remove();
            suscripcionApp?.remove();
        };
    }, []);

    return (
        <CatalogoContext.Provider
            value={{
                lugaresDisponibles,
                cargandoCatalogo,
            }}
        >
            {children}
        </CatalogoContext.Provider>
    );
}

export function useCatalogo() {
    const contexto = useContext(CatalogoContext);

    if (!contexto) {
        throw new Error(
            'useCatalogo debe utilizarse dentro de CatalogoProvider'
        );
    }

    return contexto;
}
