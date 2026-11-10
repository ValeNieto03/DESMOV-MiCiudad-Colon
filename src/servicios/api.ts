import { obtenerToken } from '@/servicios/autenticacion';
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';

const API_BASE_URL = 'http://192.168.1.100:3000';

export type LugarAPI = {
  id: string;
  nombre: string;
  categoriaId: string;
  descripcionCorta?: string;
  descripcion: string;
  coordenadas: {
    latitud: number;
    longitud: number;
  };
  direccion?: string | null;
  imagenes?: string[];
  horarios?: string[];
  telefono?: string | null;
  sitioWeb?: string | null;
  precioEntrada?: string | number | null;
  audioguia?: {
    url: string;
    duracionSegundos?: number;
    idioma?: string;
  } | string | null;
  codigoQr?: string | null;
  accesible?: boolean;
  activo?: boolean;
  actualizadoEn?: string;
};

export type EventoAPI = {
  id: string;
  titulo: string;
  descripcion: string;
  lugarId: string | null;
  direccionLibre: string | null;
  coordenadas: {
    latitud: number;
    longitud: number;
  } | null;
  inicio: string;
  fin: string | null;
  imagenUrl: string | null;
  precio: number | null;
  estado: 'programado' | 'suspendido' | 'cancelado' | 'finalizado';
};

type RespuestaAPI<T> = {
  datos: T;
  meta?: unknown;
};

/**
 * Función central para consultar la API.
 *
 * Por defecto, las consultas son públicas.
 * Cuando requiereAutenticacion es true,
 * agrega el JWT guardado en SecureStore.
 */
export async function consultarAPI<T>(
  ruta: string,
  opciones: RequestInit = {},
  requiereAutenticacion = false,
): Promise<T> {
  const headers = new Headers(opciones.headers);

  if (opciones.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (requiereAutenticacion) {
    const token = await obtenerToken();

    if (!token) {
      throw new Error('SESION_NO_INICIADA');
    }

    headers.set('Authorization', `Bearer ${token}`);
  }

  let respuesta: Response;

  try {
    respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
      ...opciones,
      headers,
    });
  } catch {
    throw new Error('API_NO_DISPONIBLE');
  }

  // Algunas operaciones, como DELETE, responden 204
  // cuando se completan correctamente y no devuelven contenido.
  if (
    respuesta.status === 204 ||
    respuesta.status === 205
  ) {
    return undefined as T;
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

    if (respuesta.status === 401) {
      throw new Error('SESION_NO_VALIDA');
    }

    if (respuesta.status === 403) {
      throw new Error('SIN_PERMISOS');
    }

    throw new Error(codigo || `ERROR_API_${respuesta.status}`);
  }

  const datos = resultado as RespuestaAPI<T>;

  return datos.datos;
}

export async function comprobarConexionAPI() {
  const datos = await consultarAPI<{
    estado: string;
    motor: string;
    almacen: string;
    version: string;
  }>('/salud');

  if (datos.estado !== 'ok') {
    throw new Error('API_NO_DISPONIBLE');
  }

  return datos;
}

export async function obtenerLugaresAPI(): Promise<LugarAPI[]> {
  return consultarAPI<LugarAPI[]>('/lugares?porPagina=500');
}

export async function obtenerCategoriasAPI() {
  return consultarAPI<
    Array<{
      id: string;
      nombre: string;
    }>
  >('/categorias');
}

// Obtiene los eventos que el turista tiene guardados.
export async function obtenerEventosGuardadosAPI(): Promise<EventoAPI[]> {
  return consultarAPI<EventoAPI[]>(
    '/yo/eventos-guardados?porPagina=100',
    {},
    true,
  );
}

// Guarda un evento en la agenda personal del turista.
export async function guardarEventoAPI(
  eventoId: string,
): Promise<EventoAPI> {
  return consultarAPI<EventoAPI>(
    `/yo/eventos-guardados/${encodeURIComponent(eventoId)}`,
    {
      method: 'PUT',
    },
    true,
  );
}

// Quita un evento de la agenda personal del turista.
export async function quitarEventoGuardadoAPI(
  eventoId: string,
): Promise<void> {
  return consultarAPI<void>(
    `/yo/eventos-guardados/${encodeURIComponent(eventoId)}`,
    {
      method: 'DELETE',
    },
    true,
  );
}

export function prepararUrlImagen(url: string): string {
  return url.replace(
    'http://localhost:3000',
    API_BASE_URL,
  );
}

/**
 * Sube una imagen a la API y devuelve la URL del archivo almacenado.
 */

async function enviarArchivoAPI(
  archivo: File,
  nombre: string,
): Promise<string> {
  const token = await obtenerToken();

  if (!token) {
    throw new Error('SESION_NO_INICIADA');
  }

  const formulario = new FormData();

  formulario.append('archivo', archivo, nombre);

  let respuesta: Response;

  try {
    respuesta = await expoFetch(`${API_BASE_URL}/archivos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formulario,
    });
  } catch (error) {
    console.error('ERROR REAL AL SUBIR ARCHIVO:', error);
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

    if (respuesta.status === 401) {
      throw new Error('SESION_NO_VALIDA');
    }

    if (respuesta.status === 403) {
      throw new Error('SIN_PERMISOS');
    }

    throw new Error(codigo || `ERROR_API_${respuesta.status}`);
  }

  const url = resultado?.datos?.url;

  if (typeof url !== 'string' || !url) {
    throw new Error('RESPUESTA_INVALIDA');
  }

  return url;
}

export async function subirImagenAPI(
  uri: string,
  nombre: string,
  mimeType: string,
): Promise<string> {
  const archivo = new File(uri);

  return enviarArchivoAPI(archivo, nombre);
}

export async function subirAudioguiaAPI(
  archivo: File,
  nombre: string,
): Promise<string> {
  const url = await enviarArchivoAPI(archivo, nombre);

  const marca = '/archivos/';
  const posicion = url.indexOf(marca);

  if (posicion === -1) {
    throw new Error('RESPUESTA_INVALIDA');
  }

  const clave = url.slice(posicion + marca.length);

  if (
    !/^audios\/\d{4}\/\d{2}\/[a-z0-9-]{3,60}\.(m4a|aac|mp3)$/.test(
      clave,
    )
  ) {
    throw new Error('RESPUESTA_INVALIDA');
  }

  return clave;
}


export type AudioguiaActivaAPI = {
  url: string;
  duracionSegundos?: number;
  idioma?: string;
  transcripcion?: string | null;
};

export async function obtenerAudioguiaActivaAPI(
  lugarId: string,
): Promise<AudioguiaActivaAPI | null> {
  const audioguia = await consultarAPI<AudioguiaActivaAPI | null>(
    `/lugares/${lugarId}/audioguia-activa`,
  );

  if (!audioguia?.url) {
    return null;
  }

  return {
    ...audioguia,
    url: prepararUrlImagen(audioguia.url),
  };
}

/**
 * Sube una audioguía y devuelve su clave relativa para asociarla
 * a un lugar mediante el endpoint de audioguías.
 */
