
import * as Notifications from 'expo-notifications';

// Solicita permiso para mostrar notificaciones si todavía no está concedido.
async function asegurarPermisoNotificaciones(): Promise<boolean> {
  try {
    const permisosActuales =
      await Notifications.getPermissionsAsync();

    let estadoPermiso = permisosActuales.status;

    if (estadoPermiso !== 'granted') {
      const respuesta =
        await Notifications.requestPermissionsAsync();

      estadoPermiso = respuesta.status;
    }

    return estadoPermiso === 'granted';
  } catch (error) {
    console.warn(
      'No se pudo comprobar el permiso de notificaciones:',
      error,
    );

    return false;
  }
}

// Notificación inmediata cuando se registra una visita GPS o QR.
export async function notificarVisitaRegistrada(
  nombreLugar: string,
): Promise<void> {
  try {
    const tienePermiso =
      await asegurarPermisoNotificaciones();

    if (!tienePermiso) {
      console.log(
        'Permiso de notificaciones no concedido.',
      );
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '¡Visita registrada!',
        body: `Tu visita a ${nombreLugar} fue registrada correctamente.`,
        sound: true,
      },
      trigger: null,
    });

    console.log(
      'Notificación de visita enviada:',
      nombreLugar,
    );
  } catch (error) {
    console.warn(
      'No se pudo mostrar la notificación de visita:',
      error,
    );
  }
}
