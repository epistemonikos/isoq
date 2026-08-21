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
  SENTRY_DSN: '"YOUR_SENTRY_DSN_HERE"'
}
