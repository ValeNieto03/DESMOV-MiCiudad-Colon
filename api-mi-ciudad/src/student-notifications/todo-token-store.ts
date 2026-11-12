import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { nuevoId } from '../common/ids/ids.js';
import { esViolacionDeUnicidad } from '../common/db/uniqueness.js';
import type {
  AlmacenTokensPush,
  PlataformaPush,
} from '../common/notifications/ports.js';
import { DispositivoEntidad } from './device.entity.js';

@Injectable()
export class AlmacenTokensPorHacer implements AlmacenTokensPush {
  constructor(
    @InjectRepository(DispositivoEntidad)
    private readonly repo: Repository<DispositivoEntidad>,
  ) {}

  async guardar(
    usuarioId: string,
    tokenExpo: string,
    plataforma: PlataformaPush,
  ): Promise<{ nuevo: boolean }> {
    const existente = await this.repo.findOneBy({ tokenExpo });

    if (existente) {
      await this.repo.update(
        { tokenExpo },
        { usuarioId, plataforma },
      );

      return { nuevo: false };
    }

    try {
      await this.repo.insert({
        id: nuevoId('dis'),
        tokenExpo,
        usuarioId,
        plataforma,
        creadoEn: new Date(),
      });

      return { nuevo: true };
    } catch (error) {
      // Dos solicitudes pueden intentar registrar el mismo token
      // al mismo tiempo. El índice único permite conservar uno solo.
      if (!esViolacionDeUnicidad(error)) {
        throw error;
      }

      const registrado = await this.repo.findOneBy({ tokenExpo });

      if (!registrado) {
        throw error;
      }

      await this.repo.update(
        { tokenExpo },
        { usuarioId, plataforma },
      );

      return { nuevo: false };
    }
  }

  async borrar(tokenExpo: string): Promise<void> {
    await this.repo.delete({ tokenExpo });
  }

  async tokensDe(usuarioIds: string[]): Promise<string[]> {
    const ids = [...new Set(usuarioIds)];

    if (ids.length === 0) {
      return [];
    }

    const dispositivos = await this.repo.find({
      select: { tokenExpo: true },
      where: { usuarioId: In(ids) },
    });

    return dispositivos.map((dispositivo) => dispositivo.tokenExpo);
  }

  async descartar(tokens: string[]): Promise<void> {
    const unicos = [...new Set(tokens)];

    if (unicos.length === 0) {
      return;
    }

    await this.repo.delete({ tokenExpo: In(unicos) });
  }
}
