// Lista cerrada de valores que encienden el flag. Misma tolerancia que
// lockService.isEnabled (src/services/lockService.js) y que el backend
// (auth_server/controllers/lock.py), para que las tres capas lean la
// configuración igual y un 'on' no signifique cosas distintas según el lado.
//
// El boolean true está por webpack: config/*.env pasa por DefinePlugin, y quien
// escriba `ENABLE_GDPR: true` en vez de `'"on"'` inyecta un boolean literal.
// No es testeable vía process.env, que convierte todo a string.
const ENABLED_VALUES = ['true', 'on', true]

/**
 * ¿Aplica GDPR en esta instalación?
 *
 * Fail-open, al revés que needsTermsAcceptance: si el flag no está definido, la
 * funcionalidad queda apagada y hay que encenderla explícitamente. Es el mismo
 * default que usa el backend para sus flags
 * (os.getenv('ENABLE_CONCURRENCY_CONTROL', 'false'), auth_server/config.py).
 *
 * Deliberadamente separada de needsTermsAcceptance (src/constants/terms.js), que
 * responde una pregunta distinta: *este usuario* debe aceptar. Esa sigue siendo
 * una función pura del usuario y sigue siendo fail-closed. Los dos call sites del
 * gate combinan ambas con &&.
 *
 * Se lee process.env en cada llamada, no en una const de módulo: así los tests
 * pueden alternar el flag sin jest.resetModules().
 *
 * @returns {boolean} true si la superficie GDPR debe estar activa
 */
export function isGdprEnabled () {
  return ENABLED_VALUES.includes(process.env.ENABLE_GDPR)
}
