import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ActualizarImagenDto {
  @ApiProperty({
    example: 'imagenes/2026/11/imagen-del-lugar.jpg',
    description: 'Clave de una imagen que ya está cargada en la API.',
  })
  @IsString()
  @Matches(/^imagenes\/\d{4}\/\d{2}\/[a-z0-9-]{3,60}\.(jpg|png|webp)$/, {
    message: 'La clave debe identificar una imagen válida.',
  })
  clave: string;
}