import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ALMACEN_TOKENS_PUSH,
  ENVIADOR_PUSH,
} from '../common/notifications/ports.js';
import { AlmacenTokensPorHacer } from './todo-token-store.js';
import { EnviadorPorHacer } from './todo-sender.js';
import { DispositivoEntidad } from './device.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([DispositivoEntidad])],
  providers: [
    AlmacenTokensPorHacer,
    EnviadorPorHacer,
    {
      provide: ALMACEN_TOKENS_PUSH,
      useExisting: AlmacenTokensPorHacer,
    },
    {
      provide: ENVIADOR_PUSH,
      useExisting: EnviadorPorHacer,
    },
  ],
  exports: [ALMACEN_TOKENS_PUSH, ENVIADOR_PUSH],
})
export class NotificacionesAlumnosModulo {}
