'use strict'
module.exports = {
  NODE_ENV: '"production"',
  BASE_URL: '"/"',
  API_URL: '"/api"',
  PUBLIC_PATH: '"/"',
  ENABLE_CONCURRENCY_CONTROL: '"off"',
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
