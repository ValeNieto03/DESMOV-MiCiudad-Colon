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

export default function RegistroScreen() {
    const router = useRouter();

    const repetirPasswordRef = useRef<TextInput>(null);

    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repetirPassword, setRepetirPassword] = useState('');
    const [cargando, setCargando] = useState(false);

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

        if (password.length < 6) {
            Alert.alert(
                'Contraseña demasiado corta',
                'La contraseña debe tener al menos 6 caracteres.'
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

            await registrarUsuario(
                nombre,
                email,
                password
            );

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
                behavior={
                    Platform.OS === 'ios'
                        ? 'padding'
                        : 'height'
                }
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >

                    {/* Encabezado */}
                    <Pressable
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backText}>
                            ‹ Volver
                        </Text>
                    </Pressable>

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
                            placeholderTextColor="#99958C"
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
                            placeholderTextColor="#99958C"
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

                        <TextInput
                            style={styles.input}
                            placeholder="Mínimo 6 caracteres"
                            placeholderTextColor="#99958C"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            returnKeyType="next"
                            onSubmitEditing={() => {
                                repetirPasswordRef.current?.focus();
                            }}
                        />
                    </View>

                    {/* Repetir contraseña */}
                    <View style={styles.field}>
                        <Text style={styles.label}>
                            Repetir contraseña
                        </Text>

                        <TextInput
                            ref={repetirPasswordRef}
                            style={styles.input}
                            placeholder="Volvé a ingresar tu contraseña"
                            placeholderTextColor="#99958C"
                            value={repetirPassword}
                            onChangeText={setRepetirPassword}
                            secureTextEntry
                            returnKeyType="done"
                            onSubmitEditing={manejarRegistro}
                        />
                    </View>

                    {/* Botón */}
                    <Pressable
                        style={[
                            styles.registerButton,
                            cargando &&
                            styles.registerButtonDisabled,
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

                    {/* Login */}
                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>
                            ¿Ya tenés una cuenta?
                        </Text>

                        <Pressable
                            onPress={() =>
                                router.replace('/login')
                            }
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F3E8',
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
        color: '#2F7F8F',
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
        fontSize: 14,
        color: '#77736B',
        marginTop: 8,
        lineHeight: 21,
    },

    field: {
        marginBottom: 17,
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
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#D8E4E2',
        paddingHorizontal: 15,
        fontSize: 15,
        color: '#253A32',
    },

    registerButton: {
        height: 52,
        backgroundColor: '#2F7F8F',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },

    registerButtonDisabled: {
        opacity: 0.6,
    },

    registerButtonText: {
        color: '#FFFFFF',
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
        color: '#77736B',
    },

    loginLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2F7F8F',
    },
});