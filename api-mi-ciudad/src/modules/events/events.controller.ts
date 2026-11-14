
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type {
  RespuestaLista,
  RespuestaUno,
} from '../../../contract/api.js';
import type { Evento } from '../../../contract/types.js';
import { Publico, Roles } from '../../common/auth/decorators.js';
import {
  respuestaLista,
  respuestaUno,
} from '../../common/response/response.js';
import {
  EJEMPLO_EVENTO,
  ejemploError,
} from '../../common/swagger/examples.js';
import { CambiarEstadoDto } from './dto/change-status.dto.js';
import { CrearEventoDto } from './dto/create-event.dto.js';
import { ActualizarEventoDto } from './dto/update-event.dto.js';
import { ReprogramarEventoDto } from './dto/reschedule-event.dto.js';
import { ListarEventosDto } from './dto/list-events.dto.js';
import { EventosServicio } from './events.service.js';

@ApiTags('Agenda')
@Controller('eventos')
export class EventosControlador {
  constructor(private readonly eventos: EventosServicio) { }

  @Publico()
  @Get()
  @ApiOperation({ summary: 'Listar eventos de la agenda' })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos.',
    schema: {
      example: {
        datos: [EJEMPLO_EVENTO],
        meta: { total: 1, pagina: 1, porPagina: 20 },
      },
    },
  })
  async listar(
    @Query() filtros: ListarEventosDto,
  ): Promise<RespuestaLista<Evento>> {
    const resultado = await this.eventos.listar(filtros);
    return respuestaLista(resultado.datos, resultado.meta);
  }

  @Publico()
  @Get(':id')
  @ApiOperation({ summary: 'Consultar el detalle de un evento' })
  @ApiParam({ name: 'id', example: 'evt-024' })
  @ApiResponse({
    status: 200,
    description: 'Evento encontrado.',
    schema: { example: { datos: EJEMPLO_EVENTO, meta: null } },
  })
  @ApiResponse({
    status: 404,
    description: 'Evento inexistente.',
    schema: { example: ejemploError('EVENTO_NO_ENCONTRADO') },
  })
  async detalle(
    @Param('id') id: string,
  ): Promise<RespuestaUno<Evento>> {
    return respuestaUno(await this.eventos.detalle(id));
  }

  @Roles('admin')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un evento (administrador)' })
  @ApiResponse({
    status: 201,
    description: 'Evento creado.',
  })
  async crear(
    @Body() datos: CrearEventoDto,
  ): Promise<RespuestaUno<Evento>> {
    return respuestaUno(await this.eventos.crear(datos));
  }

  @Roles('admin')
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar un evento (administrador)' })
  @ApiParam({ name: 'id', example: 'evt-024' })
  @ApiResponse({
    status: 200,
    description: 'Evento actualizado.',
  })
  async actualizar(
    @Param('id') id: string,
    @Body() datos: ActualizarEventoDto,
  ): Promise<RespuestaUno<Evento>> {
    return respuestaUno(await this.eventos.actualizar(id, datos));
  }

  @Roles('admin')
  @Patch(':id/reprogramar')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reprogramar un evento y establecerlo como programado',
  })
  @ApiParam({ name: 'id', example: 'evt-024' })
  @ApiResponse({
    status: 200,
    description: 'Evento reprogramado.',
  })
  async reprogramar(
    @Param('id') id: string,
    @Body() datos: ReprogramarEventoDto,
  ): Promise<RespuestaUno<Evento>> {
    return respuestaUno(await this.eventos.reprogramar(id, datos));
  }

  @Roles('admin')
  @ApiBearerAuth()
  @Patch(':id/estado')
  @ApiOperation({
    summary: 'Cambiar el estado guardado de un evento (administrador)',
  })
  @ApiParam({ name: 'id', example: 'evt-024' })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado.',
  })
  async cambiarEstado(
    @Param('id') id: string,
    @Body() datos: CambiarEstadoDto,
  ): Promise<RespuestaUno<Evento>> {
    return respuestaUno(await this.eventos.cambiarEstado(id, datos));
  }
}
