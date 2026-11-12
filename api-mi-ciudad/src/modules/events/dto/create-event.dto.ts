import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsString,
  Max,
  MaxLength,
  Min,
  Validate,
  ValidateNested,
} from 'class-validator';
import { Opcional, OpcionalONulo, Recortar } from '../../../common/validation/decorators.js';
import { EsInstanteConZona } from '../../../common/validation/instant.js';
import type { EstadoGuardado } from '../rules/agenda.js';
import { CoordenadasEventoDto } from './event-coordinates.dto.js';

const ESTADOS = ['programado', 'suspendido', 'cancelado'] as const;

export class CrearEventoDto {
  @ApiProperty({ example: 'Feria de artesanos en la plaza' })
  @Recortar()
  @IsString({ message: 'El título tiene que ser un texto.' })
  @IsNotEmpty({ message: 'El título no puede quedar vacío.' })
  @MaxLength(200, { message: 'El título puede tener hasta 200 caracteres.' })
  titulo: string;

  @ApiProperty({ example: 'Una jornada con artesanos y productores locales.' })
  @Recortar()
  @IsString({ message: 'La descripción tiene que ser un texto.' })
  @IsNotEmpty({ message: 'La descripción no puede quedar vacía.' })
  descripcion: string;

  @ApiPropertyOptional({ nullable: true, example: 'lug-009' })
  @OpcionalONulo()
  @IsString({ message: 'El identificador del lugar no es válido.' })
  @MaxLength(40, { message: 'El identificador del lugar no es válido.' })
  lugarId?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Plaza Washington, Colón' })
  @OpcionalONulo()
  @Recortar()
  @IsString({ message: 'La dirección tiene que ser un texto.' })
  @MaxLength(200, { message: 'La dirección puede tener hasta 200 caracteres.' })
  direccionLibre?: string | null;

  @ApiPropertyOptional({ type: CoordenadasEventoDto, nullable: true })
  @OpcionalONulo()
  @IsObject({ message: 'Las coordenadas no son válidas.' })
  @ValidateNested()
  @Type(() => CoordenadasEventoDto)
  coordenadas?: CoordenadasEventoDto | null;

  @ApiProperty({ example: '2026-11-14T20:30:00-03:00' })
  @IsString({ message: 'La fecha de inicio no es válida.' })
  @Validate(EsInstanteConZona, {
    message: 'La fecha de inicio tiene que incluir fecha, hora y zona horaria.',
  })
  inicio: string;

  @ApiPropertyOptional({ nullable: true, example: '2026-11-14T23:00:00-03:00' })
  @OpcionalONulo()
  @IsString({ message: 'La fecha de finalización no es válida.' })
  @Validate(EsInstanteConZona, {
    message: 'La fecha de finalización tiene que incluir fecha, hora y zona horaria.',
  })
  fin?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'URL devuelta por POST /archivos.',
  })
  @OpcionalONulo()
  @IsString({ message: 'La imagen no es válida.' })
  @MaxLength(2000, { message: 'La URL de imagen es demasiado larga.' })
  imagenUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 2500 })
  @OpcionalONulo()
  @Type(() => Number)
  @IsInt({ message: 'El precio tiene que ser un número entero.' })
  @Min(0, { message: 'El precio no puede ser negativo.' })
  @Max(2147483647, { message: 'El precio es demasiado alto.' })
  precio?: number | null;

  @ApiPropertyOptional({ enum: ESTADOS, default: 'programado' })
  @Opcional()
  @IsIn(ESTADOS, {
    message: 'El estado tiene que ser programado, suspendido o cancelado.',
  })
  estado?: EstadoGuardado;
}
