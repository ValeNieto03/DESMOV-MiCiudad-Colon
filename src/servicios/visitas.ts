
import * as SQLite from 'expo-sqlite';
import type { Place } from '@/data/lugares';

export type OrigenVisita = 'qr' | 'gps' | 'manual';

export interface Visita {
  id: string;
  usuarioId: string;
  lugarId: string;
  fechaHora: string;
  origen: OrigenVisita;
  fotoUri: string | null;
  nota: string | null;
  sincronizada: boolean;
}

const db = SQLite.openDatabaseSync('mi-ciudad.db');

// --------------------------------------------------
// INICIALIZAR BASE DE DATOS
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

  console.log('Base de datos inicializada correctamente');
}

// --------------------------------------------------
// GUARDAR VISITA
// --------------------------------------------------

export function guardarVisita(visita: Visita) {
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
        sincronizada
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    visita.id,
    visita.usuarioId,
    visita.lugarId,
    visita.fechaHora,
    visita.origen,
    visita.fotoUri,
    visita.nota,
    visita.sincronizada ? 1 : 0
  );

  console.log('VISITA GUARDADA EN SQLITE:', visita);
}

// Actualiza los recuerdos sin modificar los datos del registro de la visita.
export function actualizarRecuerdosVisita(
  id: string,
  nota: string | null,
  fotoUri: string | null
) {
  db.runSync(
    `
      UPDATE visitas
      SET nota = ?, fotoUri = ?, sincronizada = 0
      WHERE id = ?;
    `,
    nota,
    fotoUri,
    id
  );
}

export function actualizarFotoVisita(id: string, fotoUri: string) {
  db.runSync(
    'UPDATE visitas SET fotoUri = ? WHERE id = ?;',
    fotoUri,
    id
  );
}

export function marcarVisitaSincronizada(id: string) {
  db.runSync(
    'UPDATE visitas SET sincronizada = 1 WHERE id = ?;',
    id
  );
}

// --------------------------------------------------
// OBTENER VISITAS
// --------------------------------------------------

export function obtenerVisitas(): Visita[] {
  const resultados = db.getAllSync<{
    id: string;
    usuarioId: string;
    lugarId: string;
    fechaHora: string;
    origen: string;
    fotoUri: string | null;
    nota: string | null;
    sincronizada: number;
  }>(
    `
      SELECT
        id,
        usuarioId,
        lugarId,
        fechaHora,
        origen,
        fotoUri,
        nota,
        sincronizada
      FROM visitas
      ORDER BY fechaHora DESC;
    `
  );

  return resultados.map((visita) => ({
    id: visita.id,
    usuarioId: visita.usuarioId,
    lugarId: visita.lugarId,
    fechaHora: visita.fechaHora,
    origen: visita.origen as OrigenVisita,
    fotoUri: visita.fotoUri,
    nota: visita.nota,
    sincronizada: visita.sincronizada === 1,
  }));
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

  return resultados.map((registro) =>
    JSON.parse(registro.datos) as Place
  );
}
