import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchivosModulo } from '../files/files.module.js';
import { LugaresControlador } from './places.controller.js';
import { CategoriasModulo } from '../categories/categories.module.js';
import { LugarEntidad } from './place.entity.js';
import { AudioguiaEntidad } from './audioguia.entity.js';
import { LugaresServicio } from './places.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([LugarEntidad, AudioguiaEntidad]),
    CategoriasModulo,
    ArchivosModulo,
  ],
  controllers: [LugaresControlador],
  providers: [LugaresServicio],
  exports: [LugaresServicio],
})
export class LugaresModulo {}

