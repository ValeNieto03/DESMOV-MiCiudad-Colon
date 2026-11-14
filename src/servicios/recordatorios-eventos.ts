
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import { EventoAPI } from '@/servicios/api';

const RECORDATORIOS_KEY = 'mi-ciudad-recordatorios-eventos';

const UNA_HORA_MS = 60 * 60 * 1000;

type RecordatorioGuardado = {
  notificacionId: string;
  inicio: string;
};

type RecordatoriosGuardados = Record<string, RecordatorioGuardado>;

// Normaliza fechas que pueden venir de MySQL con un espacio
// en lugar de la letra T.
function normalizarFecha(fecha: string): Date {
  const fechaNormalizada = fecha.includes('T')
    ? fecha
    : fecha.replace(' ', 'T');

  return new Date(fechaNormalizada);
}

// Recupera los identificadores guardados localmente.
async function obtenerRecordatorios(): Promise<RecordatoriosGuardados> {
  try {
    const contenido = await AsyncStorage.getItem(RECORDATORIOS_KEY);

    if (!contenido) return {};

    return JSON.parse(contenido) as RecordatoriosGuardados;
  } catch (error) {
    console.warn('No se pudieron leer los recordatorios:', error);
    return {};
  }
}

// Guarda los identificadores localmente.
async function guardarRecordatorios(
  recordatorios: RecordatoriosGuardados,
): Promise<void> {
  await AsyncStorage.setItem(
    RECORDATORIOS_KEY,
    JSON.stringify(recordatorios),
  );
}

// Comprueba o solicita permiso para notificaciones.
async function asegurarPermiso(): Promise<boolean> {
  try {
    const permisos = await Notifications.getPermissionsAsync();

    let estado = permisos.status;

    if (estado !== 'granted') {
      const respuesta =
        await Notifications.requestPermissionsAsync();

      estado = respuesta.status;
    }

    return estado === 'granted';
  } catch (error) {
    console.warn('No se pudo obtener permiso de notificaciones:', error);
    return false;
  }
}

// Cancela un recordatorio y evita que un error interrumpa la agenda.
async function cancelarNotificacion(
  notificacionId: string,
): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(
      notificacionId,
    );
  } catch (error) {
    console.warn('No se pudo cancelar una notificación:', error);
  }
}

// Programa el aviso una hora antes del evento.
export async function programarRecordatorioEvento(
  evento: EventoAPI,
): Promise<void> {
  try {
    const recordatorios = await obtenerRecordatorios();
    const existente = recordatorios[evento.id];

    const fechaInicio = normalizarFecha(evento.inicio);
    const fechaRecordatorio = new Date(
      fechaInicio.getTime() - UNA_HORA_MS,
    );

    // Solo se programan eventos vigentes.
    if (
      evento.estado !== 'programado' ||
      Number.isNaN(fechaInicio.getTime()) ||
      fechaRecordatorio.getTime() <= Date.now()
    ) {
      if (existente) {
        await cancelarNotificacion(existente.notificacionId);
        delete recordatorios[evento.id];
        await guardarRecordatorios(recordatorios);
      }

      return;
    }

    // Si ya existe un recordatorio para la misma fecha,
    // no se crea otro.
    if (
      existente &&
      existente.inicio === evento.inicio
    ) {
      return;
    }

    // Si cambió la fecha, cancelamos el aviso anterior.
    if (existente) {
      await cancelarNotificacion(existente.notificacionId);
      delete recordatorios[evento.id];
    }

    const tienePermiso = await asegurarPermiso();

    if (!tienePermiso) {
      console.log('No se concedió permiso para recordar el evento.');
      await guardarRecordatorios(recordatorios);
      return;
    }

    const notificacionId =
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Se acerca un evento!',
          body: `Dentro de una hora comienza: ${evento.titulo}`,
          sound: true,
          data: {
            eventoId: evento.id,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fechaRecordatorio,
        },
      });

    recordatorios[evento.id] = {
      notificacionId,
      inicio: evento.inicio,
    };

    await guardarRecordatorios(recordatorios);

    console.log(
      'Recordatorio programado:',
      evento.titulo,
      fechaRecordatorio,
    );
  } catch (error) {
    console.warn(
      'No se pudo programar el recordatorio del evento:',
      evento.titulo,
      error,
    );
  }
}

// Cancela el recordatorio cuando se quita un evento de la agenda.
export async function cancelarRecordatorioEvento(
  eventoId: string,
): Promise<void> {
  try {
    const recordatorios = await obtenerRecordatorios();
    const existente = recordatorios[eventoId];

    if (!existente) return;

    await cancelarNotificacion(existente.notificacionId);

    delete recordatorios[eventoId];

    await guardarRecordatorios(recordatorios);

    console.log('Recordatorio cancelado:', eventoId);
  } catch (error) {
    console.warn(
      'No se pudo cancelar el recordatorio del evento:',
      eventoId,
      error,
    );
  }
}

// Sincroniza los recordatorios al cargar Mi agenda.
// También elimina avisos de eventos que ya no están guardados.
export async function sincronizarRecordatoriosEventos(
  eventos: EventoAPI[],
): Promise<void> {
  try {
    const recordatorios = await obtenerRecordatorios();
    const idsActuales = new Set(eventos.map((evento) => evento.id));

    for (const [eventoId, recordatorio] of Object.entries(recordatorios)) {
      if (!idsActuales.has(eventoId)) {
        await cancelarNotificacion(recordatorio.notificacionId);
        delete recordatorios[eventoId];
      }
    }

    await guardarRecordatorios(recordatorios);

    for (const evento of eventos) {
      await programarRecordatorioEvento(evento);
    }
  } catch (error) {
    console.warn(
      'No se pudieron sincronizar los recordatorios:',
      error,
    );
  }
}