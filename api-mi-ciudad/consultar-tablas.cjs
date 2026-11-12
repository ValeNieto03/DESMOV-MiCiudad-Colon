const Database = require("better-sqlite3");

const db = new Database("/app/datos/api.sqlite", {
  readonly: true
});

const tablas = db.prepare(
  "SELECT name FROM sqlite_master WHERE type = ? ORDER BY name"
).all("table");

console.log("TABLAS DE LA BASE DE DATOS:");
for (const tabla of tablas) {
  console.log("- " + tabla.name);
}

db.close();
