
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type EnviadorPush,
  type MensajePush,
} from '../common/notifications/ports.js';
import { ENTORNO } from '../config/environment.module.js';
import type { Entorno } from '../config/environment.js';

interface TicketExpo {
  status?: string;
  details?: {
    error?: string;
  };
}

interface RespuestaExpo {
  data?: TicketExpo[];
}

@Injectable()
export class EnviadorPorHacer implements EnviadorPush {
  private readonly log = new Logger('EnvioPush');

  constructor(
    @Inject(ENTORNO)
    private readonly entorno: Entorno,
  ) { }

  async enviar(
    mensajes: MensajePush[],
  ): Promise<{ tokensInvalidos: string[]; aceptado: boolean }> {
    const tokensInvalidos = new Set<string>();

    const individuales = mensajes.flatMap((mensaje) =>
      mensaje.tokens.map((token) => ({
        to: token,
        title: mensaje.titulo,
        body: mensaje.cuerpo,
        data: mensaje.datos,
      })),
    );

    if (individuales.length === 0) {
      return { tokensInvalidos: [], aceptado: true };
    }

    // En modo registro no se realizan pedidos externos.
    if (this.entorno.NOTIFICACIONES === 'registro') {
      this.log.log(
        `Modo registro: ${individuales.length} notificaciones preparadas, sin envío a Expo.`,
      );

      return { tokensInvalidos: [], aceptado: false };
    }

    let aceptado = true;

    // Expo acepta como máximo 100 mensajes por pedido.
    for (let inicio = 0; inicio < individuales.length; inicio += 100) {
      const tanda = individuales.slice(inicio, inicio + 100);

      try {
        const respuesta = await fetch(this.entorno.EXPO_PUSH_URL, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tanda),
        });

        if (!respuesta.ok) {
          this.log.warn(`Expo respondió con HTTP ${respuesta.status}.`);
          aceptado = false;
          continue;
        }

        const resultado = (await respuesta.json()) as RespuestaExpo;

        if (
          !Array.isArray(resultado.data) ||
          resultado.data.length !== tanda.length
        ) {
          this.log.warn(
            'Expo devolvió una cantidad de tickets distinta de la esperada.',
          );
          aceptado = false;
          continue;
        }

        resultado.data.forEach((ticket, indice) => {
          if (ticket?.status === 'ok') return;

          if (
            ticket?.status === 'error' &&
            ticket.details?.error === 'DeviceNotRegistered'
          ) {
            const token = tanda[indice]?.to;

            if (token) tokensInvalidos.add(token);

            aceptado = false;
            return;
          }

          this.log.warn(
            `Expo rechazó un mensaje: ${ticket?.details?.error ?? 'respuesta inválida'}.`,
          );

          aceptado = false;
        });
      } catch (error) {
        this.log.warn(
          `No se pudo conectar con Expo: ${error instanceof Error ? error.message : String(error)
          }`,
        );
        aceptado = false;
      }
    }

    return {
      tokensInvalidos: [...tokensInvalidos],
      aceptado,
    };
  }
}
