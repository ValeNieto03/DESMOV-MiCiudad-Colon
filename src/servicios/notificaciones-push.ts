
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { consultarAPI } from '@/servicios/api';

const TOKEN_PUSH_KEY = 'mi-ciudad-token-push';

type PlataformaPush = 'android' | 'ios';

/**
 * Obtiene permiso y registra el teléfono en el backend.
 * Si falla, no impide iniciar sesión ni utilizar la aplicación.
 */
export async function registrarDispositivoPush(): Promise<void> {
  try {
    // Las notificaciones push requieren un dispositivo físico.
    if (!Device.isDevice) {
      console.log('El registro push requiere un dispositivo físico.');
      return;
    }

    // Comprobar permisos.
    let permisos = await Notifications.getPermissionsAsync();

    if (permisos.status !== 'granted') {
      permisos = await Notifications.requestPermissionsAsync();
    }

    if (permisos.status !== 'granted') {
      console.log('El usuario no concedió permisos de notificaciones.');
      return;
    }

    // Crear el canal de notificaciones para Android.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notificaciones de Mi Ciudad',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // Identificar el proyecto de Expo.
    const projectId =
      Constants.default.expoConfig?.extra?.eas?.projectId ??
      Constants.default.easConfig?.projectId;

    if (!projectId) {
      throw new Error('FALTA_PROJECT_ID_EXPO');
    }

    // Obtener el token push del teléfono.
    const respuestaToken = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const tokenExpo = respuestaToken.data;

    if (!tokenExpo) {
      throw new Error('TOKEN_PUSH_NO_DISPONIBLE');
    }

    const plataforma: PlataformaPush =
      Platform.OS === 'ios' ? 'ios' : 'android';

    // Registrar o actualizar la asociación del dispositivo.
    await consultarAPI(
      '/dispositivos',
      {
        method: 'POST',
        body: JSON.stringify({
          tokenExpo,
          plataforma,
        }),
      },
      true,
    );

    // Guardar el token para poder darlo de baja al cerrar sesión.
    await SecureStore.setItemAsync(TOKEN_PUSH_KEY, tokenExpo);

    console.log('Dispositivo registrado para notificaciones push.');
  } catch (error) {
    console.warn(
      'No se pudo registrar el dispositivo para notificaciones:',
      error,
    );
  }
}

/**
 * Da de baja el dispositivo antes de eliminar el JWT.
 */
export async function darDeBajaDispositivoPush(): Promise<void> {
  try {
    const tokenExpo = await SecureStore.getItemAsync(TOKEN_PUSH_KEY);

    if (!tokenExpo) {
      return;
    }

    await consultarAPI(
      `/dispositivos/${encodeURIComponent(tokenExpo)}`,
      {
        method: 'DELETE',
      },
      true,
    );

    await SecureStore.deleteItemAsync(TOKEN_PUSH_KEY);

    console.log('Dispositivo dado de baja de las notificaciones push.');
  } catch (error) {
    console.warn(
      'No se pudo dar de baja el dispositivo:',
      error,
    );
  }
}



export async function probarNotificacionPush(): Promise<number> {
  const respuesta = await consultarAPI<{
    enviadas: number;
  }>(
    '/dispositivos/prueba',
    {
      method: 'POST',
    },
    true,
  );

  return respuesta.enviadas;
}
