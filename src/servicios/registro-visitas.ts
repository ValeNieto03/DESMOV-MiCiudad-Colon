
import { Alert } from 'react-native';

import {
  buscarVisitaPorLugar,
  guardarVisita,
  actualizarVisitaLocal,
  type Visita,
} from '@/servicios/visitas';

import { notificarVisitaRegistrada } from '@/servicios/notificaciones';
import { sincronizarVisitasPendientes } from '@/servicios/sincronizacion-visitas';
import { confirmarVisitaGuardada } from '@/servicios/confirmacion-visita';

type ResultadoRegistro = 'creada' | 'actualizada';

export function confirmarRegistroVisita(
  visita: Visita,
  nombreLugar: string,
  alFinalizar?: (resultado: ResultadoRegistro) => void
) {
  const registrarNueva = () => {
    try {
      guardarVisita(visita);

      void confirmarVisitaGuardada();
      void sincronizarVisitasPendientes();
      void notificarVisitaRegistrada(nombreLugar);

      console.log('VISITA NUEVA REGISTRADA:', visita);
      alFinalizar?.('creada');
    } catch (error) {
      console.error('Error al guardar la visita:', error);

      Alert.alert(
        'Error',
        'No se pudo guardar la visita. Intentá nuevamente.'
      );
    }
  };

  try {
    const existente = buscarVisitaPorLugar(
      visita.usuarioId,
      visita.lugarId
    );

    if (!existente) {
      registrarNueva();
      return;
    }

    Alert.alert(
      'Ya registraste una visita',
      `Ya tenés una visita a ${nombreLugar}. ¿Qué querés hacer?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Crear nueva',
          onPress: registrarNueva,
        },
        {
          text: 'Actualizar visita',
          onPress: () => {
            try {
              const actualizada: Visita = {
                ...existente,
                fechaHora: visita.fechaHora,
                origen: visita.origen,
                fotoUri: visita.fotoUri ?? existente.fotoUri,
                nota: visita.nota ?? existente.nota,
                sincronizada: false,
              };

              actualizarVisitaLocal(actualizada);

              void confirmarVisitaGuardada();
              void sincronizarVisitasPendientes();

              console.log(
                'VISITA EXISTENTE ACTUALIZADA:',
                actualizada
              );

              alFinalizar?.('actualizada');
            } catch (error) {
              console.error(
                'Error al actualizar la visita:',
                error
              );

              Alert.alert(
                'Error',
                'No se pudo actualizar la visita. Intentá nuevamente.'
              );
            }
          },
        },
      ]
    );
  } catch (error) {
    console.error(
      'Error al comprobar visitas anteriores:',
      error
    );

    Alert.alert(
      'Error',
      'No se pudo comprobar si ya habías visitado este lugar.'
    );
  }
}