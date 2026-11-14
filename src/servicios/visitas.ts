
import * as SQLite from 'expo-sqlite';
import type { Place } from '@/data/lugares';
import { lugares as lugaresIncluidos } from '@/data/lugares';

export type OrigenVisita = 'qr' | 'gps' | 'manual';
export type AccionPendiente = 'crear' | 'actualizar';

export interface Visita {
  id: string;
  usuarioId: string;
  lugarId: string;
  fechaHora: string;
  origen: OrigenVisita;
  fotoUri: string | null;
  nota: string | null;
  sincronizada: boolean;
  accionPendiente?: AccionPendiente | null;
}

interface VisitaSQLite extends Omit<Visita, 'sincronizada'> {
  sincronizada: number;
  accionPendiente: AccionPendiente | null;
}

const db = SQLite.openDatabaseSync('mi-ciudad.db');

// --------------------------------------------------
// INICIALIZAR BASE DE DATOS Y MIGRAR
// --------------------------------------------------

export function inicializarBaseDeDatos() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS visitas (
      id TEXT PRIMARY KEY NOT NULL,
      usuarioId TEXT NOT NULL,
      lugarId TEXT NOT NULL,
      fechaHora TEXT NOT NULL,
      origen TEXT NOT NULL,
      fotoUri TEXT,
      nota TEXT,
      sincronizada INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS lugares (
      id TEXT PRIMARY KEY NOT NULL,
      datos TEXT NOT NULL,
      actualizadoEn TEXT NOT NULL
    );
  `);

  const columnas = db.getAllSync<{ name: string }>(
    'PRAGMA table_info(visitas);'
  );

  const tieneAccionPendiente = columnas.some(
    (columna) => columna.name === 'accionPendiente'
  );

  if (!tieneAccionPendiente) {
    db.execSync(`
      ALTER TABLE visitas
      ADD COLUMN accionPendiente TEXT NOT NULL DEFAULT 'crear';
    `);
  }

  console.log('Base de datos inicializada correctamente');
}

// --------------------------------------------------
// CONVERTIR REGISTRO SQLITE
// --------------------------------------------------

function convertirVisita(registro: VisitaSQLite): Visita {
  return {
    id: registro.id,
    usuarioId: registro.usuarioId,
    lugarId: registro.lugarId,
    fechaHora: registro.fechaHora,
    origen: registro.origen,
    fotoUri: registro.fotoUri,
    nota: registro.nota,
    sincronizada: registro.sincronizada === 1,
    accionPendiente:
      registro.sincronizada === 1
        ? null
        : registro.accionPendiente ?? 'crear',
  };
}

// --------------------------------------------------
// GUARDAR VISITA NUEVA
// --------------------------------------------------

export function guardarVisita(visita: Visita) {
  const accion: AccionPendiente =
    visita.sincronizada ? 'crear' : 'crear';

  db.runSync(
    `
      INSERT INTO visitas (
        id,
        usuarioId,
        lugarId,
        fechaHora,
        origen,
        fotoUri,
        nota,
        sincronizada,
        accionPendiente
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    visita.id,
    visita.usuarioId,
    visita.lugarId,
    visita.fechaHora,
    visita.origen,
    visita.fotoUri,
    visita.nota,
    visita.sincronizada ? 1 : 0,
    visita.sincronizada ? null : accion
  );

  console.log('VISITA GUARDADA EN SQLITE:', visita);
}

// --------------------------------------------------
// BUSCAR VISITA POR USUARIO Y LUGAR
// --------------------------------------------------

export function buscarVisitaPorLugar(
  usuarioId: string,
  lugarId: string
): Visita | null {
  const resultado = db.getFirstSync<VisitaSQLite>(
    `
      SELECT
        id,
        usuarioId,
        lugarId,
        fechaHora,
        origen,
        fotoUri,
        nota,
        sincronizada,
        accionPendiente
      FROM visitas
      WHERE usuarioId = ? AND lugarId = ?
      ORDER BY fechaHora DESC
      LIMIT 1;
    `,
    usuarioId,
    lugarId
  );

  return resultado ? convertirVisita(resultado) : null;
}

// --------------------------------------------------
// ACTUALIZAR VISITA EXISTENTE
// --------------------------------------------------

export function actualizarVisitaLocal(visita: Visita): Visita {
  const existente = db.getFirstSync<{
    sincronizada: number;
    accionPendiente: AccionPendiente | null;
  }>(
    `
      SELECT sincronizada, accionPendiente
      FROM visitas
      WHERE id = ? AND usuarioId = ?;
    `,
    visita.id,
    visita.usuarioId
  );

  if (!existente) {
    throw new Error('VISITA_NO_ENCONTRADA');
  }

  const accionPendiente: AccionPendiente =
    existente.sincronizada === 1
      ? 'actualizar'
      : existente.accionPendiente ?? 'crear';

  db.runSync(
    `
      UPDATE visitas
      SET
        fechaHora = ?,
        origen = ?,
        fotoUri = ?,
        nota = ?,
        sincronizada = 0,
        accionPendiente = ?
      WHERE id = ? AND usuarioId = ?;
    `,
    visita.fechaHora,
    visita.origen,
    visita.fotoUri,
    visita.nota,
    accionPendiente,
    visita.id,
    visita.usuarioId
  );

  const actualizada: Visita = {
    ...visita,
    sincronizada: false,
    accionPendiente,
  };

  console.log('VISITA ACTUALIZADA EN SQLITE:', actualizada);

  return actualizada;
}

// --------------------------------------------------
// OBTENER VISITAS PENDIENTES DE SINCRONIZACION
// --------------------------------------------------

export function obtenerVisitasPendientes(): Visita[] {
  const resultados = db.getAllSync<VisitaSQLite>(
    `
      SELECT
        id,
        usuarioId,
        lugarId,
        fechaHora,
        origen,
        fotoUri,
        nota,
        sincronizada,
        accionPendiente
      FROM visitas
      WHERE sincronizada = 0
      ORDER BY fechaHora ASC;
    `
  );

  return resultados.map(convertirVisita);
}

// --------------------------------------------------
// MARCAR VISITA COMO SINCRONIZADA
// --------------------------------------------------

export function marcarVisitaSincronizada(
  visita: Pick<
    Visita,
    'id' | 'fechaHora' | 'origen' | 'nota' | 'fotoUri' | 'accionPendiente'
  >
): boolean {
  const resultado = db.runSync(
    `
      UPDATE visitas
      SET sincronizada = 1,
          accionPendiente = 'crear'
      WHERE id = ?
        AND fechaHora = ?
        AND origen = ?
        AND nota IS ?
        AND fotoUri IS ?
        AND accionPendiente IS ?;
    `,
    visita.id,
    visita.fechaHora,
    visita.origen,
    visita.nota,
    visita.fotoUri,
    visita.accionPendiente ?? null
  );

  const marcada = resultado.changes > 0;

  if (marcada) {
    console.log('VISITA SINCRONIZADA:', visita.id);
  } else {
    console.log(
      'LA VISITA CAMBIÓ DURANTE LA SINCRONIZACIÓN Y SIGUE PENDIENTE:',
      visita.id
    );
  }

  return marcada;
}

// --------------------------------------------------
// ACTUALIZAR FOTO DE VISITA
// --------------------------------------------------

export function actualizarFotoVisita(
  id: string,
  fotoUri: string,
  fotoUriEsperada: string | null
): boolean {
  const resultado = db.runSync(
    `
      UPDATE visitas
      SET fotoUri = ?
      WHERE id = ?
        AND fotoUri IS ?;
    `,
    fotoUri,
    id,
    fotoUriEsperada
  );

  const actualizada = resultado.changes > 0;

  if (actualizada) {
    console.log('FOTO DE VISITA ACTUALIZADA:', {
      id,
      fotoUri,
    });
  } else {
    console.log(
      'LA FOTO CAMBIÓ DURANTE LA SUBIDA. SE CONSERVA LA FOTO ACTUAL:',
      id
    );
  }

  return actualizada;
}

// --------------------------------------------------
// OBTENER VISITAS
// --------------------------------------------------

export function obtenerVisitas(): Visita[] {
  const resultados = db.getAllSync<VisitaSQLite>(
    `
      SELECT
        id,
        usuarioId,
        lugarId,
        fechaHora,
        origen,
        fotoUri,
        nota,
        sincronizada,
        accionPendiente
      FROM visitas
      ORDER BY fechaHora DESC;
    `
  );

  return resultados.map(convertirVisita);
}

// --------------------------------------------------
// GUARDAR LUGARES
// --------------------------------------------------

export function guardarLugaresLocales(lugares: Place[]) {
  const insertar = db.prepareSync(`
    INSERT OR REPLACE INTO lugares (
      id,
      datos,
      actualizadoEn
    )
    VALUES (?, ?, ?);
  `);

  const fecha = new Date().toISOString();

  try {
    db.withTransactionSync(() => {
      db.runSync('DELETE FROM lugares;');

      for (const lugar of lugares) {
        insertar.executeSync(
          lugar.id,
          JSON.stringify(lugar),
          fecha
        );
      }
    });

    console.log(
      `LUGARES GUARDADOS EN SQLITE: ${lugares.length}`
    );
  } finally {
    insertar.finalizeSync();
  }
}

// --------------------------------------------------
// RECUPERAR LUGARES
// --------------------------------------------------

export function obtenerLugaresLocales(): Place[] {
  const resultados = db.getAllSync<{
    datos: string;
  }>(`
    SELECT datos
    FROM lugares;
  `);

  return resultados.map((registro) => {
    const lugarGuardado = JSON.parse(registro.datos) as Place;

    const lugarIncluido = lugaresIncluidos.find(
      (lugar) => lugar.id === lugarGuardado.id
    );

    if (lugarIncluido) {
      return {
        ...lugarGuardado,
        imagen: lugarIncluido.imagen,
        audio: lugarIncluido.audio,
        transcripcion:
          lugarIncluido.transcripcion ??
          lugarGuardado.transcripcion,
      };
    }

    return lugarGuardado;
  });
}

// --------------------------------------------------
// DIAGNOSTICAR LUGARES LOCALES
// --------------------------------------------------

export function diagnosticarLugaresLocales() {
  const resultados = db.getAllSync<{
    id: string;
    datos: string;
  }>(`
    SELECT id, datos
    FROM lugares
    ORDER BY id;
  `);

  console.log(
    'DIAGNOSTICO COMPLETO SQLITE:',
    resultados.map((registro) => {
      const lugar = JSON.parse(registro.datos) as Place;

      return {
        id: registro.id,
        nombre: lugar.nombre,
      };
    })
  );

  console.log(
    'TOTAL DE REGISTROS SQLITE:',
    resultados.length
  );
}
