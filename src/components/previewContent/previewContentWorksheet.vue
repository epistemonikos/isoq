<template>
  <div>
    <b-container>
      <LoadErrorAlert :parts="failedLoadParts" @retry="retryFailedLoads" />
    </b-container>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <b-row>
          <b-col cols="12" class="text-right d-print-none">
            <b-link class="return" :to="returnLinkTarget">
              <font-awesome-icon icon="long-arrow-alt-left" :title="$t('common.back')" />
              {{ $t('worksheet_nav.return_isoq') }}
            </b-link>
          </b-col>
        </b-row>
        <h2 class="toDoc font-weight-bold pb-2">{{ $t('worksheet.grade_cerqual_worksheet') }}</h2>
      </b-container>
    </b-container>
    <b-container>
      <b-row class="d-print-none justify-content-end mb-2 pt-2">
        <b-col cols="12" md="4">
          <b-button id="exportButton" variant="outline-secondary" block @click="exportToWord()">
            {{ $t('worksheet.export_ms_word') }}
          </b-button>
        </b-col>
        <b-col cols="12" md="4" class="mt-2 mt-md-0">
          <b-button id="printButton" @click="print" variant="outline-info" block>
            {{ $t('actionButtons.print_save_pdf') }}
          </b-button>
        </b-col>
      </b-row>
      <b-row class="mt-4">
        <b-col cols="12">
          <evidence-profile :evidenceProfile="evidence_profile" :ui="ui"
            :evidenceProfileTableSettings="evidence_profile_table_settings" :references="references" mode="view"
            :list="list" :refsWithTitle="[]" :project="{}" :permission="true" :selectOptions="select_options"
            :levelConfidence="level_confidence" :findings="{}" :methAssessments="meth_assessments"
            :extractedData="extracted_data" :showEditExtractedDataInPlace="{}" :modalData="modalData()"
            :charsOfStudies="characteristics_studies"></evidence-profile>
          <template v-if="canViewDetails">
            <div v-if="project.use_camelot">
              <h4>{{ $t('worksheet.characteristics_of_studies') }}</h4>
              <camelot-characteristics-table-preview :charsOfStudies="characteristics_studies"
                :references="camelot_references">
              </camelot-characteristics-table-preview>
            </div>
            <div
              v-else-if="!project.use_camelot && characteristics_studies.items && characteristics_studies.items.length">
              <chars-of-studies :ui="ui" :show="show" :mode="'view'" :list="list" :permission="true"
                :charsOfStudies="characteristics_studies" :refsWithTitle="[]"></chars-of-studies>
            </div>

            <div v-if="project.use_camelot">
              <h4>{{ $t('worksheet.methodological_assessments') }}</h4>
              <camelot-assessments-table-preview :methodologicalTableRefs="meth_assessments"
                :references="camelot_references">
              </camelot-assessments-table-preview>
            </div>
            <div v-else-if="!project.use_camelot && meth_assessments.items && meth_assessments.items.length">
              <methodological-assessments :ui="ui" :show="show" :mode="'view'" :list="list" :permission="true"
                :methAssessments="meth_assessments" :refsWithTitle="[]"></methodological-assessments>
            </div>

            <div>
              <extracted-data :ui="ui" :show="show" :mode="'view'" :list="list" :permission="true"
                :extractedData="extracted_data" :modePrintFieldObject="mode_print_fieldsObj"
                :refsWithTitle="[]"></extracted-data>
            </div>
          </template>
          <div v-if="list.is_public">
            <div class="mt-5 alert alert-info" role="alert">
              <h5>{{ $t('project.license_type') }}</h5>
              <p>{{ theLicense(list.license_type) }}</p>
            </div>
          </div>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import LoadErrorAlert from '@/components/LoadErrorAlert.vue'
import backToTop from '../backToTop'
import { exportToWord } from '@/services/wordExportService'
import evidenceProfile from '../list/editListEvidenceProfile.vue'
import charsOfStudies from '../list/editListCharsOfStudies.vue'
import methAssessments from '../list/editListMethAssessments.vue'
import extractedData from '../list/editListExtractedData.vue'
import Commons from '../../utils/commons'
import { camelotMixin } from '@/mixins/camelotMixin'
import PublicPreviewAccess from '@/utils/publicPreviewAccess'
import { ITEM_METADATA_KEYS } from '@/utils/itemMetadata'
import { withDerivedRows } from '@/utils/derivedRows'
import { sortByAuthors, sortByStudyLabel } from '@/utils/tableDataUtils'

const camelotCharacteristicsTablePreview = () => import(/* webpackChunkName: "camelotcharacteristicstablepreview" */'../camelot/preview/CamelotCharacteristicsTablePreview.vue')
const camelotAssessmentsTablePreview = () => import(/* webpackChunkName: "camelotassessmentstablepreview" */'../camelot/preview/CamelotAssessmentsTablePreview.vue')

export default {
  mixins: [camelotMixin],
  components: {
    LoadErrorAlert,
    'back-to-top': backToTop,
    'evidence-profile': evidenceProfile,
    'chars-of-studies': charsOfStudies,
    'methodological-assessments': methAssessments,
    'extracted-data': extractedData,
    'camelot-characteristics-table-preview': camelotCharacteristicsTablePreview,
    'camelot-assessments-table-preview': camelotAssessmentsTablePreview
  },
  data () {
    return {
      // Qué cargas fallaron: la worksheet compartida se veía incompleta y así se exportaba a Word.
      loadErrors: { finding: false, categories: false, references: false, evidence: false, extracted: false, characteristics: false, assessments: false },
      ui: {
        methodological_assessments: {
          display_warning: true
        },
        coherence: {
          display_warning: true
        },
        adequacy: {
          extracted_data: {
            display_warning: true
          },
          chars_of_studies: {
            display_warning: true
          }
        },
        relevance: {
          chars_of_studies: {
            display_warning: true
          }
        },
        showExample: false
      },
      project: {
        inclusion: '',
        exclusion: '',
        review_question: ''
      },
      list: {
        id: '',
        title: '',
        description: '',
        authors: '',
        private: false,
        sources: [],
        extracted_data: {
          fields: [],
          items: []
        },
        cerqual: { option: null },
        references: []
      },
      evidence_profile: [
        {
          displayNumber: null,
          cerqual: { explanation: '', option: 0 },
          name: '',
          title: '',
          notes: '',
          coherence: { explanation: '', option: 0 },
          methodological_limitations: { explanation: '', option: 0 },
          references: [],
          relevance: { explanation: '', option: 0 },
          adequacy: { explanation: '', option: 0 }
        }
      ],
      evidence_profile_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100],
        isBusy: false
      },
      characteristics_studies: {
        fields: [],
        items: []
      },
      characteristics_studies_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100],
        last_column: 0
      },
      meth_assessments: {
        nroOfColumns: 1,
        fields: [],
        items: []
      },
      methodological_assessments_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100]
      },
      extracted_data: {
        id: null,
        fields: [],
        items: [],
        fieldsObj: []
      },
      extracted_data_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100]
      },
      references: [],
      camelot_references: [],
      project_references: []
    }
  },
  computed: {
    failedLoadParts () {
      return Object.keys(this.loadErrors).filter(part => this.loadErrors[part])
    },
    evidence_profile_fields_print_version: function () {
      return [
        { key: 'displayNumber', label: '#' },
        { key: 'name', label: this.$t('table_head.summarised_finding') },
        { key: 'methodological-limit', label: this.$t('worksheet.methodological_limitations') },
        { key: 'coherence', label: this.$t('worksheet.coherence') },
        { key: 'adequacy', label: this.$t('worksheet.adequacy') },
        { key: 'relevance', label: this.$t('worksheet.relevance') },
        { key: 'cerqual', label: this.$t('soqf_table.print_confidence') },
        {
          key: 'references',
          label: this.$t('table_head.references'),
          formatter: value => {
            // `value` viene en el orden en que se marcaron las casillas: sin ordenar, el
            // estudio agregado después quedaba último.
            const refs = this.references.filter(reference => value.includes(reference.id))
            return sortByStudyLabel(refs, reference => reference.content)
              .map(reference => reference.content)
              .join('')
          }
        }
      ]
    },
    show: function () {
      return {
        selected: ['cs', 'ma', 'ed'],
        options: [
          { text: this.$t('worksheet.characteristics_of_studies'), value: 'cs' },
          { text: this.$t('worksheet.methodological_assessments'), value: 'ma' },
          { text: this.$t('worksheet.extracted_data'), value: 'ed' }
        ]
      }
    },
    mode_print_fieldsObj: function () {
      return [
        { key: 'authors', label: this.$t('references.author_year') },
        { key: 'column_0', label: this.$t('table_headers.extracted_data') }
      ]
    },
    select_options: function () {
      return [
        { value: 0, text: this.$t('cerqual_options.no_very_minor_concerns') },
        { value: 1, text: this.$t('cerqual_options.minor_concerns') },
        { value: 2, text: this.$t('cerqual_options.moderate_concerns') },
        { value: 3, text: this.$t('cerqual_options.serious_concerns') },
        { value: null, text: this.$t('cerqual_options.undefined') }
      ]
    },
    level_confidence: function () {
      return [
        { value: 0, text: this.$t('cerqual_options.high_confidence') },
        { value: 1, text: this.$t('cerqual_options.moderate_confidence') },
        { value: 2, text: this.$t('cerqual_options.low_confidence') },
        { value: 3, text: this.$t('cerqual_options.very_low_confidence') },
        { value: null, text: this.$t('cerqual_options.undefined') }
      ]
    },
    returnLinkTarget: function () {
      return PublicPreviewAccess.resolveReturnRoute({
        token: this.$route.params.token,
        project: this.project
      })
    },
    canViewDetails: function () {
      return PublicPreviewAccess.canViewDetailedSections({
        token: this.$route.params.token,
        publicType: this.project.public_type
      })
    }
  },
  mounted () {
    this.validateAndLoadProject()
  },
  methods: {
    modalData: function () {
      const data = {
        'methodological_limitations': {
          'option': null,
          'example': '',
          'explanation': '',
          'notes': '',
          'title': ''
        },
        'coherence': {
          'option': null,
          'example': '',
          'explanation': '',
          'notes': '',
          'title': ''
        },
        'adequacy': {
          'option': null,
          'example': '',
          'explanation': '',
          'notes': '',
          'title': ''
        },
        'relevance': {
          'option': null,
          'example': '',
          'explanation': '',
          'notes': '',
          'title': ''
        },
        'cerqual': {
          'option': null,
          'example': '',
          'explanation': '',
          'notes': '',
          'title': ''
        },
        'type': '',
        'title ': ''
      }
      return data
    },
    shouldUseSharedUrl: function () {
      return PublicPreviewAccess.isSharedLinkToken(this.$route.params.token)
    },
    getSharedUrl: function (basePath) {
      if (this.shouldUseSharedUrl()) {
        return `/api/shared/${this.$route.params.token}${basePath}`
      }
      return basePath
    },
    validateAndLoadProject: function () {
      const token = this.$route.params.token
      const projectId = this.$route.params.projectId

      if (!token || !projectId) {
        this.$router.push({ name: 'MainPage' })
        return
      }

      const url = this.getSharedUrl('/isoqf_projects')
      const idParam = this.shouldUseSharedUrl() ? 'project_id' : 'id'
      Api.get(url, { [idParam]: projectId })
        .then((response) => {
          const projects = Array.isArray(response.data) ? response.data : [response.data]
          if (projects.length > 0) {
            this.project = projects[0]
            if (!PublicPreviewAccess.isAuthorized({ token, publicType: this.project.public_type })) {
              this.$router.push({ name: 'MainPage' })
              return
            }
            this.getList()
          } else {
            this.$bvToast.toast(this.$t('shared.resource_not_found'), {
              title: this.$t('common.warning'),
              variant: 'danger',
              solid: true,
              toaster: 'b-toaster-top-center'
            })
            setTimeout(() => { this.$router.push({ name: 'MainPage' }) }, 2000)
          }
        })
        .catch((error) => {
          let errorMessage = this.$t('shared.link_invalid')
          if (error.response) {
            const status = error.response.status
            if (status === 403) {
              errorMessage = this.$t('shared.access_denied')
            }
          }
          this.$bvToast.toast(errorMessage, {
            title: this.$t('common.warning'),
            variant: 'danger',
            solid: true,
            toaster: 'b-toaster-top-center'
          })
          setTimeout(() => { this.$router.push({ name: 'MainPage' }) }, 2000)
        })
    },
    getList: function (fromModal = false) {
      if (!this.project || !this.project.id) return

      const projectId = this.project.id
      const listId = this.$route.params.id
      const url = this.getSharedUrl('/isoqf_lists')
      const params = { project_id: projectId }
      // sortFindings agrupa por categoría: sin ellas el número derivado no coincide
      // con el que muestra el resto de la app.
      const catUrl = this.getSharedUrl('/isoqf_list_categories')

      Promise.all([
        Api.get(url, params),
        Api.get(catUrl, params).then((r) => { this.loadErrors.categories = false; return r }).catch((error) => {
          // Swallow so the chain survives without categories rather than breaking the
          // worksheet entirely — but it must not go unreported: `printErrors` alone did not
          // show anything, so the sort-only fallback numbering went by silently.
          this.printErrors(error)
          this.loadErrors.categories = true
          return { data: [] }
        })
      ])
        .then(([response, catResponse]) => {
          this.loadErrors.finding = false
          let lists = Array.isArray(response.data) ? response.data : [response.data]
          const categories = Array.isArray(catResponse.data)
            ? catResponse.data
            : (catResponse.data.options || [])
          const sorted = Commons.sortFindings(lists, categories)
          const foundList = sorted.find(l => l.id === listId)
          this.list = foundList ? JSON.parse(JSON.stringify(foundList)) : {}
          this.list.sources = []
          this.evidence_profile = []
          this.extracted_data = {
            fields: [],
            items: []
          }
          this.getAllReferences()
          this.getStageOneData(fromModal)
          this.getCharsOfStudies()
          this.getMethAssessments()
          this.evidence_profile_table_settings.isBusy = false
          window.scrollTo({ top: 0, behavior: 'smooth' })
        })
        .catch((error) => {
          this.loadErrors.finding = true
          this.printErrors(error)
        })
    },
    /**
     * Vuelve a pedir sólo lo que falló. Sin el finding o sin sus grupos se rehace todo
     * (`getList` encadena el resto); el resto se pide por separado.
     */
    retryFailedLoads: function () {
      const e = this.loadErrors
      if (e.finding || e.categories) return this.getList()
      if (e.references) this.getAllReferences()
      if (e.evidence) this.getStageOneData()
      else if (e.extracted) this.getExtractedData()
      if (e.characteristics) this.getCharsOfStudies()
      if (e.assessments) this.getMethAssessments()
    },
    getAllReferences: function () {
      const url = this.getSharedUrl(`/isoqf_references?project_id=${this.list.project_id}`)
      this.$_referencesRequest = Api.get(url)
        .then((response) => {
          this.loadErrors.references = false
          let _references = response.data
          this.project_references = Array.isArray(_references) ? _references : []
          let _refs = []
          let _refsWithTitles = []
          for (let reference of _references) {
            _refs.push({'id': reference.id, 'content': this.parseReference(reference, true)})
            _refsWithTitles.push({'id': reference.id, 'content': this.parseReference(reference, false)})
          }

          // Antes `sort((a, b) => a.id - b.id)`: los ids son strings hex, la resta da NaN y el
          // sort no hacía nada. El orden útil es el de la etiqueta que se lee.
          this.references = sortByStudyLabel(_refs, ref => ref.content)
          this.refsWithTitle = sortByStudyLabel(_refsWithTitles, ref => ref.content)
          this.camelot_references = sortByStudyLabel(
            _references.filter(reference => this.list.references.some(refId => String(refId) === String(reference.id))),
            reference => this.parseReference(reference, true)
          )
        })
        .catch((error) => {
          this.loadErrors.references = true
          this.printErrors(error)
        })
      return this.$_referencesRequest
    },
    /**
     * Las tablas resuelven el autor de cada estudio con las referencias del proyecto, así
     * que esperan a que lleguen: si no, el resultado dependería de qué request respondiera
     * primero. Nunca rechaza: sin referencias la tabla se arma igual, como antes.
     */
    referencesLoaded: function () {
      return this.$_referencesRequest || Promise.resolve()
    },
    /**
     * Las referencias completas con las que se resuelve el autor de cada fila.
     *
     * La preview pide la lista por la ruta genérica, que NO trae `fullreferences`, así que
     * el autor de un estudio sin fila guardada —justamente el que se agregó después— no se
     * resolvía y la fila salía en blanco. Se usan las del proyecto, que ya se piden para la
     * celda References; `fullreferences` manda si viene.
     */
    bibliographicReferences: function () {
      const full = this.list.fullreferences
      if (typeof full === 'string') {
        try {
          return JSON.parse(full)
        } catch (e) {
          console.error('Error parsing fullreferences', e)
        }
      } else if (Array.isArray(full) && full.length) {
        return full
      }
      return this.project_references
    },
    getStageOneData: function (fromModal = false) {
      const url = this.getSharedUrl('/isoqf_findings')
      let params = {
        list_id: this.list.id
      }
      Api.get(url, params)
        .then((response) => {
          this.loadErrors.evidence = false
          if (response.data.length) {
            this.findings = JSON.parse(JSON.stringify(response.data[0]))
            this.evidence_profile = []
            if (Object.prototype.hasOwnProperty.call(this.findings, 'evidence_profile')) {
              this.evidence_profile.push({
                ...this.findings.evidence_profile,
                // El endpoint de identidad escribe las referencias sólo en la lista: la
                // copia del finding queda vieja y no traía los estudios agregados después.
                // Igual que `editList`.
                references: this.list.references || [],
                displayNumber: this.list.displayNumber
              })
            }
            if (fromModal) {
              const title = this.buffer_modal_stage_two.title
              const type = this.buffer_modal_stage_two.type
              this.buffer_modal_stage_two = this.evidence_profile[0]
              this.buffer_modal_stage_two.title = title
              this.buffer_modal_stage_two.type = type
            }
          }
          // this.getStatus()
          this.getExtractedData()
          this.evidence_profile_table_settings.isBusy = false
        }).catch((error) => {
          this.loadErrors.evidence = true
          this.printErrors(error)
        })
    },
    getExtractedData: function () {
      const url = this.getSharedUrl('/isoqf_extracted_data')
      let params = {
        finding_id: this.findings.id
      }

      return Promise.all([Api.get(url, params), this.referencesLoaded()])
        .then(([response]) => {
          this.loadErrors.extracted = false
          this.extracted_data = {id: null, fields: [], items: []}
          if (response.data.length) {
            this.extracted_data = response.data[0]
            this.extracted_data.fields.push({key: 'actions', label: ''})
            let _fields = JSON.parse(JSON.stringify(this.extracted_data.fields))
            this.extracted_data.fieldsObj = []
            for (let field of _fields) {
              if (field.key !== 'ref_id') {
                this.extracted_data.fieldsObj.push(field)
                if (field.key !== 'actions') {
                  this.mode_print_fieldsObj.push(field)
                }
              }
            }

            const _references = this.list.references
            let _items = []
            let extractedDataItems = JSON.parse(JSON.stringify(this.extracted_data.items))
            this.extracted_data.original_items = extractedDataItems
            let haveContent = 0
            // Left-join sobre las referencias del finding, no sobre los ítems: un estudio
            // sin fila en el documento tiene que aparecer igual. Esta vista es de sólo
            // lectura —shared link, impresión— así que nadie puede sembrarla desde acá, y
            // sin esto el estudio faltaba tanto en la pantalla como en el export Word, que
            // sale de estos mismos datos.
            const bibRefs = this.bibliographicReferences()
            const conDerivadas = withDerivedRows(extractedDataItems, _references, (refId) => {
              const bibRef = bibRefs.find(r => String(r.id) === String(refId))
              return {
                ref_id: refId,
                authors: bibRef ? Commons.parseReference(bibRef, true, false) : '',
                column_0: '',
                derivada: true
              }
            })
            _references.forEach((reference) => {
              const index = conDerivadas.findIndex(i => String(i.ref_id) === String(reference))
              const item = index === -1 ? null : conDerivadas[index]
              if (!item) return
              if (item.derivada) {
                _items.push({ ref_id: item.ref_id, authors: item.authors, column_0: '', index })
                // Una fila sin datos es un dato faltante, igual que una columna vacía.
                haveContent++
                return
              }
              _items.push({ ref_id: item.ref_id, authors: item.authors, column_0: item.column_0, index })
              for (let i in item) {
                if (i !== 'ref_id' && i !== 'authors' && i !== 'stages' && i !== 'mainFields' && !i.endsWith('_concerns')) {
                  if (item[i] === '') {
                    haveContent++
                  }
                }
              }
            })

            this.ui.coherence.display_warning = true
            this.ui.adequacy.extracted_data.display_warning = true
            if (!haveContent) {
              this.ui.coherence.display_warning = false
              this.ui.adequacy.extracted_data.display_warning = false
            }
            // `_items` sigue el orden de `list.references`, que es el de las casillas.
            this.extracted_data.items = sortByAuthors(_items)
          }
        })
        .catch((error) => {
          this.loadErrors.extracted = true
          this.printErrors(error)
        })
    },
    getCharsOfStudies: function () {
      const url = this.getSharedUrl('/isoqf_characteristics')
      let params = {
        project_id: this.list.project_id
      }
      return Promise.all([Api.get(url, params), this.referencesLoaded()])
        .then(([response]) => {
          this.loadErrors.characteristics = false
          // Reference list is the source of truth: build one row per reference and
          // merge DB-persisted data when it exists. A CAMELOT project that was just
          // migrated (or never edited) has no isoqf_characteristics document yet, but
          // the worksheet must still show every included study.
          let data = response.data.length ? response.data[0] : {}
          if (!Array.isArray(data.items)) {
            data.items = []
          }
          if (!Array.isArray(data.fields)) {
            data.fields = []
          }
          let items = []

          let haveContent = 0
          const camelotCharKeys = [
            'research_extractedData', 'stakeholders_extractedData',
            'researchers_extractedData', 'context_extractedData',
            'strategy_extractedData', 'theory_extractedData',
            'ethical_extractedData', 'equity_extractedData',
            'participant_extractedData', 'data_extractedData',
            'analysis_extractedData', 'presentation_extractedData'
          ]

          const bibliographicRefs = this.bibliographicReferences()
          const fieldKeys = data.fields.map(f => f.key)
          // El contador de versión entra por la exclusión, no por la preservación: estas
          // filas alimentan la vista, no una escritura. Es un número, así que sin excluirlo
          // una fila vacía parecería llena y el aviso de datos incompletos callaría.
          const excluded = ['ref_id', 'authors', 'author', 'stages', 'mainFields', ...ITEM_METADATA_KEYS]
          const allowedKeys = new Set([...excluded, ...fieldKeys, ...camelotCharKeys])
          if (this.project.use_camelot) {
            this.camelot.fields.forEach(f => allowedKeys.add(f.key))
          }

          const itemsByRef = new Map(data.items.map(it => [String(it.ref_id), it]))
          for (const reference of this.list.references) {
            const originalItem = itemsByRef.get(String(reference)) || { ref_id: reference }
            const bibRef = bibliographicRefs.find(r => String(r.id) === String(reference))

            // Clean item from orphans
            const item = { ref_id: reference, authors: this.parseReference(bibRef || originalItem, true) }
            for (const key in originalItem) {
              if (allowedKeys.has(key) || key.endsWith('_concerns')) {
                item[key] = originalItem[key]
              }
            }
            items.push(item)

            if (this.project.use_camelot) {
              let camelotDataCount = 0
              let hasAnyCamelotDataKey = false
              for (const key of camelotCharKeys) {
                if (item[key] !== undefined) {
                  hasAnyCamelotDataKey = true
                  if (item[key] !== '') {
                    camelotDataCount++
                  }
                }
              }
              if (hasAnyCamelotDataKey && camelotDataCount === 0) {
                haveContent++
              }
              // Still check for CUSTOM fields in Camelot projects
              for (const key in item) {
                if (key !== 'authors' && key !== 'ref_id' && key !== 'stages' && key !== 'mainFields' && !camelotCharKeys.includes(key) && !key.endsWith('_concerns') && item[key] === '') {
                  haveContent++
                }
              }
            } else {
              // NON-CAMELOT
              for (let key of fieldKeys) {
                if (!excluded.includes(key) && (item[key] === undefined || item[key] === '')) {
                  haveContent++
                }
              }
              // If fields definition is missing, we can't reliably check content
              if (data.fields.length <= 2) {
                const hasAnyContent = Object.keys(item).some(k => !excluded.includes(k) && item[k] !== '')
                if (!hasAnyContent) {
                  haveContent++
                }
              }
            }
          }
          if (data.fields.length < 3 && !this.project.use_camelot) {
            haveContent++
          }

          this.ui.adequacy.chars_of_studies.display_warning = true
          this.ui.relevance.chars_of_studies.display_warning = true
          if (!haveContent) {
            this.ui.adequacy.chars_of_studies.display_warning = false
            this.ui.relevance.chars_of_studies.display_warning = false
          }
          // `list.references` está en el orden en que se marcaron las casillas.
          data.items = sortByAuthors(items)
          this.characteristics_studies = data
          if (data.fields.length) {
            let fields = JSON.parse(JSON.stringify(data.fields))
            let lastItem = fields.splice(fields.length - 1, 1)
            this.characteristics_studies.last_column = lastItem[0].key.split('_')[1]
            this.characteristics_studies.fieldsObj = []
            let _fields = data.fields
            for (let field of _fields) {
              if (field.key !== 'ref_id') {
                this.characteristics_studies.fieldsObj.push(field)
              }
            }
            if (!Object.prototype.hasOwnProperty.call(this.characteristics_studies, 'items')) {
              this.characteristics_studies.items = []
            }
          }
          this.buffer_characteristics_studies = JSON.parse(JSON.stringify(this.characteristics_studies))
          this.buffer_characteristics_studies.fields.splice(this.buffer_characteristics_studies.fields.length - 1, 1)

          let tableTop = []

          if (Object.prototype.hasOwnProperty.call(this.characteristics_studies, 'mainFields')) {
            const _tableTop = JSON.parse(JSON.stringify(this.characteristics_studies.mainFields))
            for (let tt of _tableTop) {
              tableTop.push({ 'label': tt.label, 'colspan': tt.fields.length })
            }
          }
          this.characteristics_studies.tableTop = tableTop
        })
        .catch((error) => {
          this.loadErrors.characteristics = true
          this.printErrors(error)
        })
    },
    getMethAssessments: function () {
      const url = this.getSharedUrl('/isoqf_assessments')
      let params = {
        project_id: this.list.project_id
      }
      return Promise.all([Api.get(url, params), this.referencesLoaded()])
        .then(([response]) => {
          this.loadErrors.assessments = false
          // Same left-join-on-references principle as getCharsOfStudies: the study
          // list drives the rows so the shared worksheet is never empty for a CAMELOT
          // project whose isoqf_assessments document has not been created yet.
          const _references = JSON.parse(JSON.stringify(this.list.references))
          let data = response.data.length ? response.data[0] : {}
          if (!Array.isArray(data.items)) {
            data.items = []
          }
          if (!Array.isArray(data.fields)) {
            data.fields = []
          }
          let items = []

          let haveContent = 0
          const bibliographicRefs = this.bibliographicReferences()
          const fieldKeys = data.fields.map(f => f.key)
          // El contador de versión entra por la exclusión, no por la preservación: estas
          // filas alimentan la vista, no una escritura. Es un número, así que sin excluirlo
          // una fila vacía parecería llena y el aviso de datos incompletos callaría.
          const excluded = ['ref_id', 'authors', 'author', 'stages', 'mainFields', ...ITEM_METADATA_KEYS]
          const allowedKeys = new Set([...excluded, ...fieldKeys])
          if (this.project.use_camelot) {
            this.camelot.fields.forEach(f => allowedKeys.add(f.key))
          }

          const itemsByRef = new Map(data.items.map(it => [String(it.ref_id), it]))
          for (const reference of _references) {
            const originalItem = itemsByRef.get(String(reference)) || { ref_id: reference }
            const bibRef = bibliographicRefs.find(r => String(r.id) === String(reference))

            // Clean item from orphans
            const item = { ref_id: reference, authors: this.parseReference(bibRef || originalItem, true) }
            for (const key in originalItem) {
              if (allowedKeys.has(key) || key.endsWith('_concerns')) {
                item[key] = originalItem[key]
              }
            }
            items.push(item)

            if (this.project.use_camelot) {
              // Check for Camelot Assessment Stages
              if (item.stages) {
                for (const stage of item.stages) {
                  if (stage.options) {
                    for (const option of stage.options) {
                      if (option.option === null || option.option === '') {
                        haveContent++
                      }
                    }
                  }
                }
              }
              // Still check for CUSTOM fields in Camelot projects
              for (const key in item) {
                if (key !== 'authors' && key !== 'ref_id' && key !== 'stages' && key !== 'mainFields' && !key.endsWith('_concerns')) {
                  if (item[key] === '') {
                    haveContent++
                  }
                }
              }
            } else {
              // NON-CAMELOT
              for (let key of fieldKeys) {
                if (!excluded.includes(key) && (item[key] === undefined || item[key] === '')) {
                  haveContent++
                }
              }
              // If fields definition is missing, we can't reliably check content
              if (data.fields.length <= 2) {
                const hasAnyContent = Object.keys(item).some(k => !excluded.includes(k) && item[k] !== '')
                if (!hasAnyContent) {
                  haveContent++
                }
              }
            }
          }
          if (data.fields.length < 3 && !this.project.use_camelot) {
            haveContent++
          }
          this.ui.methodological_assessments.display_warning = true
          if (!haveContent) {
            this.ui.methodological_assessments.display_warning = false
          }

          // `list.references` está en el orden en que se marcaron las casillas.
          data.items = sortByAuthors(items)

          let _fields = data.fields
          data.fieldsObj = []
          for (let field of _fields) {
            if (field.key !== 'ref_id') {
              data.fieldsObj.push(field)
            }
          }

          this.meth_assessments = data
        })
        .catch((error) => {
          this.loadErrors.assessments = true
          this.printErrors(error)
        })
    },
    parseReference: (reference, onlyAuthors = false, hasSemicolon = true) => {
      return Commons.parseReference(reference, onlyAuthors, hasSemicolon)
    },
    print: function () {
      window.print()
    },
    printErrors: function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data)
        console.log(error.response.status)
        console.log(error.response.headers)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        console.log(error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error.message)
      }
      console.log(error.config)
    },
    exportToWord: async function () {
      try {
        const filename = (this.project.name || 'GRADE-CERQual Assessment Worksheet') + '.docx'
        const strategy = this.project.use_camelot ? 'camelot' : 'worksheet'

        const data = this.project.use_camelot
          ? {
            evidenceProfile: this.evidence_profile,
            characteristicStudies: this.characteristics_studies,
            methodologicalAssessments: this.meth_assessments,
            extractedData: this.extracted_data,
            references: this.references,
            list: this.list,
            selectOptions: this.select_options,
            levelConfidence: this.level_confidence,
            license: this.theLicense(this.list.license_type || '')
          }
          : {
            evidenceProfile: this.evidence_profile[0] || {},
            characteristicsStudies: this.characteristics_studies,
            methodologicalAssessments: this.meth_assessments,
            extractedData: this.extracted_data,
            references: this.references,
            list: this.list,
            findings: [
              {
                ...this.list,
                evidence_profile: this.evidence_profile.length ? this.evidence_profile[0] : null
              }
            ]
          }

        await exportToWord(this.project, data, { filename, strategy })
      } catch (error) {
        console.error('Error exporting to Word:', error)
        this.$bvToast.toast(this.$t('common.error') + ': ' + error.message, {
          title: this.$t('common.error'),
          variant: 'danger',
          solid: true,
          toaster: 'b-toaster-top-center'
        })
      }
    },
    theLicense: function (license) {
      return Commons.theLicense(license)
    }
  }
}
</script>
