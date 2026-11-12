import { Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  ColumnaBooleano,
  ColumnaEntero,
  ColumnaId,
  ColumnaInstante,
  ColumnaTexto,
  ColumnaTextoLargo,
} from '../../common/db/columns.js';
import { LugarEntidad } from './place.entity.js';

@Entity('audioguias')
@Index(['lugarId'])
@Index(['lugarId', 'activa'])
export class AudioguiaEntidad {
  @ColumnaId()
  id: string;

  @ColumnaTexto(40)
  lugarId: string;

  @ColumnaTexto(200)
  clave: string;

  @ColumnaTexto(2)
  idioma: 'es' | 'en' | 'pt';

  @ColumnaEntero()
  duracionSegundos: number;

  @ColumnaTextoLargo({ nulo: true })
  transcripcion: string | null;

  @ColumnaBooleano()
  activa: boolean;

  @ColumnaInstante()
  creadoEn: Date;

  @ManyToOne(() => LugarEntidad, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'lugarId' })
  lugar?: LugarEntidad;
}
