/**
 * Secciones del evidence profile y sus claves de `ref_locks`.
 *
 * Las cinco secciones son los assessments de la hoja GRADE-CERQual: las cuatro
 * dimensiones más el juicio de confianza que se deriva de ellas. Viven acá y no en
 * `evidenceProfileForm.vue` porque las necesitan tres componentes —el modal, la
 * tabla que pinta los botones, y la vista de findings— y porque el nombre de la
 * sección viaja con DOS ortografías distintas por la app (ver `sectionOfType`).
 *
 * El repo ya aprendió a poner cada convención de clave en su propio módulo con la
 * razón escrita: ver `criteriaLockKeys.js` (prefijo sintético), `refLockUrls.js`
 * (`<doc_id>::fields`) y `camelotAssessmentKeys.js` (`<ref>::sK::oI`). La clave
 * de lock es un string que nadie compila y que el backend compone igual del otro
 * lado, así que interpolarla en el sitio de uso es cómo se divergen dos repos sin
 * que ningún test lo note.
 */

/**
 * Grafía canónica de las secciones: guión BAJO. Es la de las URLs
 * (`PATCH /isoqf_findings/<id>/section/<name>`) y la de la whitelist del servidor
 * (`auth_server/libs/evidence_profile.py`).
 */
export const EVIDENCE_PROFILE_SECTIONS = [
  'methodological_limitations',
  'coherence',
  'adequacy',
  'relevance',
  'cerqual'
]

/**
 * Sección -> clave i18n de su nombre visible.
 *
 * Este mapa estaba escrito a mano en `editStageTwo` y otra vez en
 * `evidenceProfileFields`. Vive acá porque ahora lo necesita también el listado de
 * hallazgos, para decir QUÉ está evaluando cada persona en vez de un genérico
 * «siendo editado».
 *
 * Es dato, no traducción: guarda la clave y deja el `$t` al componente. Y ojo con
 * `cerqual`, que es la excepción del conjunto: su etiqueta no es `worksheet.cerqual`
 * —esa clave no existe— sino la de la cabecera de la tabla.
 */
export const SECTION_LABEL_KEYS = {
  methodological_limitations: 'worksheet.methodological_limitations',
  coherence: 'worksheet.coherence',
  adequacy: 'worksheet.adequacy',
  relevance: 'worksheet.relevance',
  cerqual: 'soqf_table.print_confidence'
}

/**
 * `'methodological-limitations'` -> `'methodological_limitations'`.
 *
 * La tabla del evidence profile pasa el tipo con GUIÓN a `editStageTwo`, que lo
 * deja en `selectedOptions.type`; el endpoint y la whitelist usan guión BAJO. Esa
 * traducción estaba escrita a mano en dos lugares (el mapa de títulos de
 * `editListEvidenceProfile.vue` y un `if` dentro de `updateOptions`), y una tercera
 * copia habría sido la primera oportunidad de que se desincronizaran.
 *
 * Idempotente a propósito: recibe indistintamente las dos grafías, porque los
 * llamadores son los dos mundos. Devuelve `null` para cualquier cosa que no sea
 * una de las cinco secciones — lo desconocido no se convierte en una sección.
 */
export function sectionOfType (type) {
  if (typeof type !== 'string') return null
  const canonical = type.replace(/-/g, '_')
  return EVIDENCE_PROFILE_SECTIONS.includes(canonical) ? canonical : null
}

/**
 * Infijo literal de la clave de sección. Contrato entre repos: el servidor compone
 * el mismo string en `auth_server/libs/evidence_profile.py`
 * (`EP_SECTION_REF_LOCK_FORMAT = '{doc_id}::ep::{name}'`).
 *
 * Es literal y constante por una razón que conviene no perder: vuelve esta forma
 * DISJUNTA de la hoja de evaluación del Paso 4 (`<ref>::sK::oI`) y de la clave de
 * columnas (`<doc>::fields`), así que ninguna clave puede leerse como dos cosas y
 * el orden en que se prueban los patrones deja de importar.
 */
export const EP_SECTION_INFIX = '::ep::'
const EP_SECTION_KEY_RE = /^(.+)::ep::([A-Za-z0-9_]+)$/

/**
 * Documento del que cuelga una clave de sección, o `null` si no es una.
 *
 * Espejo de `base_ref_of` (`auth_server/libs/ref_locks.py`), que es **la función
 * que decide un conflicto**. Por eso el tramo de la sección es `[A-Za-z0-9_]+`
 * genérico y no la enumeración de las cinco: si el servidor conoce una sexta
 * sección y este cliente todavía no, la clave tiene que seguir colgando de su
 * documento igual que allá. Enumerar acá haría que el cliente y el servidor
 * discrepasen justo en el caso que nadie prueba.
 */
export function sectionLockBaseOf (lockKey) {
  if (typeof lockKey !== 'string') return null
  const match = EP_SECTION_KEY_RE.exec(lockKey)
  return match ? match[1] : null
}

/**
 * ¿Esta clave de lock afecta al documento `docId`?
 *
 * Es la pregunta de las superficies que pintan **por finding** (renombrar, borrar):
 * cualquier lock cuya base sea el finding lo ocupa, porque `<doc_id>` pelado es la
 * clave de `/identity` y de `/finding/remove`, y el servidor la hace chocar con
 * cualquier sección suya.
 *
 * OJO — no es la pregunta de la tabla del evidence profile, que pinta **por
 * sección** y compara la clave exacta. Son dos preguntas distintas a propósito: un
 * `<fid>::ep::X` con X que este cliente no conoce ocupa el finding acá, y no
 * bloquea ninguna de las cinco secciones allá. Eso no es fail-open, es lo que el
 * servidor contesta: pedir `<fid>::ep::coherence` evalúa `other == base`, y contra
 * `<fid>::ep::X` da falso, o sea autoriza. Bloquear ahí sería más restrictivo que
 * el servidor, o sea mentir en la otra dirección.
 */
export function lockKeyBelongsTo (lockKey, docId) {
  if (!lockKey || !docId) return false
  return lockKey === docId || sectionLockBaseOf(lockKey) === docId
}

/**
 * Clave de lock de UNA sección: `<findingId>::ep::<section>`.
 *
 * Estricto al emitir (a diferencia de `sectionLockBaseOf`, permisivo al leer):
 * devuelve `null` sin findingId o con una sección que no está en la whitelist. La
 * razón no es purismo — es la misma de `fieldsLockKey` en `refLockUrls.js`: una
 * clave a medio construir se tomaría sobre nada y **nunca se soltaría**, porque
 * `releaseRef` busca por igualdad de string y el release iría con otro valor. La
 * falla no sería un error visible sino un lock colgado hasta el TTL.
 */
export function sectionLockKey (findingId, section) {
  const canonical = sectionOfType(section)
  return findingId && canonical ? `${findingId}${EP_SECTION_INFIX}${canonical}` : null
}

/**
 * `'f1::ep::coherence'` -> `{ findingId: 'f1', section: 'coherence' }`; cualquier
 * otra forma -> `null`.
 *
 * Permisivo al leer, igual que `sectionLockBaseOf`: acepta una sección que este
 * cliente todavía no enumera, porque el servidor también la acepta. Quien necesite
 * decidir sobre las cinco conocidas filtra después con `EVIDENCE_PROFILE_SECTIONS`
 * — que es justo lo que hace `blockedSectionsOf`, y por motivos distintos según la
 * dirección del parentesco (ver su comentario).
 */
export function parseSectionLockKey (lockKey) {
  if (typeof lockKey !== 'string') return null
  const match = EP_SECTION_KEY_RE.exec(lockKey)
  return match ? { findingId: match[1], section: match[2] } : null
}

/**
 * Qué secciones están bloqueadas por otra persona, y por quién.
 *
 * Es la pregunta de la tabla del evidence profile, que pinta **por sección** — la
 * otra pregunta, la de las superficies que pintan por finding, la contesta
 * `lockKeyBelongsTo`. Ver su comentario: son dos preguntas distintas a propósito y
 * las dos espejan lo que el servidor contesta.
 *
 * Las tres reglas, y por qué cada una va en la dirección que va:
 *
 *  1. **`<findingId>` pelado bloquea las cinco.** Es un lock estrictamente MÁS
 *     AMPLIO: lo sostiene quien edita la identidad del finding desde `ViewTable`, y
 *     lo sostiene un bundle viejo durante el despliegue. Ignorarlo sería fail-open —
 *     dos personas escribiendo la misma sección, cada una creyendo que la tiene.
 *  2. **Una sección conocida bloquea sólo esa.** El objetivo de la feature.
 *  3. **Una sección que este cliente NO enumera no bloquea ninguna.** Parece
 *     fail-open y es lo contrario: el servidor evalúa `other == base` al pedir
 *     `<fid>::ep::coherence`, y contra `<fid>::ep::algo_nuevo` da falso, o sea
 *     AUTORIZA. Bloquear acá sería más restrictivo que el servidor — mentir en la
 *     otra dirección. Y sí ocupa el finding entero en `ViewTable`, que es la otra
 *     pregunta: ahí `<fid>` pelado sí choca con ella.
 *
 * El criterio que unifica las tres es «espejar `base_ref_of`, no la lista de
 * secciones»: la relación de parentesco la decide el servidor con un tramo genérico,
 * y la enumeración sólo entra para saber a qué BOTÓN corresponde una clave.
 *
 * Descarta el lock propio por el camino que a `foreignRefLocks` le falta: ése quita
 * los de ESTA pestaña (registro local de `LockService`), y `myUserName` quita los de
 * otra pestaña de la misma persona. Sin el segundo, abrir la worksheet dos veces se
 * bloquea contra uno mismo, con el propio nombre en el cartel — un bug que este repo
 * ya derivó mal dos veces.
 *
 * Un lock sin `user_name` no bloquea: sin a quién nombrar, el cartel queda mudo y el
 * botón muerto. Y por este listado pasan también claves de otros ejes
 * (`R1::s0::o0`, `doc::fields`, `criteria::inclusion`): se ignoran sin lanzar.
 */
export function blockedSectionsOf (foreignLocks, findingId, myUserName) {
  const blocked = new Map()
  if (!findingId || !Array.isArray(foreignLocks)) return blocked

  foreignLocks.forEach((lock) => {
    const key = lock && lock.ref_id
    const holder = lock && lock.user_name
    if (!key || !holder || holder === myUserName) return

    // (1) El documento entero. Sólo rellena lo que nadie reclamó todavía, para que
    // el cartel de una sección con dueño propio siga nombrando a esa persona.
    if (key === findingId) {
      EVIDENCE_PROFILE_SECTIONS.forEach((section) => {
        if (!blocked.has(section)) blocked.set(section, holder)
      })
      return
    }

    // (2) y (3): una sección de ESTE finding, y sólo si la conocemos.
    const parsed = parseSectionLockKey(key)
    if (!parsed || parsed.findingId !== findingId) return
    if (!EVIDENCE_PROFILE_SECTIONS.includes(parsed.section)) return
    if (!blocked.has(parsed.section)) blocked.set(parsed.section, holder)
  })

  return blocked
}

/**
 * Quién tiene tomado qué de este hallazgo, para el listado que pinta por finding.
 *
 * Devuelve `[{ section, holder }]`. Un `section` en `null` significa que el bloqueo es
 * del **documento entero** —alguien editando el nombre o las referencias, no una
 * evaluación— y en ese caso la lista trae una sola entrada: ese lock es estrictamente
 * más amplio, así que quien lo sostiene excluye a todos y enumerar secciones al lado
 * sería ruido contradictorio.
 *
 * **El orden es parte del contrato, no cosmética.** `GET /refs` no garantiza orden, y
 * la versión anterior resolvía el titular con un `.find()`: con varias personas
 * evaluando secciones distintas, el cartel nombraba a una u otra según cómo llegaran
 * los locks. Dos personas mirando la misma fila veían nombres distintos, y el nombre
 * podía cambiar entre dos sondeos sin que nada hubiera cambiado. Ordenar por persona
 * —y por el orden canónico de sección como desempate, para quien sostiene dos— lo hace
 * estable.
 *
 * Sólo enumera las cinco secciones conocidas, por el mismo motivo que
 * `blockedSectionsOf`: una clave `::ep::` que este cliente no reconoce no se puede
 * etiquetar, y el servidor la autoriza a convivir con las demás. Que igual ocupe el
 * hallazgo lo dice `lockKeyBelongsTo`, que es la otra pregunta.
 */
export function findingLockDetailsOf (foreignLocks, findingId, myUserName) {
  if (!findingId || !Array.isArray(foreignLocks)) return []

  const ajenos = foreignLocks.filter((lock) => {
    const holder = lock && lock.user_name
    return Boolean(lock && lock.ref_id) && Boolean(holder) && holder !== myUserName
  })

  const documento = ajenos.find(lock => lock.ref_id === findingId)
  if (documento) return [{ section: null, holder: documento.user_name }]

  return ajenos
    .map((lock) => {
      const parsed = parseSectionLockKey(lock.ref_id)
      if (!parsed || parsed.findingId !== findingId) return null
      if (!EVIDENCE_PROFILE_SECTIONS.includes(parsed.section)) return null
      return { section: parsed.section, holder: lock.user_name }
    })
    .filter(Boolean)
    .sort((a, b) => a.holder.localeCompare(b.holder) ||
      EVIDENCE_PROFILE_SECTIONS.indexOf(a.section) - EVIDENCE_PROFILE_SECTIONS.indexOf(b.section))
}
