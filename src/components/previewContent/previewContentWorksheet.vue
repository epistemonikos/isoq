<template>
  <div>
    <b-container fluid class="workspace-header">
      <b-container class="py-5">
        <b-row>
          <b-col cols="12" class="text-right d-print-none">
            <b-link class="return" :to="returnLinkTarget">
              <font-awesome-icon icon="long-arrow-alt-left" :title="$t('common.back')" />
              return to ISoQ table
            </b-link>
          </b-col>
        </b-row>
        <h2 class="toDoc font-weight-bold pb-2">GRADE-CERQual Assessment Worksheet</h2>
      </b-container>
    </b-container>
    <b-container>
      <b-row
        class="d-print-none justify-content-end mb-2 pt-2">
        <b-col
          cols="12"
          sm="2">
            <b-button
              id="exportButton"
              variant="outline-secondary"
              block
              @click="exportToWord()">
              Export to MS-Word
            </b-button>
        </b-col>
        <b-col
          cols="12"
          sm="2">
            <b-button
              id="printButton"
              @click="print"
              variant="outline-info"
              block>
              Print or save as PDF
            </b-button>
        </b-col>
      </b-row>
      <b-row class="mt-4">
        <b-col cols="12">
          <evidence-profile
            :evidenceProfile="evidence_profile"
            :ui="ui"
            :evidenceProfileTableSettings="evidence_profile_table_settings"
            :references="references"
            mode="view"
            :list="list"
            :refsWithTitle="[]"
            :project="{}"
            :permission="true"
            :selectOptions="select_options"
            :levelConfidence="level_confidence"
            :findings="{}"
            :methAssessments="meth_assessments"
            :extractedData="extracted_data"
            :showEditExtractedDataInPlace="{}"
            :modalData="modalData()"
            :charsOfStudies="characteristics_studies"></evidence-profile>
          <template v-if="canViewDetails">
            <div v-if="project.use_camelot">
              <h4>Characteristics of studies</h4>
              <camelot-characteristics-table-preview
                :charsOfStudies="characteristics_studies"
                :references="camelot_references">
              </camelot-characteristics-table-preview>
            </div>
            <div v-else-if="!project.use_camelot && characteristics_studies.fields && characteristics_studies.fields.length">
              <chars-of-studies
                :ui="ui"
                :show="show"
                :mode="'view'"
                :list="list"
                :permission="true"
                :charsOfStudies="characteristics_studies"
                :refsWithTitle="[]"
                ></chars-of-studies>
            </div>

            <div v-if="project.use_camelot">
              <h4>Methodological assessments</h4>
              <camelot-assessments-table-preview
                :methodologicalTableRefs="meth_assessments"
                :references="camelot_references">
              </camelot-assessments-table-preview>
            </div>
            <div v-else-if="!project.use_camelot && meth_assessments.items && meth_assessments.items.length">
              <methodological-assessments
                :ui="ui"
                :show="show"
                :mode="'view'"
                :list="list"
                :permission="true"
                :methAssessments="meth_assessments"
                :refsWithTitle="[]"></methodological-assessments>
            </div>

            <div>
              <extracted-data
                :ui="ui"
                :show="show"
                :mode="'view'"
                :list="list"
                :permission="true"
                :extractedData="extracted_data"
                :modePrintFieldObject="mode_print_fieldsObj"
                :refsWithTitle="[]"></extracted-data>
            </div>
          </template>
          <div v-if="list.is_public">
            <div class="mt-5 alert alert-info" role="alert">
              <h5>License type</h5>
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
import backToTop from '../backToTop'
import { exportToWord } from '@/services/wordExportService'
import evidenceProfile from '../list/editListEvidenceProfile.vue'
import charsOfStudies from '../list/editListCharsOfStudies.vue'
import methAssessments from '../list/editListMethAssessments.vue'
import extractedData from '../list/editListExtractedData.vue'
import Commons from '../../utils/commons'
import { camelotMixin } from '@/mixins/camelotMixin'
import PublicPreviewAccess from '@/utils/publicPreviewAccess'

const camelotCharacteristicsTablePreview = () => import(/* webpackChunkName: "camelotcharacteristicstablepreview" */'../camelot/preview/CamelotCharacteristicsTablePreview.vue')
const camelotAssessmentsTablePreview = () => import(/* webpackChunkName: "camelotassessmentstablepreview" */'../camelot/preview/CamelotAssessmentsTablePreview.vue')

export default {
  mixins: [camelotMixin],
  components: {
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
          isoqf_id: 0,
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
      evidence_profile_fields_print_version: [
        { key: 'isoqf_id', label: '#' },
        { key: 'name', label: 'Summarised review finding' },
        { key: 'methodological-limit', label: this.$t('worksheet.methodological_limitations') },
        { key: 'coherence', label: this.$t('worksheet.coherence') },
        { key: 'adequacy', label: this.$t('worksheet.adequacy') },
        { key: 'relevance', label: this.$t('worksheet.relevance') },
        { key: 'cerqual', label: 'GRADE-CERQual assessment of confidence' },
        {
          key: 'references',
          label: 'References',
          formatter: value => {
            let references = ''
            for (let item of value) {
              for (let reference of this.references) {
                if (item === reference.id) {
                  references = references.concat(reference.content)
                }
              }
            }
            return references
          }
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
      show: {
        selected: ['cs', 'ma', 'ed'],
        options: [
          { text: 'Characteristics Studies', value: 'cs' },
          { text: 'Methodological Assessments', value: 'ma' },
          { text: 'Extracted Data', value: 'ed' }
        ]
      },
      references: [],
      camelot_references: [],
      mode_print_fieldsObj: [
        {
          key: 'authors',
          label: 'Author(s), Year'
        },
        {
          key: 'column_0',
          label: 'Extracted data supporting the review finding'
        }
      ],
      select_options: [
        { value: 0, text: 'No/Very minor concerns' },
        { value: 1, text: 'Minor concerns' },
        { value: 2, text: 'Moderate concerns' },
        { value: 3, text: 'Serious concerns' },
        { value: null, text: 'Undefined' }
      ],
      level_confidence: [
        { value: 0, text: 'High confidence' },
        { value: 1, text: 'Moderate confidence' },
        { value: 2, text: 'Low confidence' },
        { value: 3, text: 'Very low confidence' },
        { value: null, text: 'Undefined' }
      ]
    }
  },
  computed: {
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
      Api.get(url, { id: projectId })
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

      Api.get(url, params)
        .then((response) => {
          let lists = Array.isArray(response.data) ? response.data : [response.data]
          const foundList = lists.find(l => l.id === listId)
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
          this.printErrors(error)
        })
    },
    getAllReferences: function () {
      const url = this.getSharedUrl(`/isoqf_references?project_id=${this.list.project_id}`)
      Api.get(url)
        .then((response) => {
          let _references = response.data
          let _refs = []
          let _refsWithTitles = []
          for (let reference of _references) {
            _refs.push({'id': reference.id, 'content': this.parseReference(reference, true)})
            _refsWithTitles.push({'id': reference.id, 'content': this.parseReference(reference, false)})
          }

          this.references = _refs.sort((a, b) => a.id - b.id)
          this.refsWithTitle = _refsWithTitles.sort((a, b) => a.id - b.id)
          this.camelot_references = _references
            .filter(reference => this.list.references.some(refId => String(refId) === String(reference.id)))
            .sort((a, b) => a.id - b.id)
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getStageOneData: function (fromModal = false) {
      const url = this.getSharedUrl('/isoqf_findings')
      let params = {
        list_id: this.list.id
      }
      Api.get(url, params)
        .then((response) => {
          if (response.data.length) {
            this.findings = JSON.parse(JSON.stringify(response.data[0]))
            this.evidence_profile = []
            if (Object.prototype.hasOwnProperty.call(this.findings, 'evidence_profile')) {
              this.evidence_profile.push(this.findings.evidence_profile)
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
          this.printErrors(error)
        })
    },
    getExtractedData: function () {
      const url = this.getSharedUrl('/isoqf_extracted_data')
      let params = {
        finding_id: this.findings.id
      }

      Api.get(url, params)
        .then((response) => {
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
            extractedDataItems.sort(function (a, b) {
              if (a.authors < b.authors) {
                return -1
              }
              if (a.authors > b.authors) {
                return 1
              }
              return 0
            })
            this.extracted_data.original_items = extractedDataItems
            let haveContent = 0
            for (let reference of _references) {
              let index = 0
              for (let item of extractedDataItems) {
                if (String(item.ref_id) === String(reference)) {
                  _items.push({ ref_id: item.ref_id, authors: item.authors, column_0: item.column_0, index: index })
                  for (let i in item) {
                    if (i !== 'ref_id' && i !== 'authors' && i !== 'stages' && i !== 'mainFields' && !i.endsWith('_concerns')) {
                      if (item[i] === '') {
                        haveContent++
                      }
                    }
                  }
                }
                index++
              }
            }

            this.ui.coherence.display_warning = true
            this.ui.adequacy.extracted_data.display_warning = true
            if (!haveContent) {
              this.ui.coherence.display_warning = false
              this.ui.adequacy.extracted_data.display_warning = false
            }
            this.extracted_data.items = _items
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getCharsOfStudies: function () {
      const url = this.getSharedUrl('/isoqf_characteristics')
      let params = {
        project_id: this.list.project_id
      }
      Api.get(url, params)
        .then((response) => {
          if (response.data.length) {
            let data = response.data[0]
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

            let bibliographicRefs = []
            if (this.list.fullreferences) {
              if (typeof this.list.fullreferences === 'string') {
                try {
                  bibliographicRefs = JSON.parse(this.list.fullreferences)
                } catch (e) {
                  console.error('Error parsing fullreferences', e)
                }
              } else {
                bibliographicRefs = this.list.fullreferences
              }
            }
            const fieldKeys = (Array.isArray(data.fields)) ? data.fields.map(f => f.key) : []
            const excluded = ['ref_id', 'authors', 'author', 'stages', 'mainFields']
            const allowedKeys = new Set([...excluded, ...fieldKeys, ...camelotCharKeys])
            if (this.project.use_camelot) {
              this.camelot.fields.forEach(f => allowedKeys.add(f.key))
            }

            for (let item of data.items) {
              for (let reference of this.list.references) {
                if (String(reference) === String(item.ref_id)) {
                  const bibRef = bibliographicRefs.find(r => String(r.id) === String(item.ref_id))
                  item.authors = this.parseReference(bibRef || item, true)

                  // Clean item from orphans
                  const cleanedItem = { ref_id: item.ref_id, authors: item.authors }
                  for (const key in item) {
                    if (allowedKeys.has(key) || key.endsWith('_concerns')) {
                      cleanedItem[key] = item[key]
                    }
                  }
                  item = cleanedItem
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
                    const fieldKeys = (Array.isArray(data.fields)) ? data.fields.map(f => f.key) : []
                    const excluded = ['ref_id', 'authors', 'author', 'stages', 'mainFields']
                    for (let key of fieldKeys) {
                      if (!excluded.includes(key) && (item[key] === undefined || item[key] === '')) {
                        haveContent++
                      }
                    }
                    // If fields definition is missing, we can't reliably check content
                    if (!Array.isArray(data.fields) || data.fields.length <= 2) {
                      const hasAnyContent = Object.keys(item).some(k => !excluded.includes(k) && item[k] !== '')
                      if (!hasAnyContent) {
                        haveContent++
                      }
                    }
                  }
                }
              }
            }
            if (Array.isArray(data.fields) && data.fields.length < 3 && !this.project.use_camelot) {
              haveContent++
            }

            this.ui.adequacy.chars_of_studies.display_warning = true
            this.ui.relevance.chars_of_studies.display_warning = true
            if (!haveContent) {
              this.ui.adequacy.chars_of_studies.display_warning = false
              this.ui.relevance.chars_of_studies.display_warning = false
            }
            data.items = items
            this.characteristics_studies = data
            if (Array.isArray(data.fields) && data.fields.length) {
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
          } else {
            this.characteristics_studies = {
              items: [],
              fields: []
            }
          }
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getMethAssessments: function () {
      const url = this.getSharedUrl('/isoqf_assessments')
      let params = {
        project_id: this.list.project_id
      }
      Api.get(url, params)
        .then((response) => {
          if (response.data.length) {
            const _references = JSON.parse(JSON.stringify(this.list.references))
            let data = response.data[0]
            let items = []

            let haveContent = 0
            let bibliographicRefs = []
            if (this.list.fullreferences) {
              if (typeof this.list.fullreferences === 'string') {
                try {
                  bibliographicRefs = JSON.parse(this.list.fullreferences)
                } catch (e) {
                  console.error('Error parsing fullreferences', e)
                }
              } else {
                bibliographicRefs = this.list.fullreferences
              }
            }
            const fieldKeys = (Array.isArray(data.fields)) ? data.fields.map(f => f.key) : []
            const excluded = ['ref_id', 'authors', 'author', 'stages', 'mainFields']
            const allowedKeys = new Set([...excluded, ...fieldKeys])
            if (this.project.use_camelot) {
              this.camelot.fields.forEach(f => allowedKeys.add(f.key))
            }

            for (let item of data.items) {
              for (let reference of _references) {
                if (String(reference) === String(item.ref_id)) {
                  const bibRef = bibliographicRefs.find(r => String(r.id) === String(item.ref_id))
                  item.authors = this.parseReference(bibRef || item, true)

                  // Clean item from orphans
                  const cleanedItem = { ref_id: item.ref_id, authors: item.authors }
                  for (const key in item) {
                    if (allowedKeys.has(key) || key.endsWith('_concerns')) {
                      cleanedItem[key] = item[key]
                    }
                  }
                  item = cleanedItem
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
                    const fieldKeys = (Array.isArray(data.fields)) ? data.fields.map(f => f.key) : []
                    const excluded = ['ref_id', 'authors', 'author', 'stages', 'mainFields']
                    for (let key of fieldKeys) {
                      if (!excluded.includes(key) && (item[key] === undefined || item[key] === '')) {
                        haveContent++
                      }
                    }
                    // If fields definition is missing, we can't reliably check content
                    if (!Array.isArray(data.fields) || data.fields.length <= 2) {
                      const hasAnyContent = Object.keys(item).some(k => !excluded.includes(k) && item[k] !== '')
                      if (!hasAnyContent) {
                        haveContent++
                      }
                    }
                  }
                }
              }
            }
            if (Array.isArray(data.fields) && data.fields.length < 3 && !this.project.use_camelot) {
              haveContent++
            }
            this.ui.methodological_assessments.display_warning = true
            if (!haveContent) {
              this.ui.methodological_assessments.display_warning = false
            }

            data.items = items

            let _fields = Array.isArray(data.fields) ? data.fields : []
            data.fieldsObj = []
            for (let field of _fields) {
              if (field.key !== 'ref_id') {
                data.fieldsObj.push(field)
              }
            }

            this.meth_assessments = data
          } else {
            this.meth_assessments = { nroOfColumns: 1, fields: [], items: [] }
          }
        })
        .catch((error) => {
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
