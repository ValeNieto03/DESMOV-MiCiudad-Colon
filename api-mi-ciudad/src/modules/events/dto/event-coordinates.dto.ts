import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class CoordenadasEventoDto {
  @ApiProperty({ example: -32.2236 })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'La latitud tiene que ser un número.' },
  )
  @Min(-90, { message: 'La latitud tiene que estar entre -90 y 90.' })
  @Max(90, { message: 'La latitud tiene que estar entre -90 y 90.' })
  latitud: number;

  @ApiProperty({ example: -58.1427 })
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'La longitud tiene que ser un número.' },
  )
  @Min(-180, { message: 'La longitud tiene que estar entre -180 y 180.' })
  @Max(180, { message: 'La longitud tiene que estar entre -180 y 180.' })
  longitud: number;
}
