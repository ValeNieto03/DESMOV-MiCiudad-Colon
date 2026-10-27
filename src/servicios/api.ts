
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
  audioguia?: string | null;
  codigoQr?: string | null;
  accesible?: boolean;
  activo?: boolean;
  actualizadoEn?: string;
};

type RespuestaAPI<T> = {
  datos: T;
  meta?: unknown;
};

async function consultarAPI<T>(ruta: string): Promise<T> {
  const respuesta = await fetch(`${API_BASE_URL}${ruta}`);

  if (!respuesta.ok) {
    throw new Error(
      `Error de la API: ${respuesta.status} ${respuesta.statusText}`,
    );
  }

  const resultado = (await respuesta.json()) as RespuestaAPI<T>;

  return resultado.datos;
}

export async function comprobarConexionAPI() {
  const datos = await consultarAPI<{
    estado: string;
    motor: string;
    almacen: string;
    version: string;
  }>('/salud');

  if (datos.estado !== 'ok') {
    throw new Error('La API respondió, pero no está en estado OK.');
  }

  return datos;
}

export async function obtenerLugaresAPI(): Promise<LugarAPI[]> {
  return consultarAPI<LugarAPI[]>('/lugares');
}

export async function obtenerCategoriasAPI() {
  return consultarAPI<
    Array<{
      id: string;
      nombre: string;
    }>
  >('/categorias');
}

export function prepararUrlImagen(url: string): string {
  return url.replace(
    'http://localhost:3000',
    API_BASE_URL,
  );
}
