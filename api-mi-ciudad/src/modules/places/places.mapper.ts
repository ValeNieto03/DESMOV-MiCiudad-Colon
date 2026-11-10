import type { Lugar } from '../../../contract/types.js';
import { urlDeArchivo } from '../../common/files/urls.js';
import { aIsoConZona } from '../../common/dates/dates.js';
import type { LugarEntidad } from './place.entity.js';
import type { AudioguiaEntidad } from './audioguia.entity.js';
import { actualizadoEnVigente, horariosVigentes } from './rules/hours.js';

/**
 * La única salida de un lugar hacia el cliente.
 * Conserva el contrato público actual de la aplicación.
 */
export function aContrato(
  l: LugarEntidad,
  ahora: Date,
  audioguiaActiva?: AudioguiaEntidad | null,
): Lugar {
  const clave = audioguiaActiva?.clave ?? l.audioguiaClave;
  const duracionSegundos =
    audioguiaActiva?.duracionSegundos ?? l.audioguiaDuracionSegundos;
  const idioma = audioguiaActiva?.idioma ?? l.audioguiaIdioma;

  return {
    id: l.id,
    nombre: l.nombre,
    categoriaId: l.categoriaId,
    descripcionCorta: l.descripcionCorta,
    descripcion: l.descripcion,
    coordenadas: { latitud: l.latitud, longitud: l.longitud },
    direccion: l.direccion,
    imagenes: l.imagenes.map(urlDeArchivo),
    horarios: horariosVigentes(l.horarios, ahora),
    telefono: l.telefono,
    sitioWeb: l.sitioWeb,
    precioEntrada: l.precioEntrada,
    audioguia:
      clave === null || duracionSegundos === null || idioma === null
        ? null
        : {
          url: urlDeArchivo(clave),
          duracionSegundos,
          idioma,
        },
    codigoQr: l.codigoQr,
    accesible: l.accesible,
    activo: l.activo,
    actualizadoEn: aIsoConZona(
      actualizadoEnVigente(l.actualizadoEn, l.tieneTemporadas, ahora),
    ),
  };
}