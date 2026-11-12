const Database = require("better-sqlite3");

const db = new Database("/app/datos/api.sqlite", {
  readonly: true
});

const audios = db.prepare(`
  SELECT id, lugarId, clave, idioma, duracionSegundos, activa
  FROM audioguias
  ORDER BY lugarId, creadoEn DESC
`).all();

console.log("TOTAL DE AUDIOGUÍAS:", audios.length);
console.log(JSON.stringify(audios, null, 2));

db.close();
