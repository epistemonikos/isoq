// Subir este número obliga a todos los usuarios a re-aceptar los términos
// en su próximo login. Debe coincidir con terms_version del backend.
export const TERMS_VERSION = 1

// Guarda anti-bucle: marca que el usuario aceptó en esta pestaña.
// Temporal — se elimina cuando backend confirme que /auth/user devuelve
// terms_version (punto 3 de "Discrepancias con backend" en el plan).
export const TERMS_SESSION_KEY = 'terms_accepted_session'

// Valores que este backend usa para representar un true booleano. El mismo
// campo llega como true, 'true', 'True', 1 o '1' según el endpoint; está
// documentado en initCheckboxes() de viewProfile.vue.
const TRUTHY = [true, 'true', 'True', 1, '1']

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
  // 1. Ya aceptó en esta pestaña (memoria short-term). Va primero para que
  //    nunca haya bucle: sin esta guarda, un backend que no persiste
  //    terms_version desloguea al usuario en cada recarga, porque el guard
  //    de main.js hace logout antes de redirigir a Login.
  if (typeof sessionStorage !== 'undefined') {
    if (sessionStorage.getItem(TERMS_SESSION_KEY) === String(TERMS_VERSION)) {
      return false
    }
  }

  // 2. User ausente o terms_accepted no está en TRUTHY → true.
  //    `!user.terms_accepted` no sirve acá: el string 'false' es truthy.
  if (!user || !TRUTHY.includes(user.terms_accepted)) {
    return true
  }

  // 3. terms_version ausente o no numérico → true.
  //    Comparar directo dejaría pasar a todos: `undefined < 1` es false.
  const v = Number(user.terms_version)
  if (!Number.isFinite(v)) {
    return true
  }

  // 4. Comparar la versión contra TERMS_VERSION
  return v < TERMS_VERSION
}

export function markTermsAcceptedInSession () {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(TERMS_SESSION_KEY, String(TERMS_VERSION))
  }
}
