
import { useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { registrarUsuario } from '@/servicios/autenticacion';
import { registrarDispositivoPush } from '@/servicios/notificaciones-push';
import { useThemeContext } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/theme';

export default function RegistroScreen() {
    const router = useRouter();
    const { colors, establecerUsuario } = useThemeContext();
    const styles = crearEstilos(colors);

    const repetirPasswordRef =
        useRef<import('react-native').TextInputInstance>(null);

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repetirPassword, setRepetirPassword] = useState('');
    const [cargando, setCargando] = useState(false);

    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarRepetirPassword, setMostrarRepetirPassword] =
        useState(false);

    async function manejarRegistro() {
        if (!nombre.trim()) {
            Alert.alert(
                'Falta tu nombre',
                'Ingresá tu nombre para continuar.'
            );
            return;
        }

        if (!email.trim()) {
            Alert.alert(
                'Falta tu email',
                'Ingresá un email para continuar.'
            );
            return;
        }

        if (!password) {
            Alert.alert(
                'Falta tu contraseña',
                'Ingresá una contraseña para continuar.'
            );
            return;
        }

        if (password.length < 8) {
            Alert.alert(
                'Contraseña demasiado corta',
                'La contraseña debe tener al menos 8 caracteres.'
            );
            return;
        }

        if (password !== repetirPassword) {
            Alert.alert(
                'Las contraseñas no coinciden',
                'Revisá que ambas contraseñas sean iguales.'
            );
            return;
        }

        try {
            setCargando(true);

            const resultado = await registrarUsuario(
                nombre,
                email,
                password
            );

            await establecerUsuario(resultado.usuario);

            await registrarDispositivoPush();

            Alert.alert(
                '¡Cuenta creada!',
                'Tu cuenta fue creada correctamente.',
                [
                    {
                        text: 'Continuar',
                        onPress: () => router.replace('/yo'),
                    },
                ]
            );
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === 'EMAIL_YA_REGISTRADO'
            ) {
                Alert.alert(
                    'Email ya registrado',
                    'Ya existe una cuenta con ese email.'
                );
                return;
            }

            if (
                error instanceof Error &&
                error.message === 'EMAIL_INVALIDO'
            ) {
                Alert.alert(
                    'Email inválido',
                    'Ingresá un email válido.'
                );
                return;
            }

            Alert.alert(
                'No se pudo crear la cuenta',
                'Ocurrió un error. Intentá nuevamente.'
            );
        } finally {
            setCargando(false);
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboard}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Volver */}
                    <Pressable
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backText}>
                            ‹ Volver
                        </Text>
                    </Pressable>

                    {/* Encabezado */}
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            Crear una cuenta
                        </Text>

                        <Text style={styles.subtitle}>
                            Guardá tus favoritos y tu recorrido en Mi Ciudad.
                        </Text>
                    </View>

                    {/* Nombre */}
                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Nombre
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Tu nombre"
                            placeholderTextColor={colors.textSecondary}
                            value={nombre}
                            onChangeText={setNombre}
                            autoCapitalize="words"
                            returnKeyType="next"
                        />
                    </View>

                    {/* Email */}
                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Email
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="tu@email.com"
                            placeholderTextColor={colors.textSecondary}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                        />
                    </View>

                    {/* Contraseña */}
                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Contraseña
                        </Text>

                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="Mínimo 8 caracteres"
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!mostrarPassword}
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    repetirPasswordRef.current?.focus();
                                }}
                            />

                            <Pressable
                                style={styles.eyeButton}
                                onPress={() =>
                                    setMostrarPassword(!mostrarPassword)
                                }
                                hitSlop={8}
                            >
                                <Text style={styles.eyeText}>
                                    {mostrarPassword ? '🙈' : '👁️'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Repetir contraseña */}
                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Repetir contraseña
                        </Text>

                        <View style={styles.passwordContainer}>
                            <TextInput
                                ref={repetirPasswordRef}
                                style={styles.passwordInput}
                                placeholder="Volvé a ingresar tu contraseña"
                                placeholderTextColor={colors.textSecondary}
                                value={repetirPassword}
                                onChangeText={setRepetirPassword}
                                secureTextEntry={!mostrarRepetirPassword}
                                returnKeyType="done"
                                onSubmitEditing={manejarRegistro}
                            />

                            <Pressable
                                style={styles.eyeButton}
                                onPress={() =>
                                    setMostrarRepetirPassword(
                                        !mostrarRepetirPassword
                                    )
                                }
                                hitSlop={8}
                            >
                                <Text style={styles.eyeText}>
                                    {mostrarRepetirPassword ? '🙈' : '👁️'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Crear cuenta */}
                    <Pressable
                        style={[
                            styles.registerButton,
                            cargando && styles.registerButtonDisabled,
                        ]}
                        onPress={manejarRegistro}
                        disabled={cargando}
                    >
                        <Text style={styles.registerButtonText}>
                            {cargando
                                ? 'Creando cuenta...'
                                : 'Crear cuenta'}
                        </Text>
                    </Pressable>

                    {/* Ir al login */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>
                            ¿Ya tenés una cuenta?
                        </Text>

                        <Pressable
                            onPress={() => router.replace('/login')}
                        >
                            <Text style={styles.loginLink}>
                                Iniciar sesión
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function crearEstilos(
    colors: (typeof Colors)[keyof typeof Colors],
) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },

        keyboard: {
            flex: 1,
        },

        content: {
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 20,
            paddingBottom: 30,
        },

        backButton: {
            alignSelf: 'flex-start',
            marginBottom: 30,
        },

        backText: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.primary,
        },

        header: {
            marginBottom: 28,
        },

        title: {
            fontSize: 30,
            fontWeight: '800',
            color: colors.text,
        },

        subtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            marginTop: 8,
            lineHeight: 21,
        },

        field: {
            marginBottom: 17,
        },

        label: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 7,
        },

        input: {
            height: 52,
            backgroundColor: colors.inputBackground,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.inputBorder,
            paddingHorizontal: 15,
            fontSize: 15,
            color: colors.text,
        },

        passwordContainer: {
            height: 52,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.inputBackground,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.inputBorder,
        },

        passwordInput: {
            flex: 1,
            height: '100%',
            paddingHorizontal: 15,
            fontSize: 15,
            color: colors.text,
        },

        eyeButton: {
            height: '100%',
            paddingHorizontal: 15,
            justifyContent: 'center',
            alignItems: 'center',
        },

        eyeText: {
            fontSize: 20,
        },

        registerButton: {
            height: 52,
            backgroundColor: colors.primary,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 8,
        },

        registerButtonDisabled: {
            opacity: 0.6,
        },

        registerButtonText: {
            color: colors.onPrimary,
            fontSize: 16,
            fontWeight: '800',
        },

        loginContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 22,
            gap: 5,
        },

        loginText: {
            fontSize: 14,
            color: colors.textSecondary,
        },

        loginLink: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.primary,
        },
    });
}