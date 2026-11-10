import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ActualizarTranscripcionDto {
  @ApiProperty({
    example: 'Bienvenidos al Museo Histórico Regional de Colón...',
    description: 'Texto correspondiente a esta audioguía.',
    maxLength: 10000,
  })
  @IsString()
  @MaxLength(10000)
  transcripcion: string;
}