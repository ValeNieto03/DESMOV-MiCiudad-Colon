
import { Entity, Index } from 'typeorm';
import {
    ColumnaId,
    ColumnaInstante,
    ColumnaTexto,
} from '../../common/db/columns.js';

/**
 * Registro interno de recordatorios push enviados para eventos.
 * Un mismo evento puede tener otro recordatorio si se reprograma.
 */
@Entity('recordatorios_eventos')
@Index(['eventoId', 'inicioProgramado'], { unique: true })
export class RecordatorioEventoEntidad {
    @ColumnaId()
    id: string;

    @ColumnaTexto(40)
    eventoId: string;

    @ColumnaInstante()
    inicioProgramado: Date;

    @ColumnaInstante()
    enviadoEn: Date;
}
