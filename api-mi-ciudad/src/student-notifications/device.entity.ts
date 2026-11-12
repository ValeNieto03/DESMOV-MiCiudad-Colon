import { Entity } from 'typeorm';
import {
  ColumnaId,
  ColumnaEnum,
  ColumnaInstante,
  ColumnaTexto,
} from '../common/db/columns.js';
import type { PlataformaPush } from '../common/notifications/ports.js';

@Entity('dispositivos')
export class DispositivoEntidad {
  @ColumnaId()
  id: string;

  @ColumnaTexto(200, { unico: true })
  tokenExpo: string;

  @ColumnaTexto(40)
  usuarioId: string;

  @ColumnaEnum()
  plataforma: PlataformaPush;

  @ColumnaInstante()
  creadoEn: Date;
}
