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
 * POR QUÉ EL CARTEL DICE «DE ESTE PROYECTO» Y NO «DE ESTA TABLA». No es un hedge por falta
 * de dato: es lo exacto. La clave del ref lock es `(project_id, ref_id)` sin colección, y
 * eso no es una omisión del esquema sino LA GRANULARIDAD — la unidad de bloqueo es el
 * estudio, no su fila en una tabla. Quien edita `R1` en `isoqf_characteristics` bloquea
 * también `R1` en `isoqf_assessments` y en `isoqf_extracted_data`; el servidor verifica
 * `(project_id, <ref>)` para las tres (`verify_ref_lock`, `libs/decorators.py`).
 *
 * Así que cada lock que contamos SÍ afecta a este import, esté la persona en la tabla que
 * esté: no hay falsos positivos que disculpar. Y «de esta tabla» habría sido falso en el
 * otro sentido —habría implicado que las otras tablas están a salvo, y callado que quien
 * está bloqueado en otra también se ve afectado—.
 *
 * NO agregar la colección a este cartel. Backend confirmó (2026-08-27) que el dato no
 * existe en ninguna parte y que inventarlo empeoraría el mensaje. Si alguna vez hubiera
 * locks por tabla, es un cambio de esquema con una decisión de producto atrás (dos
 * personas editando `R1` en dos tablas a la vez), no un ajuste de este archivo.
 *
 * Las claves `<doc_id>::fields` son la excepción y van aparte: ésas sí identifican un
 * documento, así que se pueden atribuir a una tabla — y el import reemplaza `fields`, así
 * que corresponde nombrarlas.
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
    // que le cuesta trabajo a alguien. Y como el lock es por estudio y no por tabla,
    // cualquier clave de fila que no reconozcamos igual apunta a algo que este import
    // se va a llevar.
    const leaf = LEAF_KEY_RE.exec(key)
    studies.add(leaf ? leaf[1] : key)

    if (lock.user_name && !names.includes(lock.user_name)) names.push(lock.user_name)
  }

  return { studyCount: studies.size, names, columnsLockedBy }
}
