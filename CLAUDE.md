# iSoQ Web

## RULES [non-negotiable]
1. npm only
2. npm run test → implement → npm run test
3. ALL user strings: $t('key') + en.json + es.json + pt.json

---

## STACK
Vue 2.7.16 (package.json pide ^2.6.12) · Vuex 3.6.2 · Vue Router 3.6.5 hash · Bootstrap-Vue 2.23.1 · Webpack 4 · Axios 1.7.9 · Dexie 3.2.7 · vue-i18n 8.28.2 · Sentry @sentry/vue ^7 · Node>=14 · v1.2.8

---

## MUST-USE PATTERNS
- HTTP: always `Api` class (`src/utils/Api.js`), never raw axios — GET=IndexedDB-cached, mutations=offline-queued
- State: Vuex actions/mutations only, never `this.$store.state.x = y`
- Routes: lazy load `() => import(/* webpackChunkName: "x" */ '@/components/...')`
- Auth guard: `meta.requiresAuth` · `meta.requiresAdmin` (checks `user.flags`: superadmin|support)
- Options API only — no `<script setup>`, no Composition API in components
- Icons: `@fortawesome/vue-fontawesome` registered in main.js
- i18n files: `src/lang/{en,es,pt}.json`

---

## DATA MODEL
```
isoqf_projects (use_camelot:bool → changes step3/4)
  ├─ isoqf_references
  ├─ isoqf_list_categories
  ├─ isoqf_lists
  │    └─ isoqf_findings  (evidence_profile: methodological_limitations|coherence|adequacy|relevance|cerqual)
  │         └─ isoqf_extracted_data  (1 row/reference)
  ├─ isoqf_characteristics  (step3)
  └─ isoqf_assessments      (step4)
```
evidence_profile options 0-3: no/minor/moderate/serious · cerqual 0-3: high/moderate/low/verylow

---

## NÚMERO DEL FINDING (el "#" / "No.")

**Es POSICIÓN, no identidad, y se DERIVA al vuelo. Nunca se lee de la DB para mostrar.**

Regla única: posición = índice + 1 sobre la colección ordenada (`Commons.sortFindings`, que ordena por
categoría y luego por `sort`). Vale igual para la visualización y para los exportables.

Un solo campo persistido, con un rol único: **`isoqf_lists.sort` = el orden que el usuario eligió** con
el modal de arrastrar. No es el número; es de dónde se deriva el número. No se puede sacar: es el único
lugar donde vive ese orden.

Cero campos persistidos para el número. `isoqf_findings.isoqf_id` y
`isoqf_findings.evidence_profile.isoqf_id` son espejos legados: **no escribir en proyectos nuevos, no
leer nunca**. Los proyectos viejos los conservan como dato muerto; no hace falta migrarlos justamente
porque nadie los lee. `list.cnt` no existe más.

Consecuencias al tocar esto:
- Toda vista que muestre el # necesita **listas + categorías** para derivarlo. Sin categorías la
  agrupación cambia y el número sale distinto que en el resto de la app.
- Los exportables usan **una sola** precedencia: la posición derivada. Prohibido caer a `id`
  (es un ObjectId) o a literales tipo `'1'` — un número plausible pero falso en un documento que
  alguien va a citar es peor que un vacío.
- No reimplementar la regla: si necesitás el número en un componente nuevo, usá la función compartida.
  Ya estuvo duplicada (`sortFindings` + un bucle `cnt` propio) y produjo numeraciones distintas.

Por qué importa: los usuarios coordinan con este número ("yo trabajo en el finding 3, tú en el 4").
Si dos vistas muestran números distintos para el mismo finding, trabajan sobre el equivocado.

Backend confirmó (2026-08-06) que **no hay consumidores server-side de `isoqf_id`**: no está en ningún
esquema ni whitelist, y la relación finding→proyecto se resuelve siempre por `list_id`. Falta sólo
limpiarlo de la base. Hay un motivo para hacerlo: la clonación de proyectos copia el finding entero y
sólo remapea `list_id`, así que un `isoqf_id` residual queda apuntando al proyecto original.

`POST /finding/remove` renumera `isoqf_lists.sort` denso 1..N tras borrar. `isoqf_findings` no tiene
campo `sort`.

Antecedente de por qué la regla es tan tajante: hubo **cuatro** atributos compitiendo por este número, y
tres sitios ya lo leían del objeto equivocado (una lista en vez de un finding) mostrando vacío o `NaN`.

---

## KEY FILES
```
src/utils/Api.js               HTTP client + offline queue + 409 lock interceptor
src/utils/project.js           Project.validations() for publish
src/store/store.js             Vuex · getLogginInfo action · isOnline state
src/services/lockService.js    concurrency — acquire/release/heartbeat(30s)/idle(15min)
src/services/db.js             Dexie schema for offline cache
src/strategies/exportStrategies.js  CSV/Word export (45KB)
src/services/wordExportService.js / risExportService.js
src/plugins/Translation.js     legacy :lang logic — current routes have NO lang prefixes
```

---

## PUBLISH FLOW
```
actionButtons.vue
  → Project.validations(): name≥3 · authors · author≥3 · author_email · review_question≥3
      · license_type(if public) · complete_by_author · lists_authors(if !complete_by_author)
      · url_doi(if published_status → must be valid URL)
  → GET /api/project/can_publish: ≥1 ref · ≥1 list w/refs · ≥1 list w/cerqual.explanation
  → PATCH /api/publish
```

---

## CONCURRENCY
409 from any endpoint → Api.js interceptor → "locked by user X" modal
lockService: acquire on viewProject enter, release on leave, heartbeat POST /api/lock/:id/heartbeat every 30s (`HEARBEAT_INTERVAL`, lockService.js:6), idle timeout 15min

### El TTL del servidor y el latido del cliente son UN SOLO contrato

`LOCK_TIMEOUT` = **180 s** en el backend (`auth_server/controllers/lock.py`, mismo valor para
`project_locks` y `ref_locks`) contra `HEARBEAT_INTERVAL` = 30 s acá. No son dos números
independientes: el TTL está dimensionado para **tolerar tres latidos perdidos**.

Por qué hizo falta ese margen: Chrome ralentiza `setInterval` en pestañas ocultas y, tras ~5
minutos, lo lleva a **un disparo por minuto**. Con el TTL viejo de 60 s el lock caducaba con el
editor abierto y la persona dentro de la sesión, y otro usuario lo tomaba legítimamente.

**Si alguna vez cambiás `HEARBEAT_INTERVAL`, avisale a backend**: sus tests miden el margen contra
este intervalo, no contra el literal 180.

No hay liberación por inactividad para los ref-locks. El `IDLE_TIMEOUT` de 15 min sólo cuelga de
`acquire()` (lock de proyecto, hoy únicamente en Propiedades / viewOrganization).

`revalidateLocks()` late apenas la pestaña vuelve al frente (`visibilitychange`): es el momento en
que la persona va a escribir, y sin eso el aviso de pérdida podía tardar hasta un ciclo entero.

Un heartbeat sobre un lock **vencido** lo revive a propósito — es lo que salva a quien estuvo
throttleado — salvo que otro tenga el mismo estudio en otra granularidad, y ahí devuelve 409.

Ese 409 trae **tres `reason` distintos** (desde 2026-08-26), y la diferencia que le importa a la
persona no es quién tiene el lock: es **si va a poder seguir**.

| `reason` | qué pasó | `locked_by` | ¿se destraba solo? |
|---|---|---|---|
| `evicted_granularity_conflict` | otro tiene otra granularidad del mismo estudio y el desempate por antigüedad nos desalojó | sí | **sí**, cuando suelte |
| `locked_by_other_user` | lo tomaron | sí | no |
| `lock_expired` | caducó, o nunca se tomó | no | no |

`reason` y `locked_by` viajan en el `detail` de `ref-lock-lost`. **La regla de qué cartel corresponde
vive en `src/utils/lockLostMessage.js`** y no en cada handler: son siete los que lo muestran.

El **acquire** tiene sus propios dos motivos, y el de granularidad es un valor **distinto** a
propósito: ahí la persona nunca tuvo el lock, así que el cartel no explica una pérdida sino si vale
esperar. `lockDeniedMessageKey()` los mapea.

| `reason` del acquire | qué pasó | `locked_by` |
|---|---|---|
| `locked_at_another_granularity` | otro tiene otra granularidad del mismo estudio | sí |
| `locked_by_other_user` | la misma clave, tomada por otra persona | sí |

Dos cosas que no hay que romper. El chequeo es una **allowlist** (`VERSION_REASONS` en
`lockErrors.js`, y las comparaciones de `lockLostMessage.js`): un `reason` que este cliente no
conozca cae por default en el comportamiento anterior. Escrito al revés —una denylist— cualquier
motivo nuevo del servidor caería en la rama equivocada, y ya hubo tres altas de motivos en una
semana. Y **la cadencia del latido sostiene una promesa de interfaz**: el texto de
`evicted_granularity_conflict` dice «podrás seguir en cuanto termine», así que un ciclo más largo que
el desalojo convertiría ese cartel en mentira. Son dos razones independientes para no subir
`HEARBEAT_INTERVAL`; la otra es el bloqueo mutuo.

### Lo que el servidor puede atrapar, y lo que no

Backend instrumenta con warnings los datos que **le mandamos** y que dejamos caer: el contador `_v`
ausente en una escritura por ítem, las filas que pierden `stages` en una escritura genérica. Si un
camino nuestro los pierde, aparece en sus logs.

**Los campos de respuesta no tienen esa red.** Lo que hagamos con un `reason`, un `_v` devuelto o un
`item` fresco del 409 les es invisible: sale del servidor y ahí termina lo que pueden ver.

> El servidor puede instrumentar lo que el cliente le manda, nunca lo que el cliente descarta.

Ya pasó tres veces en el mismo tramo, y las tres fueron la misma cosa —un dato que llegaba y se perdía
en el camino—: el cuerpo de la respuesta con el `_v` nuevo, `stages` en la reconstrucción de la fila, y
el `reason` en el reintento de la cola offline. Las dos primeras las habría atrapado un warning suyo.
La tercera, ninguno.

Así que para todo campo de respuesta la única red es un test de este lado, y tiene que comprobar **que
el camino no se pierda**, no que un valor esté bien. El patrón está en `lockErrors.spec.js`: entre los
casos hay un `un_motivo_que_todavia_no_existe`, que no verifica ningún valor real — verifica que un
motivo desconocido siga cayendo en la rama correcta.

### Perder el lock tiene que ser visible

Un editor en solo lectura y mudo es peor que uno bloqueado: la gente sigue escribiendo. Todo editor
que sostenga un ref-lock escucha `ref-lock-lost` y muestra un cartel — evidence profile (incluida su
fila inline), assessment del Paso 4, editor de estudios del Paso 3, filas de `crudTables`.

El 409/403 de una escritura granular **ya se le avisa al usuario** por el canal de conflicto. No le
agregues encima el error genérico de guardado: usá `isLockRejection()` (`src/utils/lockErrors.js`)
antes de notificar. "Intente nuevamente" es un consejo falso mientras el lock sea de otra persona.

---

## OFFLINE/PWA
isOnline: `state.isOnline` via window events → `this.isOnline` (global mixin)
Offline: Api queues POST/PATCH/DELETE → replays on reconnect · Service Worker via workbox

---

## SCROLL AL GUARDAR

`main.js:117` tiene `scrollBehavior: () => ({x: 0, y: 0})` **incondicional**: ignora el `savedPosition`
que vue-router le pasa. Consecuencia que no es obvia: **cualquier** `$router.push`, incluso uno que
sólo cambia el `query` o el `hash` de la vista actual, manda la página al tope. No agregues
navegaciones "inocuas" para reflejar estado en la URL — son un salto al tope garantizado.

Al recargar una tabla, el salto tiene una segunda causa independiente: el slot `table-busy` de
Bootstrap-Vue reemplaza el `tbody` completo, el documento se acorta y el navegador **clampea** la
posición del usuario. Un `scrollTo` inmediato se pierde en silencio.

Para eso está `src/mixins/preserveScrollMixin.js` (`holdScrollPosition()`): insiste con la posición
durante ~600ms de frames hasta que el contenido vuelve, y cede si el usuario scrollea (`wheel`,
`touchmove`). Llamalo antes de disparar la recarga; desde `mounted` es no-op. Ya está en `getData()`
de `crudTables.vue` y en `getList()` de `editList.vue`.

No se puede testear en jsdom que la posición aterrice (no hay layout, `scrollTo` no mueve
`pageYOffset`): los specs fijan el protocolo de reintento. **Verificá en navegador.**

---

## GOTCHAS
- webpack.config.js at root = compat wrapper only (real config in build/)
- Bootstrap 4.6.2 — use `<b-table>` `<b-modal>` `<b-form-*>`
- Translation.js has legacy :lang URL logic — ignore it, no lang prefixes in routes
- Sentry init in main.js lines 119-133; user identity set in store after login
- `src/composables/` is Vue 3 composables pattern adapted for Vue 2 (plain JS reactivity)
- Cypress installed but not wired into CI

---

## GIT
master(prod) · develop(dev) · feature → PR→develop → PR→master
