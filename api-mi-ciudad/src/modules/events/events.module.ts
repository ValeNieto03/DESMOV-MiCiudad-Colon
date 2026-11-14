
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventosGuardadosModulo } from '../saved-events/saved-events.module.js';
import { EventoGuardadoEntidad } from '../saved-events/saved-event.entity.js';
import { LugaresModulo } from '../places/places.module.js';
import { EventoEntidad } from './event.entity.js';
import { RecordatorioEventoEntidad } from './event-reminder.entity.js';
import { EventosControlador } from './events.controller.js';
import { EventosServicio } from './events.service.js';
import { RecordatoriosEventosServicio } from './event-reminders.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventoEntidad,
      EventoGuardadoEntidad,
      RecordatorioEventoEntidad,
    ]),
    LugaresModulo,
    EventosGuardadosModulo,
  ],
  controllers: [EventosControlador],
  providers: [EventosServicio, RecordatoriosEventosServicio],
  exports: [EventosServicio],
})
export class EventosModulo { }
