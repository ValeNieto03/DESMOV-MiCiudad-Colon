
import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { And, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { Reloj } from '../../common/clock/clock.js';
import { nuevoId } from '../../common/ids/ids.js';
import { AvisosServicio } from '../../common/notifications/notices.service.js';
import { EventoGuardadoEntidad } from '../saved-events/saved-event.entity.js';
import { EventoEntidad } from './event.entity.js';
import { RecordatorioEventoEntidad } from './event-reminder.entity.js';

const UNA_HORA_MS = 60 * 60 * 1000;
const INTERVALO_MS = 60 * 1000;

@Injectable()
export class RecordatoriosEventosServicio
    implements OnModuleInit, OnModuleDestroy {
    private readonly log = new Logger('RecordatoriosEventos');
    private intervalo: ReturnType<typeof setInterval> | undefined;
    private comprobando = false;

    constructor(
        @InjectRepository(EventoEntidad)
        private readonly eventos: Repository<EventoEntidad>,
        @InjectRepository(EventoGuardadoEntidad)
        private readonly guardados: Repository<EventoGuardadoEntidad>,
        @InjectRepository(RecordatorioEventoEntidad)
        private readonly recordatorios: Repository<RecordatorioEventoEntidad>,
        private readonly avisos: AvisosServicio,
        private readonly reloj: Reloj,
    ) { }

    onModuleInit(): void {
        this.intervalo = setInterval(() => {
            void this.comprobar().catch((error: unknown) => {
                this.log.error(
                    `Error al comprobar recordatorios: ${error instanceof Error ? error.message : String(error)
                    }`,
                );
            });
        }, INTERVALO_MS);

        this.intervalo.unref();

        void this.comprobar().catch((error: unknown) => {
            this.log.error(
                `Error en la comprobación inicial: ${error instanceof Error ? error.message : String(error)
                }`,
            );
        });
    }

    onModuleDestroy(): void {
        if (this.intervalo) {
            clearInterval(this.intervalo);
            this.intervalo = undefined;
        }
    }

    /** Comprueba y envía los recordatorios de eventos próximos. */
    async comprobar(): Promise<void> {
        if (this.comprobando) return;

        this.comprobando = true;

        try {
            const ahora = this.reloj.ahora();
            const limite = new Date(ahora.getTime() + UNA_HORA_MS);

            const eventos = await this.eventos.find({
                where: {
                    estado: 'programado',
                    inicio: And(MoreThan(ahora), LessThanOrEqual(limite)),
                    finEfectivo: MoreThan(ahora),
                },
                order: { inicio: 'ASC' },
            });

            for (const evento of eventos) {
                await this.procesarEvento(evento);
            }
        } finally {
            this.comprobando = false;
        }
    }

    private async procesarEvento(evento: EventoEntidad): Promise<void> {
        try {
            const inicioProgramado = evento.inicio;

            const yaEnviado = await this.recordatorios.existsBy({
                eventoId: evento.id,
                inicioProgramado,
            });

            if (yaEnviado) return;

            // Relee el evento para no enviar un aviso con una fecha que cambió.
            const vigente = await this.eventos.findOneBy({ id: evento.id });
            if (!vigente || vigente.estado !== 'programado') return;

            if (
                vigente.inicio.getTime() !== inicioProgramado.getTime() ||
                vigente.inicio.getTime() <= this.reloj.ahora().getTime() ||
                vigente.finEfectivo.getTime() <= this.reloj.ahora().getTime()
            ) {
                return;
            }

            // Consulta los destinatarios actuales, no una lista almacenada en caché.
            const guardados = await this.guardados.findBy({
                eventoId: vigente.id,
            });

            const usuarioIds = guardados.map((guardado) => guardado.usuarioId);
            if (usuarioIds.length === 0) return;

            const resultado = await this.avisos.avisarYEsperar(usuarioIds, {
                titulo: 'Se acerca un evento',
                cuerpo: `${vigente.titulo} comienza en aproximadamente una hora.`,
                datos: {
                    tipo: 'recordatorio-evento',
                    eventoId: vigente.id,
                },
            });

            if (!resultado.aceptado) {
                this.log.warn(
                    `Recordatorio pendiente: ${vigente.id}. No se confirmó la aceptación de Expo.`,
                );
                return;
            }

            await this.recordatorios.insert({
                id: nuevoId('rve'),
                eventoId: vigente.id,
                inicioProgramado,
                enviadoEn: this.reloj.ahora(),
            });

            this.log.log(`Recordatorio enviado para el evento ${vigente.id}.`);
        } catch (error) {
            this.log.error(
                `No se pudo procesar el evento ${evento.id}: ${error instanceof Error ? error.message : String(error)
                }`,
            );
        }
    }
}