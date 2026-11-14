
import { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, usePathname } from 'expo-router';

import { obtenerRolActual } from '@/servicios/autenticacion';
import { useThemeContext } from '@/contexts/ThemeContext';

type Rol = 'admin' | 'turista' | null;

export default function BottomNav() {
  const pathname = usePathname();
  const { colors } = useThemeContext();

  const [rol, setRol] = useState<Rol>(null);
  const [verificandoRol, setVerificandoRol] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargarRol() {
      setVerificandoRol(true);

      try {
        const rolActual = await obtenerRolActual();

        if (activo) {
          setRol(rolActual);
        }
      } catch {
        if (activo) {
          setRol(null);
        }
      } finally {
        if (activo) {
          setVerificandoRol(false);
        }
      }
    }

    void cargarRol();

    return () => {
      activo = false;
    };
  }, [pathname]);

  // No mostrar la barra en las pantallas de autenticación.
  if (
    pathname === '/login' ||
    pathname === '/registro' ||
    verificandoRol
  ) {
    return null;
  }

  const opciones = [
    {
      titulo: 'Mapa',
      icono: '🗺️',
      ruta: '/',
    },
    {
      titulo: 'Mi recorrido',
      icono: '🧭',
      ruta: '/mi-recorrido',
    },
    {
      titulo: 'Mi perfil',
      icono: '👤',
      ruta: '/yo',
    },
    rol === 'admin'
      ? {
        titulo: 'Administración',
        icono: '⚙️',
        ruta: '/administracion',
      }
      : {
        titulo: 'Agenda',
        icono: '📅',
        ruta: '/agenda',
      },
  ];

  return (
    <View
      style={[
        styles.contenedor,
        {
          backgroundColor: colors.backgroundElement,
          borderTopColor: colors.border,
        },
      ]}
    >
      {opciones.map((opcion) => {
        const activo =
          pathname === opcion.ruta ||
          (opcion.ruta !== '/' &&
            pathname.startsWith(`${opcion.ruta}/`));

        return (
          <Pressable
            key={opcion.ruta}
            style={styles.opcion}
            onPress={() => {
              if (!activo) {
                router.navigate(opcion.ruta as any);
              }
            }}
          >
            <Text style={styles.icono}>
              {opcion.icono}
            </Text>

            <Text
              style={[
                styles.texto,
                { color: colors.textSecondary },
                activo && {
                  color: colors.primary,
                  fontWeight: '800',
                },
              ]}
              numberOfLines={1}
            >
              {opcion.titulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    height: 70,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
  },
  opcion: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  icono: {
    fontSize: 20,
  },
  texto: {
    fontSize: 10,
    fontWeight: '600',
  },
});
