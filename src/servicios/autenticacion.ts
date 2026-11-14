
import * as SecureStore from 'expo-secure-store';

import { Usuario } from '@/tipos/usuario';

const API_BASE_URL = 'http://192.168.1.100:3000';

const TOKEN_KEY = 'mi-ciudad-token';
const USUARIO_KEY = 'mi-ciudad-usuario';
const ROL_KEY = 'mi-ciudad-rol';

export type RolUsuario = 'admin' | 'turista';

export interface ResultadoLogin {
  usuario: Usuario;
  token: string;
  rol: RolUsuario;
}

interface RespuestaSesion {
  token: string;
  usuario: Usuario;
  rol: RolUsuario;
}

async function solicitarSesion(
  ruta: string,
  datos: Record<string, string>,
): Promise<ResultadoLogin> {
  let respuesta: Response;

  try {
    respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(datos),
    });
  } catch {
    throw new Error('API_NO_DISPONIBLE');
  }

  let resultado: any;

  try {
    resultado = await respuesta.json();
  } catch {
    throw new Error('RESPUESTA_INVALIDA');
  }

  if (!respuesta.ok) {
    const codigo =
      resultado?.codigo ??
      resultado?.error?.codigo ??
      resultado?.mensaje ??
      resultado?.message;

    if (
      codigo === 'EMAIL_YA_REGISTRADO' ||
      respuesta.status === 409
    ) {
      throw new Error('EMAIL_YA_REGISTRADO');
    }

    if (codigo === 'EMAIL_INVALIDO') {
      throw new Error('EMAIL_INVALIDO');
    }

    if (
      codigo === 'CREDENCIALES_INVALIDAS' ||
      respuesta.status === 401
    ) {
      throw new Error('EMAIL_O_PASSWORD_INCORRECTOS');
    }

    if (respuesta.status === 400) {
      throw new Error('DATOS_INVALIDOS');
    }

    throw new Error('ERROR_API');
  }

  const sesion = resultado?.datos as RespuestaSesion | undefined;

  if (
    !sesion?.token ||
    !sesion?.usuario ||
    !['admin', 'turista'].includes(sesion.rol)
  ) {
    throw new Error('RESPUESTA_INVALIDA');
  }

  await SecureStore.setItemAsync(TOKEN_KEY, sesion.token);
  await SecureStore.setItemAsync(
    USUARIO_KEY,
    JSON.stringify(sesion.usuario),
  );
  await SecureStore.setItemAsync(ROL_KEY, sesion.rol);

  return {
    token: sesion.token,
    usuario: sesion.usuario,
    rol: sesion.rol,
  };
}

/**
 * Inicia sesión utilizando las credenciales del backend.
 */
export async function iniciarSesion(
  email: string,
  password: string,
): Promise<ResultadoLogin> {
  if (!email.trim() || !password) {
    throw new Error('DATOS_INVALIDOS');
  }

  return solicitarSesion('/auth/ingreso', {
    email: email.trim().toLowerCase(),
    contrasena: password,
  });
}

/**
 * Registra un usuario nuevo en el backend.
 */
export async function registrarUsuario(
  nombre: string,
  email: string,
  password: string,
): Promise<ResultadoLogin> {
  if (!nombre.trim() || !email.trim() || !password) {
    throw new Error('DATOS_INVALIDOS');
  }

  if (password.length < 8) {
    throw new Error('PASSWORD_DEMASIADO_CORTO');
  }

  return solicitarSesion('/auth/registro', {
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    contrasena: password,
  });
}

/**
 * Recupera la sesión guardada en el dispositivo.
 */
export async function obtenerSesion(): Promise<ResultadoLogin | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const usuarioGuardado = await SecureStore.getItemAsync(USUARIO_KEY);
  const rolGuardado = await SecureStore.getItemAsync(ROL_KEY);

  if (!token || !usuarioGuardado || !rolGuardado) {
    return null;
  }

  if (!['admin', 'turista'].includes(rolGuardado)) {
    await cerrarSesion();
    return null;
  }

  try {
    const usuario = JSON.parse(usuarioGuardado) as Usuario;

    return {
      token,
      usuario,
      rol: rolGuardado as RolUsuario,
    };
  } catch {
    await cerrarSesion();
    return null;
  }
}

/**
 * Elimina la sesión del dispositivo.
 */
export async function cerrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USUARIO_KEY);
  await SecureStore.deleteItemAsync(ROL_KEY);
}

/**
 * Devuelve el JWT guardado.
 */
export async function obtenerToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Devuelve el usuario de la sesión actual.
 */
export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  const usuarioGuardado = await SecureStore.getItemAsync(USUARIO_KEY);

  if (!usuarioGuardado) {
    return null;
  }

  try {
    return JSON.parse(usuarioGuardado) as Usuario;
  } catch {
    return null;
  }
}

/**
 * Devuelve el rol de la sesión actual.
 */
export async function obtenerRolActual(): Promise<RolUsuario | null> {
  const rol = await SecureStore.getItemAsync(ROL_KEY);

  if (rol === 'admin' || rol === 'turista') {
    return rol;
  }

  return null;
}


export async function actualizarUsuarioSesion(
  usuario: Usuario,
): Promise<void> {
  await SecureStore.setItemAsync(
    USUARIO_KEY,
    JSON.stringify(usuario),
  );
}