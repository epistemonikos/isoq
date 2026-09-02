'use strict'
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
  ENABLE_CONCURRENCY_CONTROL: '"on"',
  ENABLE_REGISTRATION: '"true"',
  // Toda la superficie GDPR: obligación de aceptar los términos, página de
  // Privacidad y Términos, preferencias de consentimiento y gestión de datos
  // del perfil. En 'on' para preservar el comportamiento actual de producción.
  //
  // NO apagarlo mientras ENABLE_REGISTRATION esté en 'true': el backend rechaza
  // POST /create_user sin terms_accepted (auth_server/controllers/router.py),
  // así que el alta de cuentas devolvería 400 hasta que el backend lea su
  // propio ENABLE_GDPR. Medido contra la rama isoqf_310 el 2026-08-17.
  ENABLE_GDPR: '"true"',
  // El DSN sale del ENTORNO del build, no de una edición del archivo.
  //
  // Mientras se completaba editando acá, cada host quedaba con este archivo —trackeado—
  // modificado, y eso rompe el `git pull` en cuanto un commit entrante toca este mismo
  // archivo. Pasó: `2d6185e9` (2026-08-20) lo modificó, el pull del servidor de pruebas
  // abortó, y el checkout quedó clavado once días mientras los builds seguían corriendo sobre
  // código viejo. Nadie lo notó porque `pull` y `build` son comandos separados y el error del
  // primero pasó de largo.
  //
  // La ironía de cuál archivo es: el que bloquea el pull es el que lleva los feature flags,
  // así que el cambio con MÁS probabilidad de no llegar al servidor es un cambio de flag —
  // y `2d6185e9` era, literalmente, encender uno.
  //
  // Por eso los flags se quedan y sólo sale el secreto: sacarlos al entorno obligaría a
  // replicarlos a mano en cada host, que es el mismo problema con otra ropa.
  //
  // Vacío y no un marcador de posición: `main.js` hace `if (process.env.SENTRY_DSN)`, y
  // `"YOUR_SENTRY_DSN_HERE"` es truthy — o sea que un host sin configurar arrancaba Sentry
  // con un DSN inválido en vez de saltearlo.
  //
  // `JSON.stringify` y no comillas concatenadas: `DefinePlugin` sustituye este valor como
  // literal fuente, así que una comilla dentro del DSN rompería el bundle.
  SENTRY_DSN: JSON.stringify(process.env.SENTRY_DSN || '')
}
