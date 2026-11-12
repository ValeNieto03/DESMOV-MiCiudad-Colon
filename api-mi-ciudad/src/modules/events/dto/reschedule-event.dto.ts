import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, Validate } from 'class-validator';
import { OpcionalONulo } from '../../../common/validation/decorators.js';
import { EsInstanteConZona } from '../../../common/validation/instant.js';

export class ReprogramarEventoDto {
  @ApiProperty({ example: '2026-11-21T20:30:00-03:00' })
  @IsString({ message: 'La nueva fecha de inicio no es válida.' })
  @Validate(EsInstanteConZona, {
    message: 'La nueva fecha de inicio tiene que incluir fecha, hora y zona horaria.',
  })
  inicio: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-11-21T23:00:00-03:00' })
  @OpcionalONulo()
  @IsString({ message: 'La fecha de finalización no es válida.' })
  @Validate(EsInstanteConZona, {
    message: 'La fecha de finalización tiene que incluir fecha, hora y zona horaria.',
  })
  fin?: string | null;
}
