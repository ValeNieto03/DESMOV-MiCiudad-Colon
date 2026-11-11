import { useThemedStyles } from "@/hooks/use-theme";
import { useThemeContext } from "@/contexts/theme-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { cerrarSesion, obtenerSesion } from "@/servicios/autenticacion";
import {
  obtenerPreferenciaTemaCuenta,
  guardarPreferenciaTemaCuenta,
  sincronizarTemaCuentaPendiente,
} from "@/servicios/preferencia-tema";

import { Usuario } from "@/tipos/usuario";

export default function YoScreen() {
  const themedStyles = useThemedStyles(styles);
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const {
    colors,
    preference,
    hasLocalPreference,
    persistenceError,
    setPreference,
  } = useThemeContext();

  const cargarSesion = useCallback(async () => {
    try {
      setCargando(true);

      const sesion = await obtenerSesion();

      if (sesion) {
        setUsuario(sesion.usuario);

        if (hasLocalPreference) {
          void sincronizarTemaCuentaPendiente().catch(() => undefined);
        } else {
          void obtenerPreferenciaTemaCuenta().then((temaCuenta) => {
            if (temaCuenta) setPreference(temaCuenta);
          });
        }
      } else {
        setUsuario(null);
      }
    } catch (error) {
      console.log("Error al obtener la sesión:", error);
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, [hasLocalPreference, setPreference]);

  useFocusEffect(
    useCallback(() => {
      cargarSesion();
    }, [cargarSesion]),
  );

  async function manejarCerrarSesion() {
    Alert.alert("Cerrar sesión", "¿Querés cerrar tu sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: async () => {
          await cerrarSesion();
          setUsuario(null);
        },
      },
    ]);
  }

  if (cargando) {
    return (
      <SafeAreaView
        style={[themedStyles.container, { backgroundColor: colors.background }]}
      >
        <View style={themedStyles.center}>
          <Text style={themedStyles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[themedStyles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={themedStyles.content}
        showsVerticalScrollIndicator={false}
      >
          <View
          style={[
            themedStyles.themeCard,
            {
              backgroundColor: colors.backgroundElement,
              borderColor: colors.backgroundSelected,
            },
          ]}
        >
          <Text style={[themedStyles.themeTitle, { color: colors.text }]}>
            Apariencia
          </Text>

          <View style={themedStyles.themeOptions}>
            {(
              [
                { value: "claro", label: "Claro" },
                { value: "oscuro", label: "Oscuro" },
                { value: "sistema", label: "Seguir sistema" },
              ] as const
            ).map((opcion) => {
              const seleccionada = preference === opcion.value;

              return (
                <Pressable
                  key={opcion.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: seleccionada }}
                  onPress={() => {
                    setPreference(opcion.value);

                    if (usuario) {
                      void guardarPreferenciaTemaCuenta(opcion.value).catch(
                        () => undefined,
                      );
                    }
                  }}
                  style={[
                    themedStyles.themeOption,
                    {
                      backgroundColor: seleccionada
                        ? colors.backgroundSelected
                        : colors.background,
                      borderColor: seleccionada
                        ? colors.text
                        : colors.backgroundSelected,
                    },
                  ]}
                >
                  <Text
                    style={[themedStyles.themeOptionText, { color: colors.text }]}
                  >
                    {opcion.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {persistenceError && (
          <Text style={[themedStyles.themeError, { color: colors.danger }]}>
            No se pudo guardar la preferencia en este dispositivo.
          </Text>
        )}

        {!usuario ? (
          <View
            style={[
              themedStyles.card,
              {
                backgroundColor: colors.backgroundElement,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={themedStyles.cardIcon}>👤</Text>

            <Text style={[themedStyles.cardTitle, { color: colors.text }]}>
              Iniciá sesión
            </Text>

            <Text style={[themedStyles.cardDescription, { color: colors.textSecondary }]}>
              Creá tu cuenta o iniciá sesión para guardar tus lugares favoritos
              y agendar los eventos que quieras disfrutar.
            </Text>

            <Pressable
              style={[themedStyles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/login")}
            >
              <Text style={[themedStyles.primaryButtonText, { color: colors.onPrimary }]}>
                Iniciar sesión
              </Text>
            </Pressable>

            <Pressable
              style={themedStyles.secondaryButton}
              onPress={() => router.push("/registro")}
            >
              <Text
                style={[themedStyles.secondaryButtonText, { color: colors.primary }]}
              >
                Crear una cuenta
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View
              style={[
                themedStyles.profileCard,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[themedStyles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={[themedStyles.avatarText, { color: colors.onPrimary }]}>
                  {usuario.nombre.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={themedStyles.profileInfo}>
                <Text style={[themedStyles.greeting, { color: colors.text }]}>
                  Hola, {usuario.nombre}
                </Text>

                <Text style={[themedStyles.email, { color: colors.textSecondary }]}>
                  {usuario.email}
                </Text>
              </View>
            </View>

            <View
              style={[
                themedStyles.optionsCard,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              <Pressable
                style={themedStyles.option}
                onPress={() => router.push("/favoritos")}
              >
                <Text style={themedStyles.optionIcon}>❤️</Text>

                <View style={themedStyles.optionContent}>
                  <Text style={[themedStyles.optionTitle, { color: colors.text }]}>
                    Mis favoritos
                  </Text>

                  <Text
                    style={[
                      themedStyles.optionDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Lugares que guardaste
                  </Text>
                </View>

                <Text style={themedStyles.arrow}>›</Text>
              </Pressable>

              <View
                style={[themedStyles.separator, { backgroundColor: colors.border }]}
              />

              <Pressable
                style={themedStyles.option}
                onPress={() => router.push("/mi-agenda")}
              >
                <Text style={themedStyles.optionIcon}>📅</Text>

                <View style={themedStyles.optionContent}>
                  <Text style={[themedStyles.optionTitle, { color: colors.text }]}>
                    Mi agenda
                  </Text>

                  <Text
                    style={[
                      themedStyles.optionDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Eventos que guardaste
                  </Text>
                </View>

                <Text style={themedStyles.arrow}>›</Text>
              </Pressable>
            </View>

            <Pressable
              style={[themedStyles.logoutButton, { borderColor: colors.border }]}
              onPress={manejarCerrarSesion}
            >
              <Text style={[themedStyles.logoutText, { color: colors.danger }]}>
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
    backgroundColor: "#F8F6F1",
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
    fontWeight: "800",
    color: "#253A32",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: "#77736B",
  },
  themeCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  themeTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  themeOptions: {
    flexDirection: "row",
    gap: 8,
  },
  themeOption: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  themeError: {
    marginTop: -8,
    marginBottom: 16,
    fontSize: 13,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 15,
    color: "#77736B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E1D8",
  },
  cardIcon: {
    fontSize: 42,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#253A32",
  },
  cardDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: "#77736B",
    textAlign: "center",
    marginBottom: 22,
  },
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2F7F8F",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  secondaryButtonText: {
    color: "#2F7F8F",
    fontSize: 15,
    fontWeight: "700",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E1D8",
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2F7F8F",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  greeting: {
    fontSize: 19,
    fontWeight: "800",
    color: "#253A32",
  },
  email: {
    marginTop: 4,
    fontSize: 14,
    color: "#77736B",
  },
  optionsCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E1D8",
    overflow: "hidden",
  },
  option: {
    minHeight: 78,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "700",
    color: "#253A32",
  },
  optionDescription: {
    marginTop: 4,
    fontSize: 13,
    color: "#77736B",
  },
  arrow: {
    fontSize: 28,
    color: "#AAA59C",
    marginLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#ECE8DF",
    marginLeft: 60,
  },
  logoutButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8C9C3",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  logoutText: {
    color: "#A34A3A",
    fontSize: 15,
    fontWeight: "700",
  },
});
