import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ActivarAudioguiaDto {
  @ApiProperty({
    example: 'aud-abc123456789',
    description: 'Identificador de la audioguía que se desea activar.',
  })
  @IsString()
  @Matches(/^aud-[a-z0-9]+$/)
  audioguiaId: string;
}