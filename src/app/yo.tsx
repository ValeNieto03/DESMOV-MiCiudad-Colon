import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import {
  cerrarSesion,
  obtenerSesion,
} from '@/servicios/autenticacion';

import { Usuario } from '@/tipos/usuario';

export default function YoScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarSesion = useCallback(async () => {
    try {
      setCargando(true);

      const sesion = await obtenerSesion();

      if (sesion) {
        setUsuario(sesion.usuario);
      } else {
        setUsuario(null);
      }
    } catch (error) {
      console.log('Error al obtener la sesión:', error);
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarSesion();
    }, [cargarSesion])
  );

  async function manejarCerrarSesion() {
    Alert.alert(
      'Cerrar sesión',
      '¿Querés cerrar tu sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await cerrarSesion();
            setUsuario(null);
          },
        },
      ]
    );
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>
            Cargando...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Yo
          </Text>

          <Text style={styles.subtitle}>
            Tu cuenta, favoritos y preferencias
          </Text>
        </View>

        {!usuario ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardIcon}>
                👤
              </Text>

              <Text style={styles.cardTitle}>
                Iniciá sesión
              </Text>

              <Text style={styles.cardDescription}>
                Creá tu cuenta o iniciá sesión para
                guardar favoritos, registrar visitas
                y consultar tu recorrido.
              </Text>

              <Pressable
                style={styles.primaryButton}
                onPress={() => router.push('/login')}
              >
                <Text style={styles.primaryButtonText}>
                  Iniciar sesión
                </Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.push('/registro')}
              >
                <Text style={styles.secondaryButtonText}>
                  Crear una cuenta
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.profileCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {usuario.nombre.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={styles.greeting}>
                  Hola, {usuario.nombre}
                </Text>

                <Text style={styles.email}>
                  {usuario.email}
                </Text>
              </View>
            </View>

            <View style={styles.optionsCard}>
              <Pressable
                style={styles.option}
                onPress={() => router.push('/favoritos')}
              >
                <Text style={styles.optionIcon}>
                  ❤️
                </Text>

                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>
                    Mis favoritos
                  </Text>

                  <Text style={styles.optionDescription}>
                    Lugares que guardaste
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>
              </Pressable>

              <View style={styles.separator} />

              <Pressable
                style={styles.option}
                onPress={() => router.push('/mi-recorrido')}
              >
                <Text style={styles.optionIcon}>
                  🗺️
                </Text>

                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>
                    Mi recorrido
                  </Text>

                  <Text style={styles.optionDescription}>
                    Tus visitas registradas
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.logoutButton}
              onPress={manejarCerrarSesion}
            >
              <Text style={styles.logoutText}>
                Cerrar sesión
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F6F1',
  },

  content: {
    padding: 24,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 28,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#253A32',
  },

  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#77736B',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 15,
    color: '#77736B',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },

  cardIcon: {
    fontSize: 42,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#253A32',
  },

  cardDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: '#77736B',
    textAlign: 'center',
    marginBottom: 22,
  },

  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2F7F8F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  secondaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  secondaryButtonText: {
    color: '#2F7F8F',
    fontSize: 15,
    fontWeight: '700',
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E1D8',
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2F7F8F',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },

  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },

  greeting: {
    fontSize: 19,
    fontWeight: '800',
    color: '#253A32',
  },

  email: {
    marginTop: 4,
    fontSize: 14,
    color: '#77736B',
  },

  optionsCard: {
    marginTop: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E1D8',
    overflow: 'hidden',
  },

  option: {
    minHeight: 78,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },

  optionIcon: {
    fontSize: 24,
    width: 42,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#253A32',
  },

  optionDescription: {
    marginTop: 4,
    fontSize: 13,
    color: '#77736B',
  },

  arrow: {
    fontSize: 28,
    color: '#AAA59C',
    marginLeft: 8,
  },

  separator: {
    height: 1,
    backgroundColor: '#ECE8DF',
    marginLeft: 60,
  },

  logoutButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8C9C3',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  logoutText: {
    color: '#A34A3A',
    fontSize: 15,
    fontWeight: '700',
  },
});