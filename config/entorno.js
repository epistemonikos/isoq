'use strict'

// De dónde salen los valores que cambian según el servidor: feature flags y Sentry.
//
// Precedencia, de mayor a menor:
//   1. la variable de la shell        `ENABLE_GDPR=false npm run build` — una prueba puntual
//   2. el `.env` de la raíz           lo propio de ese servidor; NO se versiona (plantilla: `.env.example`)
//   3. el default commiteado          el segundo argumento de `desdeEntorno`
//
// Por qué el default vive en el código y no sólo en el `.env`: un flag nuevo tiene que llegar a
// todos los servidores con el `git pull`, aunque nadie toque su `.env`. Si el valor existiera
// sólo en un archivo por servidor, el flag faltaría en silencio, y para GDPR ausente significa
// apagado (`src/constants/gdpr.js`).
//
// Y por qué el `.env` y no editar `config/*.env.js`: esos archivos están trackeados. Editarlos
// en un servidor deja el checkout sucio, el sello del build sale `-dirty` y el `git pull` aborta
// en cuanto un commit toca el mismo archivo — así quedó clavado once días el servidor de pruebas
// (`2d6185e9`, 2026-08-20).

const path = require('path')

const ARCHIVO_ENV = path.resolve(__dirname, '../.env')

// `dotenv` no pisa variables que ya existen: eso es lo que deja a la shell por encima del
// archivo. Un `.env` ausente no es un error — devuelve `{ error }` sin lanzar — porque un
// servidor sin `.env` tiene que compilar con los defaults, igual que antes.
function cargarArchivoEnv (archivo = ARCHIVO_ENV) {
  require('dotenv').config({ path: archivo })
}

// `||` y no `??`: un valor vacío (`ENABLE_GDPR=`) casi siempre es una línea a medio escribir,
// y no debería apagar un flag en silencio. Cae al default.
//
// `JSON.stringify` y no comillas concatenadas: `DefinePlugin` sustituye este valor como
// literal fuente, así que una comilla dentro del valor rompería el bundle.
function desdeEntorno (nombre, porDefecto) {
  return JSON.stringify(process.env[nombre] || porDefecto)
}

module.exports = { ARCHIVO_ENV, cargarArchivoEnv, desdeEntorno }
