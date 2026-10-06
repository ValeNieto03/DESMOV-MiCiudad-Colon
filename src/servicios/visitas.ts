import * as SQLite from 'expo-sqlite';

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
  `);
}

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

    console.log('✅ VISITA GUARDADA EN SQLITE:', visita);
}

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