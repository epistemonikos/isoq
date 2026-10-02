/**
 * Claves de `ref_locks` para las cajas de criterios del Paso 2.
 *
 * Los criterios de inclusión/exclusión viven como dos campos del propio proyecto
 * (`isoqf_projects.inclusion` / `.exclusion`), así que no tienen un id que sirva de
 * `ref_id`. El backend trata el `ref_id` como un valor opaco, de modo que un prefijo
 * sintético alcanza para darle a cada caja su propio lock sin tocar el servidor.
 *
 * El prefijo importa por dos razones:
 *  - `criteria::inclusion` no matchea `LEAF_KEY_RE` ('{base}::s\d+::o\d+') en
 *    `libs/ref_locks.py`, así que no se lo confunde con la hoja de un estudio ni
 *    hereda su lógica de parentesco.
 *  - Ningún `ref_id` de estudio empieza con 'criteria::', así que no puede colisionar
 *    con los locks de los Pasos 3 y 4 dentro del mismo proyecto.
 *
 * OJO: este lock es *advisory*. `PATCH /api/isoqf_projects/<id>` pasa por
 * `@verify_project_lock()`, que sólo mira `project_locks`; el servidor no rechaza una
 * escritura de criterios por un `ref_lock`. Sirve para coordinar a los editores en la
 * UI, no como garantía de integridad.
 */

export const CRITERIA_FIELDS = ['inclusion', 'exclusion']

const PREFIX = 'criteria::'

/** `'inclusion'` -> `'criteria::inclusion'`; cualquier otra cosa -> `null`. */
export function criteriaLockKey (field) {
  return CRITERIA_FIELDS.includes(field) ? `${PREFIX}${field}` : null
}
