import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { iniciarSesion } from '@/servicios/autenticacion';

export default function LoginScreen() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);

    const manejarLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert(
                'Datos incompletos',
                'Ingresá tu email y contraseña.'
            );

            return;
        }

        try {
            setCargando(true);

            await iniciarSesion(email, password);

            Alert.alert(
                '¡Bienvenido!',
                'Iniciaste sesión correctamente.',
                [
                    {
                        text: 'Continuar',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error) {
            if (
                error instanceof Error &&
                error.message === 'EMAIL_O_PASSWORD_INCORRECTOS'
            ) {
                Alert.alert(
                    'No se pudo iniciar sesión',
                    'El email o la contraseña son incorrectos.'
                );
            } else {
                Alert.alert(
                    'Error',
                    'Ocurrió un problema al iniciar sesión.'
                );
            }
        } finally {
            setCargando(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboard}
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : undefined
                }
            >
                <View style={styles.content}>

                    {/* Encabezado */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoIcon}>
                                👤
                            </Text>
                        </View>

                        <Text style={styles.smallTitle}>
                            MI CIUDAD
                        </Text>

                        <Text style={styles.title}>
                            Iniciar sesión
                        </Text>

                        <Text style={styles.description}>
                            Iniciá sesión para guardar favoritos,
                            registrar visitas y consultar tu recorrido.
                        </Text>
                    </View>

                    {/* Formulario */}
                    <View style={styles.form}>

                        <Text style={styles.label}>
                            Email
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ingresá tu email"
                            placeholderTextColor="#99968E"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={styles.label}>
                            Contraseña
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Ingresá tu contraseña"
                            placeholderTextColor="#99968E"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        {/* Botón principal */}
                        <Pressable
                            style={[
                                styles.button,
                                cargando && styles.buttonDisabled,
                            ]}
                            onPress={manejarLogin}
                            disabled={cargando}
                        >
                            <Text style={styles.buttonText}>
                                {cargando
                                    ? 'Ingresando...'
                                    : 'Iniciar sesión'}
                            </Text>
                        </Pressable>

                        {/* Registro */}
                        <Pressable
                            style={styles.secondaryButton}
                            onPress={() => router.push('/registro')}
                        >
                            <Text style={styles.secondaryButtonText}>
                                Crear una cuenta
                            </Text>
                        </Pressable>

                    </View>

                    {/* Cuenta de prueba */}
                    <View style={styles.demoBox}>

                        <View style={styles.demoHeader}>
                            <View style={styles.demoIconContainer}>
                                <Text style={styles.demoIcon}>
                                    ✓
                                </Text>
                            </View>

                            <Text style={styles.demoTitle}>
                                Cuenta de prueba
                            </Text>
                        </View>

                        <View style={styles.demoData}>
                            <Text style={styles.demoLabel}>
                                Email
                            </Text>

                            <Text style={styles.demoText}>
                                lucia@mail.com
                            </Text>
                        </View>

                        <View style={styles.demoData}>
                            <Text style={styles.demoLabel}>
                                Contraseña
                            </Text>

                            <Text style={styles.demoText}>
                                123456
                            </Text>
                        </View>

                    </View>

                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // ------------------------------------------
    // Pantalla
    // ------------------------------------------

    container: {
        flex: 1,
        backgroundColor: '#F7F3E8',
    },

    keyboard: {
        flex: 1,
    },

    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 25,
        paddingBottom: 20,
        justifyContent: 'center',
    },

    // ------------------------------------------
    // Encabezado
    // ------------------------------------------

    header: {
        alignItems: 'center',
        marginBottom: 28,
    },

    logoContainer: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#DCE9E8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },

    logoIcon: {
        fontSize: 31,
    },

    smallTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#2F7F8F',
        letterSpacing: 1.8,
        marginBottom: 4,
    },

    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#253A32',
        marginBottom: 9,
        textAlign: 'center',
    },

    description: {
        fontSize: 14,
        lineHeight: 21,
        color: '#77736B',
        textAlign: 'center',
        maxWidth: 330,
    },

    // ------------------------------------------
    // Formulario
    // ------------------------------------------

    form: {
        width: '100%',
    },

    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#253A32',
        marginBottom: 7,
    },

    input: {
        height: 52,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E3E1D8',
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#253A32',
        marginBottom: 17,
    },

    // ------------------------------------------
    // Botón principal
    // ------------------------------------------

    button: {
        height: 52,
        borderRadius: 12,
        backgroundColor: '#2F7F8F',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 7,
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },

    // ------------------------------------------
    // Botón crear cuenta
    // ------------------------------------------

    secondaryButton: {
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },

    secondaryButtonText: {
        color: '#2F7F8F',
        fontSize: 15,
        fontWeight: '800',
    },

    // ------------------------------------------
    // Cuenta de prueba
    // ------------------------------------------

    demoBox: {
        marginTop: 22,
        padding: 15,
        borderRadius: 14,
        backgroundColor: '#E5EFE4',
        borderWidth: 1,
        borderColor: '#D5E2D3',
    },

    demoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    demoIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#6B8E5A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 9,
    },

    demoIcon: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },

    demoTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#253A32',
    },

    demoData: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },

    demoLabel: {
        width: 90,
        fontSize: 12,
        fontWeight: '700',
        color: '#557448',
    },

    demoText: {
        flex: 1,
        fontSize: 13,
        color: '#3E493D',
        fontWeight: '600',
    },
});