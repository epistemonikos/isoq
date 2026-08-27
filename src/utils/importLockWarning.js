/**
 * Cómo se lee el listado de ref locks desde la pantalla que está por importar una tabla.
 *
 * El import es `DELETE` + `POST` del documento completo. Exige el lock de PROYECTO, pero
 * no mira los ref locks: quien esté editando un estudio del Paso 3 o 4 sostiene un lock
 * por `ref_id`, así que el import le pasa por encima sin conflicto, sin aviso y con las
 * filas ya borradas. Backend decidió no cerrarlo del lado servidor —un import destructivo
 * que falla porque alguien tiene una fila abierta convierte una operación legítima en una
 * lotería— y sugirió que preguntemos antes. Ésta es la mitad nuestra de eso.
 *
 * Vive aparte del componente y sin i18n por el mismo motivo que `lockLostMessage.js`: la
 * regla de qué se avisa es una, y en este mismo hilo ya nos costó dos veces tenerla en dos
 * copias.
 *
 * LÍMITE, y es el que define el texto: la clave del ref lock NO codifica la colección
 * (ver `refLockUrls.js`), así que una fila de `isoqf_characteristics` y una de
 * `isoqf_assessments` para el mismo estudio dan exactamente la misma clave. No podemos
 * saber en qué tabla está la persona, y por eso el cartel dice «de este proyecto» y no
 * «de esta tabla»: prometer precisión que no tenemos produce un aviso que grita de más, y
 * un aviso que grita de más se aprende a ignorar. Las claves `<doc_id>::fields` son la
 * única excepción —traen el id del documento— así que son las únicas atribuibles.
 */

// El formato de `<doc_id>::fields` vive en `refLockUrls` y no acá: es la misma clave que
// construyen quienes toman ese lock, y tenerla en dos lados es como se llega a un lock que
// nadie suelta. Se mantiene aparte de la clave de fila a propósito, para que quien edita
// columnas no bloquee a quien edita un estudio.
import { docIdFromFieldsLockKey } from '@/utils/refLockUrls'

// `R1::s0::o2` — la celda del endpoint D. Para quien va a importar es el mismo estudio que
// `R1`, porque el import se lleva la fila entera.
const LEAF_KEY_RE = /^(.+?)::s\d+::o\d+$/

/**
 * @param {Array<{ref_id: string, user_name?: string}>} locks locks AJENOS — el filtrado de
 *   los propios es de quien llama, que es el único que sabe qué sostiene esta pestaña.
 * @param {string} tableId id del documento de la tabla que se está por reemplazar.
 * @returns {{studyCount: number, names: string[], columnsLockedBy: string|null}}
 */
export function summarizeImportLocks (locks = [], tableId = '') {
  const studies = new Set()
  const names = []
  let columnsLockedBy = null

  for (const lock of locks || []) {
    const key = (lock && lock.ref_id) || ''
    if (!key) continue

    const fieldsDocId = docIdFromFieldsLockKey(key)
    if (fieldsDocId) {
      // Sólo si es de ESTA tabla. Es el único caso en el que la clave nos deja callarnos
      // con fundamento en vez de por suposición.
      if (tableId && fieldsDocId === tableId) columnsLockedBy = lock.user_name || null
      continue
    }

    // Una clave de forma desconocida cae del lado que avisa. Es la decisión inversa a la
    // allowlist de `lockErrors.js`, y a propósito: allá un motivo nuevo debe caer en el
    // comportamiento anterior; acá callarnos sobre un lock que existe es el único error
    // que le cuesta trabajo a alguien.
    const leaf = LEAF_KEY_RE.exec(key)
    studies.add(leaf ? leaf[1] : key)

    if (lock.user_name && !names.includes(lock.user_name)) names.push(lock.user_name)
  }

  return { studyCount: studies.size, names, columnsLockedBy }
}
