'use strict'

// Los flags y SENTRY_* se configuran por servidor en el `.env` de la raíz (plantilla:
// `.env.example`), nunca editando este archivo. Ver `config/entorno.js`.
const { cargarArchivoEnv, desdeEntorno } = require('./entorno')

cargarArchivoEnv()

module.exports = {
  NODE_ENV: '"production"',
  BASE_URL: '"/"',
  API_URL: '"/api"',
  PUBLIC_PATH: '"/"',
  // Locking granular de toda la app: cajas de criterios del Paso 2, identidad del
  // finding en el tab iSoQ, estudios y columnas de los Pasos 3/4, y hojas de
  // evaluación del Paso 4. Encendido junto con el bloqueo de la identidad del
  // finding (rama feature/isoq-tab-freshness-and-finding-locks).
  //
  // OJO con lo que este flag NO cubre: los PATCH de documento completo a
  // isoqf_lists/isoqf_findings no pasan por @verify_ref_lock en el backend, así
  // que ahí el lock coordina la UI pero no impide la escritura. Deja de ser
  // advisory cuando exista el endpoint de docs/spec-backend-endpoint-identidad-finding.md.
  //
  // El refresco automático entre usuarios (projectFreshnessMixin) es
  // independiente de este flag y funciona con él apagado.
  ENABLE_CONCURRENCY_CONTROL: desdeEntorno('ENABLE_CONCURRENCY_CONTROL', 'on'),
  ENABLE_REGISTRATION: desdeEntorno('ENABLE_REGISTRATION', 'true'),
  // Toda la superficie GDPR: obligación de aceptar los términos, página de
  // Privacidad y Términos, preferencias de consentimiento y gestión de datos
  // del perfil. En 'on' para preservar el comportamiento actual de producción.
  //
  // NO apagarlo mientras ENABLE_REGISTRATION esté en 'true': el backend rechaza
  // POST /create_user sin terms_accepted (auth_server/controllers/router.py),
  // así que el alta de cuentas devolvería 400 hasta que el backend lea su
  // propio ENABLE_GDPR. Medido contra la rama isoqf_310 el 2026-08-17.
  ENABLE_GDPR: desdeEntorno('ENABLE_GDPR', 'true'),
  // Vacío por defecto y no un marcador de posición: `main.js` hace `if (process.env.SENTRY_DSN)`,
  // y `"YOUR_SENTRY_DSN_HERE"` era truthy — un host sin configurar arrancaba Sentry con un DSN
  // inválido en vez de saltearlo. Antes se completaba editando este archivo; así quedó clavado
  // once días el checkout del servidor de pruebas (`2d6185e9`, 2026-08-20).
  SENTRY_DSN: desdeEntorno('SENTRY_DSN', ''),
  // El mismo fallback que usa `SentryWebpackPlugin` en `build/webpack.prod.conf.js`: si los
  // eventos y los sourcemaps no comparten release, los stack traces llegan minificados.
  //
  // SENTRY_AUTH_TOKEN/ORG/PROJECT NO van acá: son del plugin, se leen en tiempo de build, y
  // todo lo que está en este archivo termina como literal en el JS que baja cualquier visitante.
  SENTRY_RELEASE: desdeEntorno('SENTRY_RELEASE', require('../package.json').version)
}
