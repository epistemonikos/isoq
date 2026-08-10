# iSoQ Web

## RULES [non-negotiable]
1. npm only
2. npm run test → implement → npm run test
3. ALL user strings: $t('key') + en.json + es.json + pt.json

---

## STACK
Vue 2.6.12 · Vuex 3.6.2 · Vue Router 3.6.5 hash · Bootstrap-Vue 2.23.1 · Webpack 4 · Axios 1.7.9 · Dexie 3.2.7 · vue-i18n 8.28.2 · Sentry @sentry/vue ^7 · Node>=14 · v1.2.8

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

Pendiente con backend: confirmar que no tengan consumidores server-side de `isoqf_id` (exports, vista
compartida). Si los tienen, seguimos escribiéndolo hasta que migren — el frontend igual no lo lee.
Después, limpiarlo de la base.

Antecedente de por qué la regla es tan tajante: hubo **cuatro** atributos compitiendo por este número, y
tres sitios ya lo leían del objeto equivocado (una lista en vez de un finding) mostrando vacío o `NaN`.

---

## KEY FILES
```
src/utils/Api.js               HTTP client + offline queue + 409 lock interceptor
src/utils/project.js           Project.validations() for publish
src/store/store.js             Vuex · getLogginInfo action · isOnline state
src/services/lockService.js    concurrency — acquire/release/heartbeat(5min)/idle(15min)
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
lockService: acquire on viewProject enter, release on leave, heartbeat POST /api/lock/:id/heartbeat every 5min, idle timeout 15min

---

## OFFLINE/PWA
isOnline: `state.isOnline` via window events → `this.isOnline` (global mixin)
Offline: Api queues POST/PATCH/DELETE → replays on reconnect · Service Worker via workbox

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
