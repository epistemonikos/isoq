// Cómo representa este backend un booleano verdadero.
//
// El mismo campo llega como true, 'true', 'True', 1 o '1' según el endpoint
// que lo devuelva. La lista es la que el servidor usa para interpretarlos:
// `raw in [True, 'true', 'True', 1, '1']`
// (isoq_server_py310, auth_server/controllers/core.py:470).
//
// Vive acá y no dentro de terms.js o de un componente porque no es una regla
// de términos ni de preferencias: es el contrato de tipos con el backend, y
// lo consumen los dos. Si el servidor acepta un valor nuevo, se agrega en un
// solo lugar.
const TRUTHY = [true, 'true', 'True', 1, '1']

/**
 * ¿El backend considera verdadero este valor?
 *
 * Boolean(value) no sirve para esto: el string 'false' es truthy y pasaría
 * como verdadero, invirtiendo el significado del campo.
 *
 * @param {*} value - valor tal como vino del backend
 * @returns {boolean}
 */
export function isBackendTrue (value) {
  return TRUTHY.includes(value)
}
