import {
  consultarAPI,
  subirImagenAPI,
} from '@/servicios/api';

import {
  obtenerUsuarioActual,
} from '@/servicios/autenticacion';

import {
  obtenerVisitasPendientes,
  obtenerLugaresLocales,
  marcarVisitaSincronizada,
  actualizarFotoVisita,
  type Visita,
} from '@/servicios/visitas';

type DatosVisitaAPI = {
  fechaHora: string;
  origen: Visita['origen'];
  nota: string | null;
  fotoUri: string | null;
};

function esUrlRemota(uri: string): boolean {
  return /^https?:\/\//i.test(uri);
}

async function verificarMismaSesion(usuarioId: string): Promise<void> {
  const usuarioActual = await obtenerUsuarioActual();

  if (!usuarioActual || usuarioActual.id !== usuarioId) {
    throw new Error('LA_SESION_CAMBIO_DURANTE_LA_SINCRONIZACION');
  }
}

/**
 * Sube una foto local y conserva la URL remota en SQLite.
 * Si ya es una URL remota, no vuelve a subirla.
 */
async function prepararFoto(
  visita: Visita,
): Promise<string | null> {
  if (!visita.fotoUri) {
    return null;
  }

  if (esUrlRemota(visita.fotoUri)) {
    return visita.fotoUri;
  }

  const fotoRemota = await subirImagenAPI(
    visita.fotoUri,
    `${visita.id}.jpg`,
    'image/jpeg',
  );

  const actualizada = actualizarFotoVisita(
    visita.id,
    fotoRemota,
    visita.fotoUri
  );

  if (!actualizada) {
    throw new Error('FOTO_CAMBIO_DURANTE_SUBIDA');
  }

  return fotoRemota;
}

/**
 * Actualiza los datos de una visita que ya existe en la API.
 */
async function actualizarVisitaAPI(
  visita: Visita,
  datos: DatosVisitaAPI,
): Promise<void> {
  await verificarMismaSesion(visita.usuarioId);

  await consultarAPI(
    `/yo/visitas/${encodeURIComponent(visita.id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(datos),
    },
    true,
  );
}
/**
 * Envía una visita local a la API.
 */
async function sincronizarVisita(
  visita: Visita,
  lugarApiId: string,
): Promise<void> {
  await verificarMismaSesion(visita.usuarioId);

  const fotoUri = await prepararFoto(visita);

  await verificarMismaSesion(visita.usuarioId);

  const datos: DatosVisitaAPI = {
    fechaHora: visita.fechaHora,
    origen: visita.origen,
    nota: visita.nota,
    fotoUri,
  };

  if (visita.accionPendiente === 'actualizar') {
    await actualizarVisitaAPI(visita, datos);
  } else {
    await consultarAPI(
      '/yo/visitas',
      {
        method: 'POST',
        body: JSON.stringify({
          id: visita.id,
          lugarId: lugarApiId,
          ...datos,
        }),
      },
      true,
    );
  }

  await verificarMismaSesion(visita.usuarioId);

  const marcada = marcarVisitaSincronizada({
    ...visita,
    fotoUri,
  });

  if (!marcada) {
    console.log(
      'LA VISITA SIGUE PENDIENTE PORQUE CAMBIÓ DURANTE LA SINCRONIZACIÓN:',
      visita.id,
    );
  }
}

/**
 * Envía todas las visitas pendientes de la cuenta activa.
 * Los errores individuales no detienen el resto de los envíos.
 */
let sincronizacionEnCurso: {
  usuarioId: string;
  promesa: Promise<void>;
} | null = null;

export async function sincronizarVisitasPendientes(): Promise<void> {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    console.log('SINCRONIZACIÓN DE VISITAS: no hay sesión activa.');
    return;
  }

  if (sincronizacionEnCurso?.usuarioId === usuario.id) {
    return sincronizacionEnCurso.promesa;
  }

  const ejecucion = ejecutarSincronizacion(usuario.id);

  const promesa = ejecucion.finally(() => {
    if (sincronizacionEnCurso?.promesa === promesa) {
      sincronizacionEnCurso = null;
    }
  });

  sincronizacionEnCurso = {
    usuarioId: usuario.id,
    promesa,
  };

  return promesa;
}

async function ejecutarSincronizacion(usuarioId: string): Promise<void> {
  const usuario = await obtenerUsuarioActual();

  if (!usuario || usuario.id !== usuarioId) {
    return;
  }
  const pendientes = obtenerVisitasPendientes().filter(
    (visita) => visita.usuarioId === usuario.id,
  );

  if (pendientes.length === 0) {
    return;
  }

  const lugares = obtenerLugaresLocales();

  console.log('VISITAS PENDIENTES PARA SINCRONIZAR:', pendientes.length);

  for (const visita of pendientes) {
    try {
      const lugar = lugares.find(
        (item) => item.id === visita.lugarId,
      );

      if (!lugar?.apiId) {
        throw new Error(
          `LUGAR_SIN_ID_API: ${visita.lugarId}`,
        );
      }

      await sincronizarVisita(visita, lugar.apiId);
    } catch (error) {
      console.warn(
        'NO SE PUDO SINCRONIZAR LA VISITA:',
        visita.id,
        error,
      );
    }
  }
}