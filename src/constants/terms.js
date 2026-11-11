import { isBackendTrue } from './backendBoolean'

// Subir este número obliga a todos los usuarios a re-aceptar los términos
// en su próximo login. Debe coincidir con terms_version del backend, que lo
// valida como integer (isoq_server_py310, libs/validation.py).
export const TERMS_VERSION = 1

/**
 * ¿Hay que pedirle al usuario que acepte los términos?
 *
 * Fail-closed: ante cualquier duda devuelve true. El costo de pedir de más
 * es un clic; el de no pedir nunca es incumplimiento legal silencioso.
 *
 * Única fuente de verdad — la usan el guard de main.js y Login.vue.
 * No reimplementar esta regla en un componente.
 *
 * @param {object|undefined} user - state.user de Vuex, posiblemente incompleto
 * @returns {boolean} true si hay que mostrar el modal de aceptación
 */
export function needsTermsAcceptance (user) {
  // User ausente o terms_accepted no es un verdadero del backend → pedir
  // aceptación. `!user.terms_accepted` no sirve: el string 'false' es truthy.
  if (!user || !isBackendTrue(user.terms_accepted)) {
    return true
  }

  // terms_version ausente o no numérico → pedir aceptación.
  // Comparar directo dejaría pasar a todos: `undefined < 1` es false.
  const v = Number(user.terms_version)
  if (!Number.isFinite(v)) {
    return true
  }

  return v < TERMS_VERSION
}
