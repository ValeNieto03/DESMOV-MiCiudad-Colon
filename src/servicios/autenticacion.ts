import * as SecureStore from 'expo-secure-store';

import { Usuario } from '@/tipos/usuario';
import { usuariosMock } from '@/mocks/usuarios';

const TOKEN_KEY = 'mi-ciudad-token';
const USUARIO_KEY = 'mi-ciudad-usuario';
const USUARIOS_REGISTRADOS_KEY = 'mi-ciudad-usuarios-registrados';

export interface ResultadoLogin {
  usuario: Usuario;
  token: string;
}

function generarTokenMock(usuarioId: string): string {
  return `mock-token-${usuarioId}-${Date.now()}`;
}

async function obtenerUsuariosRegistrados(): Promise<Usuario[]> {
  const usuariosGuardados = await SecureStore.getItemAsync(
    USUARIOS_REGISTRADOS_KEY
  );

  if (!usuariosGuardados) {
    return [];
  }

  try {
    return JSON.parse(usuariosGuardados) as Usuario[];
  } catch {
    return [];
  }
}

async function guardarUsuariosRegistrados(
  usuarios: Usuario[]
): Promise<void> {
  await SecureStore.setItemAsync(
    USUARIOS_REGISTRADOS_KEY,
    JSON.stringify(usuarios)
  );
}

export async function iniciarSesion(
  email: string,
  password: string
): Promise<ResultadoLogin> {
  const emailNormalizado = email.trim().toLowerCase();

  const usuariosRegistrados = await obtenerUsuariosRegistrados();

  const usuariosDisponibles = [
    ...usuariosMock,
    ...usuariosRegistrados,
  ];

  const usuario = usuariosDisponibles.find(
    (item) => item.email.toLowerCase() === emailNormalizado
  );

  if (!usuario) {
    throw new Error('EMAIL_O_PASSWORD_INCORRECTOS');
  }

  // Usuario de prueba de nuestro mock
  if (
    usuario.id === 'usr-201' &&
    password !== '123456'
  ) {
    throw new Error('EMAIL_O_PASSWORD_INCORRECTOS');
  }

  // Para los usuarios registrados localmente,
  // la contraseña se guarda separadamente.
  if (usuario.id !== 'usr-201') {
    const passwordGuardada = await SecureStore.getItemAsync(
      `mi-ciudad-password-${usuario.id}`
    );

    if (password !== passwordGuardada) {
      throw new Error('EMAIL_O_PASSWORD_INCORRECTOS');
    }
  }

  const token = generarTokenMock(usuario.id);

  await SecureStore.setItemAsync(TOKEN_KEY, token);

  await SecureStore.setItemAsync(
    USUARIO_KEY,
    JSON.stringify(usuario)
  );

  return {
    usuario,
    token,
  };
}

export async function registrarUsuario(
  nombre: string,
  email: string,
  password: string
): Promise<ResultadoLogin> {
  const nombreNormalizado = nombre.trim();
  const emailNormalizado = email.trim().toLowerCase();

  if (!nombreNormalizado) {
    throw new Error('NOMBRE_REQUERIDO');
  }

  if (!emailNormalizado) {
    throw new Error('EMAIL_REQUERIDO');
  }

  if (!emailNormalizado.includes('@')) {
    throw new Error('EMAIL_INVALIDO');
  }

  if (password.length < 6) {
    throw new Error('PASSWORD_CORTA');
  }

  const usuariosRegistrados = await obtenerUsuariosRegistrados();

  const usuariosDisponibles = [
    ...usuariosMock,
    ...usuariosRegistrados,
  ];

  const emailYaExiste = usuariosDisponibles.some(
    (item) => item.email.toLowerCase() === emailNormalizado
  );

  if (emailYaExiste) {
    throw new Error('EMAIL_YA_REGISTRADO');
  }

  const nuevoUsuario: Usuario = {
    id: `usr-${Date.now()}`,
    nombre: nombreNormalizado,
    email: emailNormalizado,
    avatarUrl: null,
    creadoEn: new Date().toISOString(),
    preferencias: {
      categoriasFavoritas: [],
      avisarProximidad: false,
      radioAvisoMetros: 250,
      tema: 'sistema',
    },
  };

  const nuevosUsuarios = [
    ...usuariosRegistrados,
    nuevoUsuario,
  ];

  await guardarUsuariosRegistrados(nuevosUsuarios);

  await SecureStore.setItemAsync(
    `mi-ciudad-password-${nuevoUsuario.id}`,
    password
  );

  const token = generarTokenMock(nuevoUsuario.id);

  await SecureStore.setItemAsync(TOKEN_KEY, token);

  await SecureStore.setItemAsync(
    USUARIO_KEY,
    JSON.stringify(nuevoUsuario)
  );

  return {
    usuario: nuevoUsuario,
    token,
  };
}

export async function obtenerSesion(): Promise<{
  usuario: Usuario;
  token: string;
} | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  const usuarioGuardado = await SecureStore.getItemAsync(
    USUARIO_KEY
  );

  if (!token || !usuarioGuardado) {
    return null;
  }

  try {
    const usuario = JSON.parse(usuarioGuardado) as Usuario;

    return {
      usuario,
      token,
    };
  } catch {
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USUARIO_KEY);
}

export async function obtenerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  const usuarioGuardado = await SecureStore.getItemAsync(
    USUARIO_KEY
  );

  if (!usuarioGuardado) {
    return null;
  }

  try {
    return JSON.parse(usuarioGuardado) as Usuario;
  } catch {
    return null;
  }
}