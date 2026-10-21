/**
 * ¿Qué candados ajenos pertenecen a la worksheet que tengo abierta, y cuáles se
 * soltaron desde el sondeo anterior?
 *
 * Existe porque el sondeo de `GET /refs` y la carga de datos eran dos canales que nunca
 * se hablaron: `editList` refrescaba los candados cada 5 s y los datos del hallazgo una
 * sola vez, al entrar. Así que cuando otra persona terminaba de evaluar una dimensión,
 * a quien miraba se le borraba el cartel y se le habilitaba el botón —eso ya andaba—
 * pero la celda seguía diciendo «Assessment not completed». El instante en que un lock
 * ajeno desaparece ES la señal de que hay algo nuevo que leer; acá se la escucha.
 *
 * La pregunta se hace por BASE y no por hallazgo a propósito: el sondeo trae los locks
 * de TODO el proyecto, y una hoja abierta no tiene nada que repintar porque alguien
 * suelte una sección de otro hallazgo. Ver `worksheetLockKeys`.
 */

// Infijo común a las tres convenciones de clave vivas: `::ep::`, `::sK::oI`, `::fields`.
const SEPARATOR = '::'

/**
 * Documento del que cuelga una clave de lock, sea cual sea el eje.
 *
 * Los tres ejes vivos componen su clave en su propio módulo, con su propio motivo
 * escrito: `<doc>::ep::<sección>` (`evidenceProfileLockKeys.js`), `<ref>::sK::oI`
 * (`camelotAssessmentKeys.js`) y `<doc>::fields` (`refLockUrls.js`). Una clave pelada
 * —el `/identity` de un hallazgo, una fila de datos extraídos— es su propia base.
 *
 * Espeja `base_ref_of` (`auth_server/libs/ref_locks.py`), que es la función que del otro
 * lado decide un conflicto. Espejarla a ELLA, y no a la lista de ejes que este cliente
 * conoce, es lo que hace que un eje nuevo del servidor siga colgando de su documento
 * acá también.
 *
 * Corta en el primer `::` en vez de delegar en las tres funciones por eje
 * (`sectionLockBaseOf`, `baseRefOf`, `docIdFromFieldsLockKey`). Delegar sería más fiel a
 * cada convención —cada regex valida su forma— pero un eje que el servidor ya emite y
 * este cliente todavía no enumera caería al default, se devolvería ENTERO, no
 * coincidiría con ninguna base y esa hoja dejaría de refrescarse por ese eje. Justo el
 * caso que nadie prueba, y el que el test del sufijo desconocido fija.
 *
 * El riesgo del corte genérico es un id de documento que contenga `::`, y hoy no existe:
 * son ObjectIds hexadecimales.
 *
 * Contrato que los tests fijan (`tests/unit/utils/worksheetLockScope.spec.js`):
 *   'f1::ep::coherence' -> 'f1'
 *   'R1::s0::o2'        -> 'R1'
 *   'doc123::fields'    -> 'doc123'
 *   'R1'                -> 'R1'      (pelada: es su propia base)
 *   'f1::loquesea::x'   -> 'f1'      (un eje que este cliente todavía no enumera)
 *   null / '' / 42      -> null
 */
export function lockBaseOf (lockKey) {
  if (typeof lockKey !== 'string') return null
  const separator = lockKey.indexOf(SEPARATOR)
  const base = separator === -1 ? lockKey : lockKey.slice(0, separator)
  return base || null
}

/**
 * Las claves ajenas que pertenecen a esta worksheet, como `Set`.
 *
 * `ownedBases` es todo lo que la hoja pinta: el id del hallazgo, sus referencias (de ahí
 * cuelgan las filas de datos extraídos, de características y de assessments) y los
 * documentos de esas tablas (de ahí cuelgan las columnas). Un solo arreglo en vez de un
 * parámetro por eje: la regla es una sola —«la base está entre las mías»— y agregar un
 * eje no cambia esta función.
 *
 * Descarta las bases vacías porque llegan así: un documento que todavía no existe deja
 * un `undefined` en el arreglo, y sin el descarte una clave mal formada cuya base fuera
 * `undefined` entraría al conjunto y haría recargar la hoja sola.
 */
export function worksheetLockKeys (foreignLocks, ownedBases) {
  const keys = new Set()
  if (!Array.isArray(foreignLocks) || !Array.isArray(ownedBases)) return keys

  const bases = new Set(ownedBases.filter(Boolean))
  if (!bases.size) return keys

  foreignLocks.forEach((lock) => {
    const key = lock && lock.ref_id
    if (!key) return
    if (bases.has(lockBaseOf(key))) keys.add(key)
  })

  return keys
}

/**
 * Las claves que estaban en el sondeo anterior y ya no están.
 *
 * Claves desaparecidas y no tamaños: si en el mismo ciclo alguien suelta una sección y
 * otra persona toma otra, el total no cambia pero sí hay algo nuevo que mostrar.
 *
 * `previous` en `null` significa «todavía no sé», que no es lo mismo que «no había
 * ninguno»: el primer sondeo sólo siembra la instantánea. Mismo criterio que
 * `knownLastUpdate` en `projectFreshnessMixin`.
 */
export function releasedKeys (previous, current) {
  if (!previous) return []
  const now = current || new Set()
  return [...previous].filter(key => !now.has(key))
}
