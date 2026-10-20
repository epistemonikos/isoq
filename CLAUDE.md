# iSoQ Web — guía para agentes

Frontend de iSoQ (GRADE-CERQual). El backend es `isoq_server` (Flask, rama `isoqf_310`), con su propio
`CLAUDE.md`; al final hay un resumen del contrato entre los dos.

## Reglas [no negociables]

1. npm only.
2. TDD: `npm test` en rojo → implementar → `npm test` en verde. Pedirle al usuario que corra la suite
   completa y pegue el resultado.
3. Todo texto visible: `$t('key')` + `src/lang/{en,es,pt}.json`.
4. **Un test verde sobre el estado no prueba que se vea.** Si el dato termina en pantalla, la aserción
   va sobre el DOM renderizado, y la puerta final es el navegador.

## Stack

Vue 2.7 (Options API; sin `<script setup>` ni Composition API) · Vuex 3 · Vue Router 3 (hash, sin
prefijo de idioma) · Bootstrap-Vue 2.23 (`<b-table>`, `<b-modal>`, `<b-form-*>`) · Webpack 4 (config real
en `build/`) · Axios · Dexie (cache offline) · vue-i18n 8 · Sentry · Node 14 · Jest 27 + vue-test-utils.

- Tests: `npx jest` (todo) o `npx jest <ruta>`. Specs en `tests/unit/**/*.spec.js`.
- Lint: `npx eslint --ext .js,.vue src`. Los specs no tienen el entorno de Jest configurado en ESLint
  (errores de `describe`/`it` esperables); hay `no-unused-vars` heredados en `for…of`: comparar contra
  `develop` antes de atribuirse un error.
- Dev: `npm run dev` (puerto 8090; el proxy de `config/index.js` apunta a `localhost:8080`). Build del
  host de pruebas: `npm run build:test`.

## Patrones obligatorios

- **HTTP: siempre `Api`** (`src/utils/Api.js`), nunca axios directo. GET cacheado en IndexedDB;
  POST/PATCH/DELETE encolados offline y reproducidos al reconectar.
- Estado: acciones/mutaciones de Vuex (`src/store.js`), nunca `this.$store.state.x = y`.
- Rutas: lazy load `() => import(/* webpackChunkName: "x" */ '@/components/...')`; guardas
  `meta.requiresAuth` y `meta.requiresAdmin` (`user.flags`: superadmin | support).
- **Errores**: `Commons.printErrors` NO muestra nada. Una escritura que falla avisa con
  `writeErrorMessageKey()` (`src/utils/writeErrors.js`, que calla sólo lo que otro canal ya avisó);
  una carga que falla no se muestra como vacío (`LoadErrorAlert.vue` o el `b-alert` + Reintentar de la
  pantalla). `tests/unit/guards/silentCatches.spec.js` falla ante un `catch` nuevo que sólo loguea: si
  callar es correcto, va a `tests/unit/guards/silentCatchAllowlist.js` con el motivo.
- **Toast vs `b-alert`: un evento, un canal.**
  - `b-alert` = **estado** que sigue siendo cierto mientras la persona mira esa pantalla y cambia lo
    que puede hacer ahí: solo lectura por lock, carga fallida + Reintentar, conflicto de versión +
    Recargar, inactividad, advertencias preventivas.
  - Toast = **evento** sin huella en la pantalla actual: guardado ok, fallo de un editor ya cerrado,
    estudio borrado, replay offline, permisos cambiados.
  - Si el componente dibuja un `b-alert` para ese estado, no dispara toast. Un evento que llega por
    varios caminos lo avisa sólo su dueño (el 403 de escritura es de `permission-denied`).
- **Reglas compartidas, no reimplementadas**: si una regla ya tiene función (`sortFindings`,
  `sortByStudyLabel`, `withDerivedRows`, `lockLostMessage`, `isLockRejection`…), usarla. Cada regla
  duplicada terminó produciendo resultados distintos entre vistas.

## Modelo de datos

```
isoqf_projects (use_camelot → cambia los pasos 3/4)
  ├─ isoqf_references
  ├─ isoqf_list_categories
  ├─ isoqf_characteristics   (Paso 3, una fila por referencia)
  ├─ isoqf_assessments       (Paso 4; CAMELOT: stages[k].options[i])
  └─ isoqf_lists ── isoqf_findings (evidence_profile) ── isoqf_extracted_data (una fila por referencia)
```
evidence_profile: options 0-3 = no/minor/moderate/serious; cerqual 0-3 = high/moderate/low/very low.

- **Las referencias de un finding se leen de `list.references`**, nunca de
  `finding.evidence_profile.references`: el endpoint `/identity` escribe sólo en la lista y esa copia
  queda vieja (`editList` las sincroniza desde la lista; la preview de la hoja también).
- La lista y su finding son 1:1 por convención, no por integridad.
- El `cerqual` autoritativo es el top-level de la lista: `Commons.resolveCerqual`.

## El número del finding

**Es POSICIÓN, no identidad, y se deriva al vuelo.** Posición = índice + 1 sobre
`Commons.sortFindings` (por categoría y luego por `sort`), igual en pantalla y en exportables. Toda
vista que lo muestre necesita **listas + categorías**.

- Único campo persistido: `isoqf_lists.sort` = el orden que eligió el usuario. Lo escriben sólo el alta
  (máximo + 1) y el modal de reordenar (ref-lock `findings_order`, que reconcilia con
  `reconcileFindingsOrder` antes de guardar). El servidor no renumera: los huecos son válidos.
- `isoqf_id` (finding y evidence_profile) es legado: no escribir ni leer. `list.cnt` no existe.
- Exportables: nunca caer a `id` ni a literales tipo `'1'`.

## El orden de los estudios

**También es de presentación**: `list.references` se guarda en el orden en que se marcaron las
casillas, y el servidor no ordena nada. Toda tabla o lista de citas por estudio ordena al mostrar con
`sortByStudyLabel` / `sortByAuthors` (`src/utils/tableDataUtils.js`: `localeCompare` sobre la etiqueta
«Autor Año» que se lee, estable).

- `withDerivedRows` (`src/utils/derivedRows.js`) agrega al final las filas de estudios sin fila
  guardada, por contrato: **ordena quien llama, después de derivar**.
- En datos extraídos (`editList.processExtractedData`) se ordena antes de fijar `original_items`: el
  editor abre `items[data.index]` y el editor en sitio compara `item.index`. No usar `sort-by` del
  `b-table` ahí.
- No ordenar `references` antes del PATCH: no arreglaría lo ya guardado.
- Nunca `sort((a, b) => a.id - b.id)`: los ids son strings hex y la resta da `NaN`.

## Archivos clave

```
src/utils/Api.js                    HTTP + cola offline + interceptor de 409 de lock
src/store.js                        Vuex (getLogginInfo, isOnline)
src/services/lockService.js         ref-locks: acquireRef/releaseRef, latido 30 s (HEARBEAT_INTERVAL)
src/services/db.js                  esquema Dexie
src/utils/lockErrors.js             isLockRejection, VERSION_REASONS (allowlist)
src/utils/lockLostMessage.js        qué cartel corresponde a cada `reason`
src/utils/referenceDeleted.js       evento único `reference-deleted`
src/utils/leafVersion.js            `_v` de la celda del Paso 4
src/utils/tableDataUtils.js         sortByStudyLabel / sortByAuthors
src/utils/derivedRows.js            filas de estudios sin fila guardada
src/utils/project.js                Project.validations / create / update (PATCH /api/publish)
src/components/project/PublishModal.vue   publicación (can_publish + confirmación de datos personales)
src/strategies/exportStrategies.js  exports Word/CSV
src/mixins/preserveScrollMixin.js   conservar el scroll al recargar tablas
src/mixins/fixedRefLockMixin.js     locks de clave fija de los modales del Paso 2
```

## Publicación

`PublishModal.vue` → `Project.validations()` (propiedades) → `GET /api/project/can_publish` (≥1
referencia y ≥1 finding **completo**: referencias + nivel de confianza + explicación en el mismo
finding) → `PATCH /api/publish`. Para todo guardado público el servidor exige
`no_personal_data_confirmed: true` (400 `personal_data_confirmation_required`); la casilla se precarga
con el valor almacenado y despublicar la borra. `PATCH /api/publish` es también el guardado de
Propiedades.

## Concurrencia

- **Sólo ref-locks.** El lock de proyecto se retiró en los dos repos (2026-10-01): no existe
  `acquire()`, `IDLE_TIMEOUT` ni los eventos `lock-lost`/`lock-idle`/`axios-refresh-lock`. No
  reintroducirlo: congelaba los pasos 1–4 para todo el equipo.
- Claves: estudio `R`, hoja `R::sK::oM`, datos extraídos `<doc>::ed::R`
  (`extractedDataLockKeys.js`), columnas `<doc>::fields`, evidence profile e identidad `finding_id`, y
  fijas: `project_properties` (Propiedades, modal de la lista, Publicar), `list_categories` («Review
  finding groups») y `findings_order` («Re-order your review findings»). El servidor exige las fijas.
- **TTL del servidor (180 s) y latido (30 s) son un solo contrato**: el TTL tolera tres latidos
  perdidos (Chrome lleva `setInterval` a 1/min en pestañas ocultas). Si cambia `HEARBEAT_INTERVAL`,
  avisar a backend. Además la cadencia sostiene el texto de `evicted_granularity_conflict` («podrás
  seguir en cuanto termine»): no subirla.
- `revalidateLocks()` late al volver la pestaña al frente. Un latido sobre un lock vencido lo revive,
  salvo conflicto de granularidad.
- Motivos de 409 (`reason` + `locked_by` en el `detail` de `ref-lock-lost`):

  | `reason` | dónde | se destraba solo |
  |---|---|---|
  | `evicted_granularity_conflict` | latido | sí, cuando el otro suelte |
  | `locked_by_other_user` | latido / acquire | no |
  | `lock_expired` | latido (sin `locked_by`) | no |
  | `locked_at_another_granularity` | acquire | — (orienta si esperar) |
  | `reference_deleted` (+ `deleted_by`) | escritura / latido / acquire | no |
  | `lock_not_held` (`locked_by` sólo si otro lo tiene) | escritura | no |

  **Los chequeos son allowlists** (`VERSION_REASONS`, `lockLostMessage.js`): un motivo desconocido
  cae en el comportamiento por defecto. Antes del motivo hay una guarda de URL
  (`refLockKeyFromUrl`: `/section/`, `/identity`, `/item/`, `/field/`): un 409 de otra ruta no dispara
  el evento de lock.
- **Un editor con ref-lock no suelta el lock con un guardado en vuelo.** Cerrar al confirmar
  dejaba que `hidden` soltara el lock antes de que llegara el PATCH (409 `lock_not_held`, texto
  perdido, #404): el `@ok` cancela el cierre, espera el PATCH y cierra sólo si salió bien
  (`confirmRowWrite` en `editListExtractedData.vue`; en el Paso 4, `settlePendingWrites`).
- **Perder el lock tiene que ser visible**: todo editor con ref-lock escucha `ref-lock-lost` y
  muestra un cartel. No sumarle el error genérico de guardado: `isLockRejection()` antes de notificar.
- **Estudio borrado con gente trabajando**: no hay lock al entrar al Paso 1; se advierte quién lo
  usa (`studyHolders()`). Los tres caminos del servidor terminan en un solo evento
  `reference-deleted`: `OfflineIndicator` (un toast por estudio), `projectFreshnessMixin` (refresca),
  `referenceDeletedMixin` (cierra el editor de ese estudio; un editor nuevo de estudio se suma ahí).
  No sale por `ref-lock-lost` ni `ref-lock-conflict`.
- En `crudTables` el modal de edición se renderiza cerrado: la guarda es sobre la fila, no sobre el
  largo del arreglo.

### Versiones (`_v`)

- Por **fila** (endpoints B/C): viaja dentro del ítem; el cliente lo devuelve tal cual y **absorbe el
  `_v` nuevo de la respuesta**. Reconstruir la fila desde `fields` (`getCleanedItems`,
  `customFieldsHelper`) lo pierde: usar `copyItemMetadata` (`src/utils/itemMetadata.js`).
- Por **celda** del Paso 4 (endpoint D): `stages[k].options[i]._v`; sin contador = 0; el cliente manda
  siempre un entero (`leafVersion.js`). En `AssessmentForm` la versión va atada a la hidratación; tras
  guardar se lee de la respuesta (o +1 si quedó en la cola offline). El 409 trae `option` al día.
- 409 `version_conflict` trae el ítem fresco: mostrarlo, no tirarlo a `console.error`.
- **El servidor puede instrumentar lo que el cliente le manda, nunca lo que el cliente descarta.**
  Para todo campo de respuesta (`reason`, `_v`, `item`) la única red es un test de este lado que
  compruebe que el camino no se pierda (patrón: `lockErrors.spec.js` con un motivo inexistente).

## Offline / PWA

`state.isOnline` vía eventos de `window` → `this.isOnline` (mixin global). Api encola mutaciones y las
reproduce al reconectar; Service Worker con workbox. Un 404 al reproducir un DELETE es éxito
(`isAlreadyGone()`); un 409 `duplicate_key` o de versión se descarta con aviso, no se reencola
(repetiría el mismo 409 y trabaría la cola).

## Scroll al guardar

`scrollBehavior: () => ({x: 0, y: 0})` (`main.js`) es incondicional: **cualquier** `$router.push`,
aunque sólo cambie `query` o `hash`, manda al tope. No agregar navegaciones «inocuas». Al recargar una
tabla, el slot `table-busy` acorta el documento y el navegador clampea el scroll:
`preserveScrollMixin.holdScrollPosition()` antes de recargar (ya está en `crudTables.getData()` y
`editList.getList()`). jsdom no tiene layout: verificar en navegador.

## Configuración y despliegue

- Lo propio de cada servidor va en **`.env`** (raíz, no versionado; plantilla `.env.example`), nunca
  editando `config/*.env.js` (trackeados: dejan el checkout sucio, el build sale `-dirty` y el
  `git pull` aborta). Precedencia (`config/env.js`): shell > `.env` > default commiteado; un valor
  vacío cae al default. Nada secreto en `config/*.env.js`: termina en el bundle.
- **Qué código sirve un host**: `curl -s <host>/ | grep build-commit` (lo estampa `build/buildInfo.js`;
  un config nuevo de webpack tiene que pasárselo). Las fechas de `dist/` no lo dicen. Un deploy
  exitoso no prueba que el código esté al día.
- Sin `SENTRY_DSN` Sentry no arranca (`main.js`). `SENTRY_AUTH_TOKEN` sólo en `.env`.
- **Lo que va a Sentry pasa por `src/utils/sentryPrivacy.js`** (`...sentryPrivacyOptions` al final
  del `init`): sin query strings, emails y tokens (≥ 32 hex) redactados, sin props ni argumentos de
  consola, usuario sólo por `id`. Igual, **nada de emails ni tokens en una URL de la API**: van en el
  cuerpo (la URL queda además en los logs de nginx).
- `src/plugins/Translation.js` tiene lógica legada de prefijo `:lang`: ignorarla.
- Cypress está instalado pero no se usa.

## Contrato con el backend (resumen)

- 409 con `reason` en el nivel superior del cuerpo y `locked_by` cuando hay titular.
- `PATCH /api/<colección>/<id>` responde `{status, id}`, no el documento; leen la respuesta sólo
  `/api/sharedLink`, `/share/project/<id>/options-update` y los tres de `isoqf_characteristics`.
- La ruta genérica PUT/PATCH de characteristics/assessments/extracted_data puede responder 405 si el
  servidor la bloquea (`GENERIC_TABLE_WRITE_BLOCKED`): escribir por los endpoints por ítem.
- `/identity` puede devolver `dropped_references`.
- `ENABLE_GDPR` y `ENABLE_CONCURRENCY_CONTROL` tienen que coincidir con los del backend
  (`/api/health` muestra los efectivos).
- Orden de despliegue: frontend primero cuando el servidor endurece un contrato; servidor primero
  cuando el cliente empieza a mandar algo que uno viejo rechaza.

## Git

`master` (prod) · `develop` (dev, desplegado en `isoqf-test`) · ramas `feature/*`/`fix/*` → merge
`--no-ff` a `develop`.
