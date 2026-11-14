import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, type FindOptionsWhere, In, Like, MoreThan, Repository } from 'typeorm';
import type { Meta } from '../../../contract/api.js';
import type { Lugar } from '../../../contract/types.js';
import { ErrorApi } from '../../common/errors/error-api.js';
import { AlmacenArchivos } from '../../common/files/file-storage.js';
import { esClaveValida } from '../../common/files/keys.js';
import { duracionMp3 } from '../../seeds/media.js';
import { leerInstante } from '../../common/dates/dates.js';
import { cajaAlrededor, cruzaElAntimeridianoOUnPolo } from '../../common/geo/geo.js';
import { esIdConPrefijo, nuevoId } from '../../common/ids/ids.js';
import { Reloj } from '../../common/clock/clock.js';
import { calcularPaginacion } from '../../common/response/pagination.js';
import { normalizarBusqueda } from '../../common/text/text.js';
import { CategoriasServicio } from '../categories/categories.service.js';
import type { ListarLugaresDto } from './dto/list-places.dto.js';
import type { ActualizarAudioguiaDto } from './dto/update-audioguia.dto.js';
import type { ActualizarImagenDto } from './dto/actualizar-imagen.dto.js';
import type { LugarACargar } from './place-to-load.js';
import { LugarEntidad } from './place.entity.js';
import { AudioguiaEntidad } from './audioguia.entity.js';
import { aContrato } from './places.mapper.js';
import { inicioDeTemporada } from './rules/hours.js';
import {
  coincideBusqueda,
  ordenarLugares,
  patronLike,
  problemaDeFiltros,
  terminoDeBusqueda,
} from './rules/listing.js';
import { codigoQrDe, leerCodigoQr } from './rules/qr.js';

@Injectable()
export class LugaresServicio implements OnModuleInit {
  constructor(
    @InjectRepository(LugarEntidad) private readonly repo: Repository<LugarEntidad>,
    @InjectRepository(AudioguiaEntidad) private readonly repoAudioguias: Repository<AudioguiaEntidad>,
    private readonly categorias: CategoriasServicio,
    private readonly reloj: Reloj,
    private readonly almacen: AlmacenArchivos,
  ) { }

  async onModuleInit(): Promise<void> {
    const lugares = await this.repo.find();

    for (const lugar of lugares) {
      const clave = lugar.audioguiaClave;
      const duracionSegundos = lugar.audioguiaDuracionSegundos;
      const idioma = lugar.audioguiaIdioma;

      if (!clave || duracionSegundos === null || idioma === null) {
        continue;
      }

      const existente = await this.repoAudioguias.findOneBy({
        lugarId: lugar.id,
        clave,
      });

      if (existente) continue;

      const audioguiaActiva = await this.repoAudioguias.findOneBy({
        lugarId: lugar.id,
        activa: true,
      });

      await this.repoAudioguias.insert({
        id: nuevoId('aud'),
        lugarId: lugar.id,
        clave,
        idioma,
        duracionSegundos,
        transcripcion: null,
        activa: audioguiaActiva === null,
        creadoEn: lugar.actualizadoEn,
      });
    }
  }
  async listar(filtros: ListarLugaresDto): Promise<{ datos: Lugar[]; meta: Meta }> {
    const problema = problemaDeFiltros(filtros);
    if (problema) throw new ErrorApi('VALIDACION_FALLIDA', problema);
    const ahora = this.reloj.ahora();
    const { pagina, porPagina, saltar } = calcularPaginacion(filtros);
    // Una categorÃ­a con un id que no puede existir da la lista vacÃ­a, sin ir a la base (que
    // ademÃ¡s, en PostgreSQL, rechaza un byte nulo en un texto).
    if (filtros.categoriaId !== undefined && !esIdConPrefijo(filtros.categoriaId, 'cat')) {
      return { datos: [], meta: { total: 0, pagina, porPagina } };
    }
    const punto =
      filtros.latitud !== undefined && filtros.longitud !== undefined
        ? { latitud: filtros.latitud, longitud: filtros.longitud }
        : undefined;
    const termino = terminoDeBusqueda(filtros.q ?? '');

    // 1. La base filtra lo grueso y trae sÃ³lo lo necesario para ordenar.
    const base: FindOptionsWhere<LugarEntidad> = {};
    if (filtros.categoriaId !== undefined) base.categoriaId = filtros.categoriaId;
    if (filtros.accesible) base.accesible = true;
    if (termino) base.nombreBusqueda = Like(patronLike(termino));
    if (punto && filtros.radioMetros !== undefined) {
      const caja = cajaAlrededor(punto, filtros.radioMetros);
      base.latitud = Between(caja.latitudMin, caja.latitudMax);
      if (!cruzaElAntimeridianoOUnPolo(caja)) base.longitud = Between(caja.longitudMin, caja.longitudMax);
    }
    const where = this.condicionesDeVigencia(base, filtros.actualizadoDesde, ahora);
    const filas = await this.repo.find({
      where,
      select: { id: true, nombreBusqueda: true, categoriaId: true, latitud: true, longitud: true },
    });

    // 2. Lo exacto, el radio y el orden, en TypeScript: igual en los cuatro motores (MySQL y
    //    MariaDB comparan texto sin distinguir mayÃºsculas; cada motor ordena texto a su manera).
    const exactas = filas.filter(
      (f) =>
        (filtros.categoriaId === undefined || f.categoriaId === filtros.categoriaId) &&
        coincideBusqueda(f.nombreBusqueda, termino),
    );
    const ordenadas = ordenarLugares(exactas, {
      orden: filtros.orden ?? 'nombre',
      punto,
      radioMetros: filtros.radioMetros,
    });

    // 3. La pÃ¡gina, completa.
    const idsPagina = ordenadas.slice(saltar, saltar + porPagina).map((f) => f.id);
    const entidades = idsPagina.length > 0 ? await this.repo.findBy({ id: In(idsPagina) }) : [];
    const porId = new Map(entidades.map((e) => [e.id, e]));

    const audioguiasActivas =
      idsPagina.length > 0
        ? await this.repoAudioguias.findBy({
          lugarId: In(idsPagina),
          activa: true,
        })
        : [];

    const audioPorLugar = new Map(
      audioguiasActivas.map((audio) => [audio.lugarId, audio]),
    );

    const datos = idsPagina.flatMap((id) => {
      const entidad = porId.get(id);
      return entidad
        ? [aContrato(entidad, ahora, audioPorLugar.get(id) ?? null)]
        : [];
    });

    return { datos, meta: { total: ordenadas.length, pagina, porPagina } };
  }

  /** Agrega una imagen a un lugar sin eliminar las imágenes existentes. */
  async actualizarImagen(
    id: string,
    dto: ActualizarImagenDto,
  ): Promise<Lugar> {
    const lugar = await this.buscar(id);

    if (!lugar) {
      throw new ErrorApi('LUGAR_NO_ENCONTRADO');
    }

    if (
      !esClaveValida(dto.clave) ||
      !dto.clave.startsWith('imagenes/')
    ) {
      throw new ErrorApi(
        'VALIDACION_FALLIDA',
        'La clave debe identificar una imagen válida.',
      );
    }

    if (!(await this.almacen.existe(dto.clave))) {
      throw new ErrorApi('ARCHIVO_NO_ENCONTRADO');
    }

    const imagenesActuales = lugar.imagenes ?? [];

    if (!imagenesActuales.includes(dto.clave)) {
      lugar.imagenes = [...imagenesActuales, dto.clave];
    }

    lugar.actualizadoEn = this.reloj.ahora();

    await this.repo.save(lugar);

    return this.detalle(id);
  }

  /** Asocia una audioguía a un lugar que ya existe. */

  /** Agrega una audioguía nueva y la deja inactiva hasta su activación. */
  async actualizarAudioguia(
    id: string,
    dto: ActualizarAudioguiaDto,
  ): Promise<Lugar> {
    const lugar = await this.buscar(id);
    if (!lugar) throw new ErrorApi('LUGAR_NO_ENCONTRADO');

    if (!esClaveValida(dto.clave) || !dto.clave.startsWith('audios/')) {
      throw new ErrorApi(
        'VALIDACION_FALLIDA',
        'La clave debe identificar un audio válido.',
      );
    }

    if (!(await this.almacen.existe(dto.clave))) {
      throw new ErrorApi('ARCHIVO_NO_ENCONTRADO');
    }

    const lectura = await this.almacen.leer(dto.clave);
    const partes: Buffer[] = [];

    for await (const parte of lectura.flujo) {
      partes.push(Buffer.isBuffer(parte) ? parte : Buffer.from(parte));
    }

    let duracionSegundos: number;

    try {
      duracionSegundos = Math.round(duracionMp3(Buffer.concat(partes)));
    } catch {
      throw new ErrorApi(
        'VALIDACION_FALLIDA',
        'El archivo no contiene un audio MP3 válido.',
      );
    }

    if (!Number.isFinite(duracionSegundos) || duracionSegundos <= 0) {
      throw new ErrorApi(
        'VALIDACION_FALLIDA',
        'No se pudo calcular la duración del audio.',
      );
    }

    const ahora = this.reloj.ahora();

    await this.repo.manager.transaction(async (manager) => {
      const repoLugares = manager.getRepository(LugarEntidad);
      const repoAudios = manager.getRepository(AudioguiaEntidad);

      const lugarActual = await repoLugares.findOneBy({ id });

      if (!lugarActual) {
        throw new ErrorApi('LUGAR_NO_ENCONTRADO');
      }

      const nueva = repoAudios.create({
        id: nuevoId('aud'),
        lugarId: id,
        clave: dto.clave,
        idioma: dto.idioma,
        duracionSegundos,
        transcripcion: null,
        activa: false,
        creadoEn: ahora,
      });

      await repoAudios.save(nueva);
    });

    const actualizado = await this.buscar(id);

    if (!actualizado) {
      throw new ErrorApi('LUGAR_NO_ENCONTRADO');
    }

    const audioguiaActiva = await this.repoAudioguias.findOneBy({
      lugarId: id,
      activa: true,
    });

    return aContrato(actualizado, ahora, audioguiaActiva);
  }


  /** Devuelve la audioguía activa con su transcripción para la app móvil. */
  async obtenerAudioguiaActiva(id: string) {
    const lugar = await this.buscar(id);
    if (!lugar) throw new ErrorApi('LUGAR_NO_ENCONTRADO');

    const audio = await this.repoAudioguias.findOneBy({
      lugarId: id,
      activa: true,
    });

    if (!audio) return null;

    const contrato = aContrato(lugar, this.reloj.ahora(), audio);

    if (!contrato.audioguia) return null;

    return {
      ...contrato.audioguia,
      transcripcion: audio.transcripcion,
    };
  }

  /** Devuelve todas las audioguías de un lugar, activas e inactivas. */
  async listarAudioguias(id: string): Promise<AudioguiaEntidad[]> {
    const lugar = await this.buscar(id);
    if (!lugar) throw new ErrorApi('LUGAR_NO_ENCONTRADO');

    return this.repoAudioguias.find({
      where: { lugarId: id },
      order: { creadoEn: 'DESC' },
    });
  }

  /** Activa una audioguía existente sin volver a subir el archivo. */
  async activarAudioguia(
    id: string,
    audioguiaId: string,
  ): Promise<Lugar> {
    const lugar = await this.buscar(id);
    if (!lugar) throw new ErrorApi('LUGAR_NO_ENCONTRADO');

    const ahora = this.reloj.ahora();

    const audioguiaActiva = await this.repo.manager.transaction(
      async (manager) => {
        const repoLugares = manager.getRepository(LugarEntidad);
        const repoAudios = manager.getRepository(AudioguiaEntidad);

        const lugarActual = await repoLugares.findOneBy({ id });
        if (!lugarActual) throw new ErrorApi('LUGAR_NO_ENCONTRADO');

        const audio = await repoAudios.findOneBy({
          id: audioguiaId,
          lugarId: id,
        });

        if (!audio) {
          throw new ErrorApi(
            'VALIDACION_FALLIDA',
            'La audioguía indicada no pertenece a este lugar.',
          );
        }

        await repoAudios.update(
          { lugarId: id, activa: true },
          { activa: false },
        );

        audio.activa = true;
        await repoAudios.save(audio);

        lugarActual.audioguiaClave = audio.clave;
        lugarActual.audioguiaDuracionSegundos = audio.duracionSegundos;
        lugarActual.audioguiaIdioma = audio.idioma;
        lugarActual.actualizadoEn = ahora;

        await repoLugares.save(lugarActual);

        return audio;
      },
    );

    const actualizado = await this.buscar(id);
    if (!actualizado) throw new ErrorApi('LUGAR_NO_ENCONTRADO');

    return aContrato(actualizado, ahora, audioguiaActiva);
  }

  /** Actualiza la transcripción de una audioguía específica. */
  async actualizarTranscripcion(
    lugarId: string,
    audioguiaId: string,
    transcripcion: string,
  ): Promise<AudioguiaEntidad> {
    const lugar = await this.buscar(lugarId);
    if (!lugar) throw new ErrorApi('LUGAR_NO_ENCONTRADO');

    const audioguia = await this.repoAudioguias.findOneBy({
      id: audioguiaId,
      lugarId,
    });

    if (!audioguia) {
      throw new ErrorApi(
        'VALIDACION_FALLIDA',
        'La audioguía indicada no pertenece a este lugar.',
      );
    }

    audioguia.transcripcion = transcripcion;
    return this.repoAudioguias.save(audioguia);
  }
  /** Detalle: tambiÃ©n los dados de baja (D6). */
  /** Detalle: también los dados de baja (D6). */
  async detalle(id: string): Promise<Lugar> {
    const lugar = await this.buscar(id);
    if (!lugar) throw new ErrorApi('LUGAR_NO_ENCONTRADO');

    const audioguiaActiva = await this.repoAudioguias.findOneBy({
      lugarId: id,
      activa: true,
    });

    return aContrato(lugar, this.reloj.ahora(), audioguiaActiva);
  }

  async existe(id: string): Promise<boolean> {
    return (await this.buscar(id)) !== null;
  }

  /** R6: cualquier cosa que no sea el QR de un lugar nuestro es `QR_NO_RECONOCIDO`. */
  async porQr(codigo: string): Promise<Lugar> {
    const id = leerCodigoQr(codigo);
    const lugar = id ? await this.buscar(id) : null;

    if (!id || !lugar || lugar.codigoQr !== codigoQrDe(id)) {
      throw new ErrorApi('QR_NO_RECONOCIDO');
    }

    const audioguiaActiva = await this.repoAudioguias.findOneBy({
      lugarId: id,
      activa: true,
    });

    return aContrato(lugar, this.reloj.ahora(), audioguiaActiva);
  }

  /**
   * Alta desde la semilla (no hay endpoint: los lugares los carga la cÃ¡tedra, especificaciÃ³n
   * Â§9). Mantiene las columnas internas: nombre normalizado, temporadas y cÃ³digo QR.
   */
  async cargar(datos: LugarACargar): Promise<string> {
    const id = datos.id ?? nuevoId('lug');
    if (!esIdConPrefijo(id, 'lug')) throw new Error(`Id de lugar inválido: ${id}`);
    if (!(await this.categorias.existe(datos.categoriaId))) {
      throw new Error(`La categoría ${datos.categoriaId} no existe`);
    }

    const actualizadoEn = datos.actualizadoEn ?? this.reloj.ahora();

    await this.repo.insert({
      id,
      nombre: datos.nombre,
      nombreBusqueda: normalizarBusqueda(datos.nombre),
      categoriaId: datos.categoriaId,
      descripcionCorta: datos.descripcionCorta,
      descripcion: datos.descripcion,
      latitud: datos.coordenadas.latitud,
      longitud: datos.coordenadas.longitud,
      direccion: datos.direccion,
      imagenes: [...datos.imagenes],
      horarios: datos.horarios.map((h) => ({ ...h })),
      tieneTemporadas: datos.horarios.some((h) => h.temporada !== 'todo-el-anio'),
      telefono: datos.telefono,
      sitioWeb: datos.sitioWeb,
      precioEntrada: datos.precioEntrada,
      audioguiaClave: datos.audioguia?.clave ?? null,
      audioguiaDuracionSegundos: datos.audioguia?.duracionSegundos ?? null,
      audioguiaIdioma: datos.audioguia?.idioma ?? null,
      codigoQr: datos.conQr ? codigoQrDe(id) : null,
      accesible: datos.accesible,
      activo: datos.activo,
      actualizadoEn,
    });

    if (datos.audioguia) {
      await this.repoAudioguias.insert({
        id: nuevoId('aud'),
        lugarId: id,
        clave: datos.audioguia.clave,
        idioma: datos.audioguia.idioma,
        duracionSegundos: datos.audioguia.duracionSegundos,
        transcripcion: null,
        activa: true,
        creadoEn: actualizadoEn,
      });
    }

    return id;
  }

  /**
   * Sin `actualizadoDesde`, sÃ³lo los activos. Con Ã©l, los cambiados despuÃ©s, activos o no (D6),
   * mÃ¡s los que tienen horario de temporada si la temporada empezÃ³ despuÃ©s (D1): sus horarios
   * vigentes cambiaron aunque nadie los haya editado.
   */
  private condicionesDeVigencia(
    base: FindOptionsWhere<LugarEntidad>,
    actualizadoDesde: string | undefined,
    ahora: Date,
  ): FindOptionsWhere<LugarEntidad>[] {
    const desde = actualizadoDesde === undefined ? null : leerInstante(actualizadoDesde);
    if (!desde) return [{ ...base, activo: true }];
    const condiciones: FindOptionsWhere<LugarEntidad>[] = [{ ...base, actualizadoEn: MoreThan(desde) }];
    if (inicioDeTemporada(ahora).getTime() > desde.getTime()) {
      condiciones.push({ ...base, tieneTemporadas: true });
    }
    return condiciones;
  }

  /** Por id exacto: en MySQL y MariaDB `lug-ABC` encontrarÃ­a `lug-abc`. */
  private async buscar(id: string): Promise<LugarEntidad | null> {
    if (!esIdConPrefijo(id, 'lug')) return null;
    const lugar = await this.repo.findOneBy({ id });
    return lugar?.id === id ? lugar : null;
  }
}





