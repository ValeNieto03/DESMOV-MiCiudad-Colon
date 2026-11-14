
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ALMACEN_TOKENS_PUSH,
  ENVIADOR_PUSH,
  PendienteDeImplementar,
  type AlmacenTokensPush,
  type EnviadorPush,
} from './ports.js';

export interface Aviso {
  titulo: string;
  cuerpo: string;
  datos: Record<string, string>;
}

export interface ResultadoAviso {
  aceptado: boolean;
  tokensConsultados: number;
}

@Injectable()
export class AvisosServicio {
  private readonly log = new Logger('Avisos');
  private readonly pendientes = new Set<Promise<void>>();

  constructor(
    @Inject(ALMACEN_TOKENS_PUSH) private readonly almacen: AlmacenTokensPush,
    @Inject(ENVIADOR_PUSH) private readonly enviador: EnviadorPush,
  ) { }

  /** Dispara el envío en segundo plano, sin interrumpir la operación original. */
  avisar(usuarioIds: string[], aviso: Aviso): void {
    const ids = [...new Set(usuarioIds)];
    if (ids.length === 0) return;

    const envio = this.enviar(ids, aviso)
      .then(() => undefined)
      .finally(() => this.pendientes.delete(envio));

    this.pendientes.add(envio);
  }

  /**
   * Espera el resultado del envío. Se utiliza para procesos que deben reintentar
   * si Expo no acepta todos los mensajes.
   */
  async avisarYEsperar(
    usuarioIds: string[],
    aviso: Aviso,
  ): Promise<ResultadoAviso> {
    const ids = [...new Set(usuarioIds)];
    if (ids.length === 0) {
      return { aceptado: false, tokensConsultados: 0 };
    }

    const tokens = await this.almacen.tokensDe(ids);
    if (tokens.length === 0) {
      return { aceptado: false, tokensConsultados: 0 };
    }

    const resultado = await this.enviador.enviar([{ tokens, ...aviso }]);

    if (resultado.tokensInvalidos.length > 0) {
      await this.almacen.descartar(resultado.tokensInvalidos);
    }

    return {
      aceptado: resultado.aceptado,
      tokensConsultados: tokens.length,
    };
  }

  private async enviar(usuarioIds: string[], aviso: Aviso): Promise<void> {
    try {
      const resultado = await this.avisarYEsperar(usuarioIds, aviso);

      if (!resultado.aceptado) {
        this.log.warn(
          `Push no aceptada: ${aviso.titulo} → ${usuarioIds.length} usuarios.`,
        );
      }
    } catch (error) {
      if (error instanceof PendienteDeImplementar) {
        this.log.log(
          `Push pendiente de implementar: ${aviso.titulo} → ${usuarioIds.length} usuarios`,
        );
      } else {
        this.log.warn(
          `No se pudo mandar la push: ${error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  /** Para los tests: espera a que terminen los envíos en curso. */
  async esperarPendientes(): Promise<void> {
    await Promise.all(this.pendientes);
  }
}