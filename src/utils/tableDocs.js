import Api from '@/utils/Api'

/**
 * Con qué documento hay que escribir la tabla de un proyecto.
 *
 * `isoqf_characteristics` e `isoqf_assessments` guardan UN documento por proyecto, con
 * todos los estudios adentro. El cliente recuerda su id y decide con él entre crear y
 * actualizar — y ahí está la trampa: el id en blanco significa dos cosas que no se
 * parecen en nada.
 *
 *   - El documento no existe todavía: crear es lo correcto.
 *   - No lo pudimos leer. Pasa cuando el GET de carga falla (los `.catch` de estas vistas
 *     muestran un toast y dejan el estado inicial sin id) y cuando la respuesta todavía no
 *     llegó al dispararse el auto-guardado de 1,5 s, que en un proyecto grande es normal.
 *
 * Crear en el segundo caso parte el proyecto en dos documentos. Y como las lecturas toman
 * `response.data[0]` sin orden garantizado, la próxima puede caer en el que no tiene los
 * datos: el trabajo de la persona aparece y desaparece sin motivo visible. Medido en la
 * base: un proyecto con 13 documentos creados de a uno, con minutos de diferencia.
 *
 * Quién sabe si el documento existe es el servidor, así que se le pregunta. Esta función
 * es el único lugar donde vive esa regla: la escriben tres pantallas (el modal del Paso 4,
 * su formulario de assessments y el editor de estudios del Paso 3) y ya se duplicó una vez.
 *
 * @returns {Promise<{id: string|null, failed?: boolean}>}
 *   `{ id }` con el documento a escribir · `{ id: null }` si de verdad no hay ninguno y
 *   crear es correcto · `{ failed: true }` si no se pudo averiguar, y entonces NO hay que
 *   crear nada: un guardado perdido con aviso es preferible a los datos partidos en
 *   silencio.
 */
export async function resolveTableDoc ({ knownId, collection, organization, projectId }) {
  if (knownId) return { id: knownId }
  try {
    const response = await Api.get(collection, {
      organization: organization,
      project_id: projectId
    })
    const doc = response && response.data && response.data.length ? response.data[0] : null
    return { id: doc && doc.id ? doc.id : null }
  } catch (error) {
    console.error(`No se pudo verificar el documento de ${collection}:`, error)
    return { failed: true }
  }
}
