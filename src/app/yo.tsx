
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

import {
  darDeBajaDispositivoPush,
  probarNotificacionPush,
} from '@/servicios/notificaciones-push';

import { Usuario } from '@/tipos/usuario';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function YoScreen() {
  const router = useRouter();

  const {
    preference,
    colors,
    setPreference,
    establecerUsuario,
  } = useThemeContext();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [probandoNotificacion, setProbandoNotificacion] = useState(false);

  const cargarSesion = useCallback(async () => {
    try {
      setCargando(true);

      const sesion = await obtenerSesion();

      await establecerUsuario(sesion?.usuario ?? null);
      setUsuario(sesion?.usuario ?? null);
    } catch (error) {
      console.log('Error al obtener la sesión:', error);
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, [establecerUsuario]);

  useFocusEffect(
    useCallback(() => {
      void cargarSesion();
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
            try {
              await darDeBajaDispositivoPush();
              await cerrarSesion();
              setUsuario(null);
              await establecerUsuario(null);
            } catch (error) {
              console.error('Error al cerrar sesión:', error);
              Alert.alert(
                'Error',
                'No se pudo completar el cierre de sesión.'
              );
            }
          },
        },
      ]
    );
  }

  async function manejarProbarNotificacion() {
    try {
      setProbandoNotificacion(true);

      const enviadas = await probarNotificacionPush();

      if (enviadas > 0) {
        Alert.alert(
          '¡Notificación enviada!',
          `El servidor realizó el envío a ${enviadas} dispositivo(s). Revisá las notificaciones de tu teléfono.`
        );
      } else {
        Alert.alert(
          'Sin dispositivos registrados',
          'Todavía no hay teléfonos registrados para recibir notificaciones push. Cerrá sesión e iniciá nuevamente, aceptando los permisos de notificaciones.'
        );
      }
    } catch (error) {
      console.error('Error al probar las notificaciones:', error);

      Alert.alert(
        'Error',
        'No se pudo enviar la notificación de prueba. Verificá tu conexión y que la sesión esté iniciada.'
      );
    } finally {
      setProbandoNotificacion(false);
    }
  }

  if (cargando) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={styles.center}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Cargando...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Yo
          </Text>

          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tu cuenta, favoritos y preferencias
          </Text>
        </View>

        {/* Selector de apariencia para invitados y usuarios registrados */}
        <View
          style={[
            styles.appearanceCard,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.optionTitle, { color: colors.text }]}>
            Apariencia
          </Text>

          <Text
            style={[
              styles.optionDescription,
              {
                color: colors.textSecondary,
                marginBottom: 14,
              },
            ]}
          >
            Elegí cómo querés ver Mi Ciudad.
          </Text>

          <View style={styles.themeOptions}>
            {([
              { value: 'claro', label: 'Claro', icon: '☀️' },
              { value: 'oscuro', label: 'Oscuro', icon: '🌙' },
              { value: 'sistema', label: 'Sistema', icon: '📱' },
            ] as const).map((opcion) => {
              const seleccionado = preference === opcion.value;

              return (
                <Pressable
                  key={opcion.value}
                  onPress={() => {
                    void setPreference(opcion.value);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionado }}
                  style={[
                    styles.themeOption,
                    {
                      borderColor: seleccionado
                        ? colors.primary
                        : colors.border,
                      backgroundColor: seleccionado
                        ? colors.backgroundSelected
                        : colors.background,
                    },
                  ]}
                >
                  <Text style={styles.themeIcon}>
                    {opcion.icon}
                  </Text>

                  <Text
                    style={[
                      styles.themeLabel,
                      {
                        color: colors.text,
                        fontWeight: seleccionado ? '800' : '600',
                      },
                    ]}
                  >
                    {opcion.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!usuario ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={styles.cardIcon}>👤</Text>

            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Iniciá sesión
            </Text>

            <Text
              style={[
                styles.cardDescription,
                { color: colors.textSecondary },
              ]}
            >
              Creá tu cuenta o iniciá sesión para guardar
              tus lugares favoritos y agendar los eventos
              que quieras disfrutar.
            </Text>

            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => router.push('/login')}
            >
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: colors.onPrimary },
                ]}
              >
                Iniciar sesión
              </Text>
            </Pressable>

            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push('/registro')}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: colors.primary },
                ]}
              >
                Crear una cuenta
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
                  {usuario.nombre.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.profileInfo}>
                <Text style={[styles.greeting, { color: colors.text }]}>
                  Hola, {usuario.nombre}
                </Text>

                <Text style={[styles.email, { color: colors.textSecondary }]}>
                  {usuario.email}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.optionsCard,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              <Pressable
                style={styles.option}
                onPress={() => router.push('/favoritos')}
              >
                <Text style={styles.optionIcon}>❤️</Text>

                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Mis favoritos
                  </Text>

                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Lugares que guardaste
                  </Text>
                </View>

                <Text style={[styles.arrow, { color: colors.textSecondary }]}>
                  ›
                </Text>
              </Pressable>

              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.border },
                ]}
              />

              <Pressable
                style={styles.option}
                onPress={() => router.push('/mi-agenda')}
              >
                <Text style={styles.optionIcon}>📅</Text>

                <View style={styles.optionContent}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    Mi agenda
                  </Text>

                  <Text
                    style={[
                      styles.optionDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Eventos que guardaste
                  </Text>
                </View>

                <Text style={[styles.arrow, { color: colors.textSecondary }]}>
                  ›
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.secondaryButton,
                styles.notificationButton,
                { borderColor: colors.border },
              ]}
              onPress={manejarProbarNotificacion}
              disabled={probandoNotificacion}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: colors.primary },
                ]}
              >
                {probandoNotificacion
                  ? 'Enviando notificación...'
                  : 'Probar notificaciones push'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.logoutButton,
                {
                  borderColor: colors.danger,
                  backgroundColor: colors.backgroundElement,
                },
              ]}
              onPress={manejarCerrarSesion}
            >
              <Text style={[styles.logoutText, { color: colors.danger }]}>
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
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 22,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
  },
  appearanceCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 18,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flex: 1,
    minHeight: 76,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  themeIcon: {
    fontSize: 21,
  },
  themeLabel: {
    fontSize: 13,
  },
  card: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  cardIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  cardDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
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
    fontSize: 15,
    fontWeight: '700',
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 18,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
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
  },
  email: {
    marginTop: 4,
    fontSize: 14,
  },
  optionsCard: {
    marginTop: 0,
    borderRadius: 20,
    borderWidth: 1,
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
  },
  optionDescription: {
    marginTop: 4,
    fontSize: 13,
  },
  arrow: {
    fontSize: 28,
    marginLeft: 8,
  },
  separator: {
    height: 1,
    marginLeft: 60,
  },
  notificationButton: {
    borderWidth: 1,
    marginTop: 18,
  },
  logoutButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
