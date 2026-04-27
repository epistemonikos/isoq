# iSoQ Web

## RULES [non-negotiable]
1. npm only (no yarn/pnpm)
2. npm run test → implement → npm run test
3. ALL user strings via $t('key') + add to en.json + es.json + pt.json

---

## STACK
Vue 2.6.12 · Vuex · Vue Router (hash) · Bootstrap-Vue 2.23.1 · Webpack 4 · Axios · Dexie 3.2.7 · vue-i18n 8.28.2 · Node>=14

## DEV
```
docker compose up → start isoq_server(:8080) → nvm use 14 && npm run dev
```
frontend: http://episte.lo:8090 · proxy→localhost:8080 · gzip:ON(prod)

---

## DATA MODEL
```
isoqf_projects
  ├─ isoqf_references
  ├─ isoqf_list_categories
  ├─ isoqf_lists (finding container)
  │    └─ isoqf_findings (evidence_profile: methodological_limitations|coherence|adequacy|relevance|cerqual)
  │         └─ isoqf_extracted_data (1 row per reference)
  ├─ isoqf_characteristics (step3)
  └─ isoqf_assessments (step4)
```
`use_camelot:bool` on project → changes step3/step4 behavior

---

## COMPONENTS → ROUTES
```
project/viewProject.vue          /workspace/:org_id/isoqf/:id     main project (4 steps)
project/propertiesProject.vue    tab0 of viewProject               metadata form
project/UploadReferences.vue     step1                             RIS/BibTeX/PubMed import
project/InclusionExclusionCriteria.vue  step2                      inclusion/exclusion text
project/crudTables.vue           step3+4 (non-camelot)             custom fields table
camelot/StepThree.vue            step3 (camelot)                   predefined domains
camelot/StepFour.vue             step4 (camelot)                   methodological questions
list/editList.vue                /worksheet/:id/edit               evidence profile editor
list/evidenceProfileForm.vue     modal in editList                 cerqual form
list/editListExtractedData.vue   inside editList                   extracted data per ref
project/actionButtons.vue        inside viewProject                publish/share
project/ViewTable.vue            organization view                 findings list
previewContent/previewContentSoQf.vue      /preview/isoq/:org_id/:isoqf_id/:token
previewContent/previewContentWorksheet.vue /preview/worksheet/:id/:token
```

---

## API ENDPOINTS
```
POST   /isoqf_projects                    create project
PATCH  /isoqf_projects/:id                update project
POST   /isoqf_references                  add references
GET    /isoqf_references?project_id=:id   get references
POST   /isoqf_characteristics             add char field
PATCH  /isoqf_characteristics/:id         update char data
POST   /isoqf_assessments                 add assessment field
PATCH  /isoqf_assessments/:id             update assessment
POST   /isoqf_lists                       create finding
PATCH  /isoqf_lists/:id                   update finding/evidence profile
POST   /isoqf_findings                    create finding data
PATCH  /isoqf_findings/:id                update finding
POST   /isoqf_extracted_data              add extracted data
PATCH  /isoqf_extracted_data/:id          update extracted data
GET    /api/project/can_publish           validate publish requirements
PATCH  /api/publish                       publish/unpublish
```
Always use `Api` class (src/utils/Api.js), not raw axios. GET→cached IndexedDB. POST/PUT/PATCH/DELETE→queued offline.

---

## PUBLISH FLOW
```
actionButtons.vue
  → Project.validations() [src/utils/project.js]
      checks: name(3+) · authors · author(3+) · author_email · review_question(3+)
              license_type(if public) · complete_by_author · lists_authors(if !complete_by_author)
              url_doi(if published_status, must be valid URL)
  → GET /api/project/can_publish [isoq_server/auth_server/controllers/core.py]
      checkIfHaveReferences()        ≥1 reference
      checkIfAListHasReferences()    ≥1 list with references
      checkIfAListHasCerqual()       ≥1 list with cerqual.explanation
  → PATCH /api/publish → propagates permissions to all related entities
```
evidence_profile fields: options 0-3 (no/minor/moderate/serious), cerqual: 0-3 (high/moderate/low/verylow)

---

## AUTH & ROUTING
- beforeEach → store.dispatch('getLogginInfo') → checks meta.requiresAuth
- no JWT · session cookies + localStorage(l_s=token, user-data=offline fallback)
- login redirect: query.redirect=to.fullPath
- isOnline: state.isOnline via window events, accessible as this.isOnline (global mixin)

---

## GOTCHAS
- Webpack 4 · webpack.config.js at root = compat wrapper only
- Vue 2 Options API · this.$http(axios) · this.$router · this.$store · no <script setup>
- Bootstrap 4.6.2 · <b-table> <b-modal> <b-form-*> · icons via @fortawesome/vue-fontawesome (main.js)
- Translation.js has legacy :lang URL logic but current routes have NO language prefixes
- Lazy load all route components: () => import(/* webpackChunkName: "x" */ '@/components/...')
- All store mutations via Vuex actions/mutations · never mutate this.$store.state directly

---

## GIT
master(prod) · develop(dev) · feature branches → PR to develop → PR to master
