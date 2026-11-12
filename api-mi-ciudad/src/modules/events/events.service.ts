
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  type FindOperator,
  type FindOptionsWhere,
  LessThan,
  MoreThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import type { Meta } from '../../../contract/api.js';
import type { Coordenadas, Evento } from '../../../contract/types.js';
import { ErrorApi } from '../../common/errors/error-api.js';
import { diaLocal, leerInstante } from '../../common/dates/dates.js';
import { esIdConPrefijo, nuevoId } from '../../common/ids/ids.js';
import { Reloj } from '../../common/clock/clock.js';
import { calcularPaginacion } from '../../common/response/pagination.js';
import { VerificadorArchivos } from '../../common/files/file-verifier.js';
import { EventosGuardadosServicio } from '../saved-events/saved-events.service.js';
import { LugaresServicio } from '../places/places.service.js';
import type { CambiarEstadoDto } from './dto/change-status.dto.js';
import type { ListarEventosDto } from './dto/list-events.dto.js';
import type { CrearEventoDto } from './dto/create-event.dto.js';
import type { ActualizarEventoDto } from './dto/update-event.dto.js';
import type { ReprogramarEventoDto } from './dto/reschedule-event.dto.js';
import type { EventoACargar } from './event-to-load.js';
import { EventoEntidad } from './event.entity.js';
import { aContrato } from './events.mapper.js';
import {
  comienzoDelDia,
  comienzoDelDiaSiguiente,
  esDiaValido,
  finEfectivo,
} from './rules/agenda.js';

const MENSAJE_DIA =
  'El día tiene que ser una fecha real con el formato AAAA-MM-DD, por ejemplo 2026-11-14.';

@Injectable()
export class EventosServicio {
  constructor(
    @InjectRepository(EventoEntidad)
    private readonly repo: Repository<EventoEntidad>,
    private readonly lugares: LugaresServicio,
    private readonly guardados: EventosGuardadosServicio,
    private readonly reloj: Reloj,
    private readonly archivos: VerificadorArchivos,
  ) { }

  async listar(
    filtros: ListarEventosDto,
  ): Promise<{ datos: Evento[]; meta: Meta }> {
    const ahora = this.reloj.ahora();
    const { pagina, porPagina, saltar } = calcularPaginacion(filtros);
    const { desde, hasta } = this.rango(filtros, ahora);
    const meta = (total: number): Meta => ({ total, pagina, porPagina });

    if (
      filtros.lugarId !== undefined &&
      !esIdConPrefijo(filtros.lugarId, 'lug')
    ) {
      return { datos: [], meta: meta(0) };
    }

    const base: FindOptionsWhere<EventoEntidad> = {};

    if (filtros.lugarId !== undefined) {
      base.lugarId = filtros.lugarId;
    }

    let corteDeFin: FindOperator<Date> | undefined;

    if (filtros.estado === 'finalizado' || filtros.estado === 'programado') {
      base.estado = 'programado';
      corteDeFin =
        filtros.estado === 'finalizado'
          ? LessThan(ahora)
          : MoreThanOrEqual(ahora);
    } else if (filtros.estado) {
      base.estado = filtros.estado;
    }

    const empiezaDentro = hasta
      ? And(MoreThanOrEqual(desde), LessThan(hasta))
      : MoreThanOrEqual(desde);

    const empiezaAntes: FindOptionsWhere<EventoEntidad> = { ...base };

    if (hasta) empiezaAntes.inicio = LessThan(hasta);

    empiezaAntes.finEfectivo = corteDeFin
      ? And(MoreThan(desde), corteDeFin)
      : MoreThan(desde);

    const dentro: FindOptionsWhere<EventoEntidad> = {
      ...base,
      inicio: empiezaDentro,
    };

    if (corteDeFin) dentro.finEfectivo = corteDeFin;

    const [filas, total] = await this.repo.findAndCount({
      where: [dentro, empiezaAntes],
      order: { inicio: 'ASC', id: 'ASC' },
      skip: saltar,
      take: porPagina,
    });

    return {
      datos: filas.map((f) => aContrato(f, ahora)),
      meta: meta(total),
    };
  }

  async detalle(id: string): Promise<Evento> {
    const evento = await this.buscar(id);

    if (!evento) {
      throw new ErrorApi('EVENTO_NO_ENCONTRADO');
    }

    return aContrato(evento, this.reloj.ahora());
  }

  /** Crea un evento desde el panel de administración. */
  async crear(datos: CrearEventoDto): Promise<Evento> {
    const lugarId = datos.lugarId ?? null;
    const direccionLibre = datos.direccionLibre ?? null;
    const coordenadas = datos.coordenadas ?? null;

    await this.validarUbicacion(lugarId, direccionLibre, coordenadas);

    const inicio = this.leerFecha(datos.inicio, 'La fecha de inicio');
    const fin =
      datos.fin == null
        ? null
        : this.leerFecha(datos.fin, 'La fecha de finalización');

    this.validarFechas(inicio, fin);

    const imagenClave =
      datos.imagenUrl == null
        ? null
        : await this.archivos.claveSubida(datos.imagenUrl, 'imagen');

    const evento = this.repo.create({
      id: nuevoId('evt'),
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      lugarId,
      direccionLibre,
      latitud: coordenadas?.latitud ?? null,
      longitud: coordenadas?.longitud ?? null,
      inicio,
      fin,
      finEfectivo: finEfectivo(inicio, fin),
      imagenClave,
      precio: datos.precio ?? null,
      estado: datos.estado ?? 'programado',
    });

    await this.repo.insert(evento);

    return aContrato(evento, this.reloj.ahora());
  }

  /** Actualiza los datos de un evento existente, incluso si ya finalizó. */
  async actualizar(id: string, datos: ActualizarEventoDto): Promise<Evento> {
    const evento = await this.buscar(id);

    if (!evento) {
      throw new ErrorApi('EVENTO_NO_ENCONTRADO');
    }

    let lugarId =
      datos.lugarId !== undefined ? datos.lugarId : evento.lugarId;

    let direccionLibre =
      datos.direccionLibre !== undefined
        ? datos.direccionLibre
        : evento.direccionLibre;

    let coordenadas: Coordenadas | null =
      datos.coordenadas !== undefined
        ? datos.coordenadas
        : evento.latitud === null || evento.longitud === null
          ? null
          : {
            latitud: evento.latitud,
            longitud: evento.longitud,
          };

    // Al elegir un lugar del catálogo, se limpia la dirección libre.
    if (datos.lugarId !== undefined && datos.lugarId !== null) {
      direccionLibre = null;
      coordenadas = null;
    }

    // Al elegir una dirección libre, se limpia el lugar del catálogo.
    if (
      datos.direccionLibre !== undefined &&
      datos.direccionLibre !== null
    ) {
      lugarId = null;
    }

    await this.validarUbicacion(lugarId, direccionLibre, coordenadas);

    const inicio =
      datos.inicio === undefined
        ? evento.inicio
        : this.leerFecha(datos.inicio, 'La fecha de inicio');

    const fin =
      datos.fin === undefined
        ? evento.fin
        : datos.fin === null
          ? null
          : this.leerFecha(datos.fin, 'La fecha de finalización');

    this.validarFechas(inicio, fin);

    const imagenClave =
      datos.imagenUrl === undefined
        ? evento.imagenClave
        : datos.imagenUrl === null
          ? null
          : await this.archivos.claveSubida(datos.imagenUrl, 'imagen');

    const antes = evento.estado;
    const estado = datos.estado ?? evento.estado;

    const cambiaronFechas =
      inicio.getTime() !== evento.inicio.getTime() ||
      (fin?.getTime() ?? null) !== (evento.fin?.getTime() ?? null);

    await this.repo.update(
      { id },
      {
        titulo: datos.titulo ?? evento.titulo,
        descripcion: datos.descripcion ?? evento.descripcion,
        lugarId,
        direccionLibre,
        latitud: coordenadas?.latitud ?? null,
        longitud: coordenadas?.longitud ?? null,
        inicio,
        fin,
        finEfectivo: finEfectivo(inicio, fin),
        imagenClave,
        precio: datos.precio === undefined ? evento.precio : datos.precio,
        estado,
      },
    );

    Object.assign(evento, {
      titulo: datos.titulo ?? evento.titulo,
      descripcion: datos.descripcion ?? evento.descripcion,
      lugarId,
      direccionLibre,
      latitud: coordenadas?.latitud ?? null,
      longitud: coordenadas?.longitud ?? null,
      inicio,
      fin,
      finEfectivo: finEfectivo(inicio, fin),
      imagenClave,
      precio: datos.precio === undefined ? evento.precio : datos.precio,
      estado,
    });

    if (antes !== estado) {
      await this.guardados.avisarCambioDeEstado(evento, antes);
    }

    if (cambiaronFechas) {
      await this.guardados.avisarReprogramacion(evento);
    }

    return aContrato(evento, this.reloj.ahora());
  }

  /** Reprograma un evento y lo vuelve a establecer como programado. */
  async reprogramar(
    id: string,
    datos: ReprogramarEventoDto,
  ): Promise<Evento> {
    const evento = await this.buscar(id);

    if (!evento) {
      throw new ErrorApi('EVENTO_NO_ENCONTRADO');
    }

    const inicio = this.leerFecha(datos.inicio, 'La nueva fecha de inicio');

    const fin =
      datos.fin === undefined
        ? evento.fin
        : datos.fin === null
          ? null
          : this.leerFecha(datos.fin, 'La fecha de finalización');

    this.validarFechas(inicio, fin);

    const antes = evento.estado;
    const cambiaronFechas =
      inicio.getTime() !== evento.inicio.getTime() ||
      (fin?.getTime() ?? null) !== (evento.fin?.getTime() ?? null);

    await this.repo.update(
      { id },
      {
        inicio,
        fin,
        finEfectivo: finEfectivo(inicio, fin),
        estado: 'programado',
      },
    );

    evento.inicio = inicio;
    evento.fin = fin;
    evento.finEfectivo = finEfectivo(inicio, fin);
    evento.estado = 'programado';

    if (antes !== 'programado') {
      await this.guardados.avisarCambioDeEstado(evento, antes);
    }

    if (cambiaronFechas) {
      await this.guardados.avisarReprogramacion(evento);
    }

    return aContrato(evento, this.reloj.ahora());
  }

  /** R10: cambiar a un estado igual al actual no hace nada. */
  async cambiarEstado(
    id: string,
    { estado }: CambiarEstadoDto,
  ): Promise<Evento> {
    const evento = await this.buscar(id);

    if (!evento) {
      throw new ErrorApi('EVENTO_NO_ENCONTRADO');
    }

    if (evento.estado !== estado) {
      const antes = evento.estado;
      await this.repo.update({ id }, { estado });
      evento.estado = estado;

      await this.guardados.avisarCambioDeEstado(evento, antes);
    }

    return aContrato(evento, this.reloj.ahora());
  }

  /** Alta desde la semilla (no hay endpoint de carga). Mantiene el fin efectivo (D3). */
  async cargar(datos: EventoACargar): Promise<string> {
    const id = datos.id ?? nuevoId('evt');

    if (!esIdConPrefijo(id, 'evt')) {
      throw new Error(`Id de evento inválido: ${id}`);
    }

    if ((datos.lugarId === null) === (datos.direccionLibre === null)) {
      throw new Error(
        'Un evento tiene lugarId o direccionLibre, uno solo de los dos (R7).',
      );
    }

    if (datos.lugarId !== null && datos.coordenadas !== null) {
      throw new Error(
        'Las coordenadas de un evento sólo van cuando no tiene lugarId (R7).',
      );
    }

    if (
      datos.lugarId !== null &&
      !(await this.lugares.existe(datos.lugarId))
    ) {
      throw new Error(`El lugar ${datos.lugarId} no existe`);
    }

    if (datos.fin && datos.fin.getTime() < datos.inicio.getTime()) {
      throw new Error('El evento termina antes de empezar.');
    }

    await this.repo.insert({
      id,
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      lugarId: datos.lugarId,
      direccionLibre: datos.direccionLibre,
      latitud: datos.coordenadas?.latitud ?? null,
      longitud: datos.coordenadas?.longitud ?? null,
      inicio: datos.inicio,
      fin: datos.fin,
      finEfectivo: finEfectivo(datos.inicio, datos.fin),
      imagenClave: datos.imagenClave,
      precio: datos.precio,
      estado: datos.estado,
    });

    return id;
  }

  private async validarUbicacion(
    lugarId: string | null,
    direccionLibre: string | null,
    coordenadas: Coordenadas | null,
  ): Promise<void> {
    if (
      (lugarId === null) === (direccionLibre === null) ||
      (direccionLibre !== null && direccionLibre.trim().length === 0)
    ) {
      throw new ErrorApi(
        'VALIDACION_FALLIDA',
        'El evento debe tener un lugar del catálogo o una dirección libre, pero no ambos.',
      );
    }

    if (lugarId !== null && coordenadas !== null) {
      throw new ErrorApi(
        'VALIDACION_FALLIDA',
        'Las coordenadas sólo se pueden indicar cuando se utiliza una dirección libre.',
      );
    }

    if (lugarId !== null && !(await this.lugares.existe(lugarId))) {
      throw new ErrorApi('LUGAR_NO_ENCONTRADO');
    }
  }

  private leerFecha(texto: string, nombre: string): Date {
    const fecha = leerInstante(texto);

    if (!fecha) {
      throw new ErrorApi(
        'VALIDACION_FALLIDA',
        `${nombre} debe incluir una fecha, una hora y una zona horaria válidas.`,
      );
    }

    return fecha;
  }

  private validarFechas(inicio: Date, fin: Date | null): void {
    if (fin !== null && fin.getTime() < inicio.getTime()) {
      throw new ErrorApi(
        'VALIDACION_FALLIDA',
        'El evento no puede terminar antes de comenzar.',
      );
    }
  }

  private rango(
    filtros: ListarEventosDto,
    ahora: Date,
  ): { desde: Date; hasta: Date | null } {
    for (const dia of [filtros.fecha, filtros.desde, filtros.hasta]) {
      if (dia !== undefined && !esDiaValido(dia)) {
        throw new ErrorApi('VALIDACION_FALLIDA', MENSAJE_DIA);
      }
    }

    if (filtros.fecha !== undefined) {
      if (filtros.desde !== undefined || filtros.hasta !== undefined) {
        throw new ErrorApi(
          'VALIDACION_FALLIDA',
          'Usá «fecha» o «desde» y «hasta», pero no las dos cosas.',
        );
      }

      return {
        desde: comienzoDelDia(filtros.fecha),
        hasta: comienzoDelDiaSiguiente(filtros.fecha),
      };
    }

    const desdeDia = filtros.desde ?? diaLocal(ahora);

    if (filtros.hasta !== undefined && filtros.hasta < desdeDia) {
      throw new ErrorApi(
        'VALIDACION_FALLIDA',
        'El día «hasta» no puede ser anterior al día «desde».',
      );
    }

    return {
      desde: comienzoDelDia(desdeDia),
      hasta:
        filtros.hasta === undefined
          ? null
          : comienzoDelDiaSiguiente(filtros.hasta),
    };
  }

  /** Por id exacto: en MySQL y MariaDB `evt-ABC` encontraría `evt-abc`. */
  private async buscar(id: string): Promise<EventoEntidad | null> {
    if (!esIdConPrefijo(id, 'evt')) {
      return null;
    }

    const evento = await this.repo.findOneBy({ id });

    return evento?.id === id ? evento : null;
  }
}
