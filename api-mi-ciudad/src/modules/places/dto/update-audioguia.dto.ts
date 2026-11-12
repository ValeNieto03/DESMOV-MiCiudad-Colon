import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';
import type { Audioguia } from '../../../../contract/types.js';

export class ActualizarAudioguiaDto {
  @ApiProperty({
    example: 'audios/2026/10/semilla-audio-guide-amphitheater.mp3',
    description: 'Clave del archivo de audio que ya está cargado en la API.',
  })
  @IsString()
  @Matches(/^audios\/\d{4}\/\d{2}\/[a-z0-9-]{3,60}\.(m4a|aac|mp3)$/, {
    message: 'La clave debe identificar un archivo de audio válido.',
  })
  clave: string;

  @ApiProperty({ enum: ['es', 'en', 'pt'], example: 'es' })
  @IsIn(['es', 'en', 'pt'])
  idioma: Audioguia['idioma'];
}
