<template>
  <div>
    <b-alert
      :show="editingUser.show"
      class="position-fixed fixed-bottom m-0 rounded-0"
      style="z-index: 2000;"
      variant="danger"
      dismissible
    >
      The user <b>{{editingUser.first_name}} {{editingUser.last_name}}</b> is editing this finding. The edit mode is disabled.
    </b-alert>
    <edit-header-list
      :organizationId="list.organization"
      :projectId="list.project_id"
      :name="list.name"
      :mode="mode"
      :list="list"
    />
    <b-container fluid>
      <edit-list-actions-buttons
        :mode="mode"
        :permission="checkPermissions(list.organization)"
        :project="project"
        :evidenceProfile="evidence_profile"
        :selectOptions="select_options"
        :levelConfidence="level_confidence"
        :references="references"
        :list="list"
        :characteristicStudies="characteristics_studies"
        :methodologicalAssessments="meth_assessments"
        :extractedData="extracted_data"
        :license="theLicense(this.project.license_type)"
        @changeMode="changeMode"
      />
      <b-row
        class="sticky-top"
        style="background-color: #fff; padding-bottom: 0.3rem"
        v-if="mode==='edit'"
      >
        <b-col
          class="d-print-none"
          cols="12"
        >
          <b-nav class="mt-2">
            <b-nav-item disabled>Navigate this page:</b-nav-item>
            <b-nav-item href="#evidence-profile">
              Evidence Profile
              <span
                v-if="ui.adequacy.chars_of_studies.display_warning || ui.methodological_assessments.display_warning || ui.adequacy.extracted_data.display_warning || (project.review_question === '') ? true : false || (project.inclusion === '') ? true: false || (project.exclusion === '') ? true: false"
                class="text-danger"
                v-b-tooltip.hover
                title="Data are missing. Click link to see what's missing."
              >
                <font-awesome-icon icon="exclamation-circle" />
              </span>
            </b-nav-item>
            <b-nav-item href="#characteristics-of-studies">
              Characteristics of Studies
              <span
                v-if="ui.adequacy.chars_of_studies.display_warning"
                class="text-danger"
                v-b-tooltip.hover
                title="Data are missing. Click link to see what's missing."
              >
                <font-awesome-icon icon="exclamation-circle" />
              </span>
            </b-nav-item>
            <b-nav-item href="#methodological-assessments">
              Methodological Assessments
              <span
                v-if="ui.methodological_assessments.display_warning"
                class="text-danger"
                v-b-tooltip.hover
                title="Data are missing. Click link to see what's missing."
              >
                <font-awesome-icon icon="exclamation-circle" />
              </span>
            </b-nav-item>
            <b-nav-item href="#extracted-data">
              Extracted Data
              <span
                v-if="ui.adequacy.extracted_data.display_warning"
                class="text-danger"
                v-b-tooltip.hover
                title="Data are missing. Click link to see what's missing."
              >
                <font-awesome-icon icon="exclamation-circle" />
              </span>
            </b-nav-item>
          </b-nav>
        </b-col>
      </b-row>
      <b-row
        class="justify-content-end"
        v-if="mode==='edit' && checkPermissions(list.organization)"
      >
        <b-col
          cols="12"
          md="3"
        >
          <b-button
            class="mt-2"
            @click="changeMode"
            variant="outline-success"
            block
          >
            Print or Export
          </b-button>
        </b-col>
      </b-row>

      <b-row class="mt-4">
        <b-col cols="12">
          <div
            id="progress-status"
            v-if="mode==='edit'"
            class="d-print-none"
          >
            <h5>
              Progress status
              <span
                v-b-tooltip.hover
                title="This progress bar shows you how far along you are in making your GRADE-CERQual assessment of confidence. You have 5 assessments to make in total. Firstly, an assessment for each of the 4 GRADE-CERQual components, and lastly the overall assessment."
              >*</span>
            </h5>
            <p v-if="list.cerqual.option !== null">
              Your GRADE-CERQual assessment has been added to the iSoQ for this finding. Click "return to iSoQ table" above to view it
            </p>
            <b-progress
              :value="status_evidence_profile.value"
              :max="status_evidence_profile.max"
              :variant="status_evidence_profile.variant"
              class="mb-3"
            />
          </div>

          <evidence-profile-table
            :evidenceProfile="evidence_profile"
            :ui="ui"
            :evidenceProfileTableSettings="evidence_profile_table_settings"
            :references="references"
            :mode="mode"
            :list="list"
            :refsWithTitle="refsWithTitle"
            :project="project"
            :permission="checkPermissions(list.organization)"
            :selectOptions="select_options"
            :levelConfidence="level_confidence"
            :findings="findings"
            :methAssessments="meth_assessments"
            :extractedData="extracted_data"
            :showEditExtractedDataInPlace="showEditExtractedDataInPlace"
            :modalData="buffer_modal_stage_two"
            :charsOfStudies="characteristics_studies"
            @update-list-data="getList"
            @printErrors="printErrors"
            @modalDataChanged="modalDataChanged"
            @busyEvidenceProfileTable="busyEvidenceProfileTable"
            @callGetStageOneData="callGetStageOneData"
            @setShowEditExtractedDataInPlace="setShowEditExtractedDataInPlace"
            @getExtractedData="getExtractedData"
          />

          <table-chars-of-studies
            :ui="ui"
            :show="show"
            :mode="mode"
            :list="list"
            :permission="checkPermissions(list.organization)"
            :charsOfStudies="characteristics_studies"
            :refsWithTitle="refsWithTitle"
            :showParagraph="true"
          />

          <table-meth-assessments
            :isCamelot="project.use_camelot"
            :ui="ui"
            :show="show"
            :mode="mode"
            :list="list"
            :permission="checkPermissions(list.organization)"
            :methAssessments="meth_assessments"
            :refsWithTitle="refsWithTitle"
            :showParagraph="true"
          />

          <table-extracted-data
            :ui="ui"
            :show="show"
            :mode="mode"
            :list="list"
            :permission="checkPermissions(list.organization)"
            :extractedData="extracted_data"
            :modePrintFieldObject="mode_print_fieldsObj"
            :refsWithTitle="refsWithTitle"
            :showParagraph="true"
            @printErrors="printErrors"
            @getExtractedData="getExtractedData"
          />

          <template v-if="Object.prototype.hasOwnProperty.call(this.project, 'license_type')">
            <div class="mt-5">
              <h5 class="text-info">License type</h5>
              <p class="text-info">{{ theLicense(this.project.license_type) }}</p>
            </div>
          </template>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import axios from 'axios'
import draggable from 'vuedraggable'

// Importar componentes
const bCardFilters = () => import(/* webpackChunkName: "backtotop" */'../tableActions/Filters')
const bCardActionTable = () => import(/* webpackChunkName: "backtotop" */'../tableActions/ActionTable')
const editReviewFinding = () => import(/* webpackChunkName: "backtotop" */'../editReviewFinding')
const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')
const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')
const editHeaderList = () => import(/* webpackChunkName: "editHeaderList" */'./editListHeader')
const editListActionButtons = () => import('./editListActionButtons.vue')
const editListEvidenceProfile = () => import('./editListEvidenceProfile.vue')
const editListCharsOfStudies = () => import('./editListCharsOfStudies.vue')
const editListMethAssessments = () => import('./editListMethAssessments.vue')
const editListExtractedData = () => import('./editListExtractedData.vue')

// Servicio de API
const apiService = {
  async getList (id) {
    try {
      const response = await axios.get(`/api/isoqf_lists/${id}`)
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener la lista: ${error.message}`)
    }
  },

  async getProject (projectId) {
    try {
      const response = await axios.get(`/api/isoqf_projects/${projectId}`)
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener el proyecto: ${error.message}`)
    }
  },

  async getReferences (params) {
    try {
      const response = await axios.get(`/api/isoqf_references`, { params })
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener referencias: ${error.message}`)
    }
  },

  async getFindings (params) {
    try {
      const response = await axios.get('/api/isoqf_findings', { params })
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener hallazgos: ${error.message}`)
    }
  },

  async getCharacteristics (params) {
    try {
      const response = await axios.get('/api/isoqf_characteristics', { params })
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener características: ${error.message}`)
    }
  },

  async getAssessments (params) {
    try {
      const response = await axios.get('/api/isoqf_assessments', { params })
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener evaluaciones: ${error.message}`)
    }
  },

  async getExtractedData (params) {
    try {
      const response = await axios.get('/api/isoqf_extracted_data', { params })
      return response.data
    } catch (error) {
      throw new Error(`Error al obtener datos extraídos: ${error.message}`)
    }
  },

  async updateList (id, params) {
    try {
      const response = await axios.patch(`/api/isoqf_lists/${id}`, params)
      return response.data
    } catch (error) {
      throw new Error(`Error al actualizar la lista: ${error.message}`)
    }
  }
}

export default {
  name: 'EditList',
  components: {
    'bc-filters': bCardFilters,
    'bc-action-table': bCardActionTable,
    'edit-review-finding': editReviewFinding,
    'back-to-top': backToTop,
    draggable,
    videoHelp,
    'edit-header-list': editHeaderList,
    'edit-list-actions-buttons': editListActionButtons,
    'evidence-profile-table': editListEvidenceProfile,
    'table-chars-of-studies': editListCharsOfStudies,
    'table-meth-assessments': editListMethAssessments,
    'table-extracted-data': editListExtractedData
  },

  data () {
    return {
      loading: false,
      error: null,
      licenseUrl: require('../../assets/by-88x31.png'),
      ui: {
        methodological_assessments: {
          display_warning: true,
          extracted_data: {
            display_warning: true
          }
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
      /** filters **/
      nroOfRows: 1,
      evidence_profile_table_settings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100],
        isBusy: false
      },
      show: {
        selected: ['cs', 'ma', 'ed'],
        options: [
          { text: 'Characteristics Studies', value: 'cs' },
          { text: 'Methodological Assessments', value: 'ma' },
          { text: 'Extracted Data', value: 'ed' }
        ]
      },
      /** filters **/
      /** selectors **/
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
      ],
      /** selectors **/
      /** tables fields **/
      /** tables fields **/
      initial_modal_stage_one: {
        id: null,
        name: '',
        list_id: '',
        organization: ''
      },
      // buffer_modal_stage_one: {
      //   id: null,
      //   name: '',
      //   list_id: '',
      //   organization: ''
      // },
      buffer_modal_stage_two: {
        methodological_limitations: {
          option: null,
          example: '',
          explanation: '',
          notes: '',
          title: ''
        },
        coherence: {
          option: null,
          example: '',
          explanation: '',
          notes: '',
          title: ''
        },
        adequacy: {
          option: null,
          example: '',
          explanation: '',
          notes: '',
          title: ''
        },
        relevance: {
          option: null,
          example: '',
          explanation: '',
          notes: '',
          title: ''
        },
        cerqual: {
          option: null,
          example: '',
          explanation: '',
          notes: '',
          title: ''
        },
        type: '',
        title: ''
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
        cerqual: {},
        references: []
      },
      buffer_meth_assessments: {
        nroOfColumns: 1,
        fields: [],
        items: []
      },
      buffer_meth_assessments_remove_item: {
        fields: [],
        items: []
      },
      buffer_meth_assessments_data: {
        fields: []
      },
      meth_assessments: {
        nroOfColumns: 1,
        fields: [],
        items: []
      },
      soqf: {},
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
      status_evidence_profile: {
        value: 0,
        max: 100,
        variant: 'primary'
      },
      characteristics_studies: {
        fields: [],
        items: []
      },
      buffer_characteristics_studies: {},
      modal_meth_assessments_data: {},
      buffer_modal_meth_assessments_fields: {},
      extracted_data: {
        id: null,
        fields: [],
        items: [],
        fieldsObj: []
      },
      tmpExtractedDataFields: [
        { key: 'column_0', label: '' }
      ],
      importUrl: '',
      references: [],
      refsWithTitle: [],
      mode: 'edit',
      mode_print_fieldsObj: [],
      findings: null,
      showEditExtractedDataInPlace: {
        display: false,
        item: { authors: '', column_0: '', ref_id: null }
      },
      editingUser: {
        show: false
      }
    }
  },

  mounted () {
    this.initializeData()
  },

  methods: {
    async initializeData () {
      try {
        this.loading = true
        this.evidence_profile_table_settings.isBusy = true

        // Primero obtenemos la lista
        const listData = await apiService.getList(this.$route.params.id)
        this.list = JSON.parse(JSON.stringify(listData))

        // Verificamos que tengamos los datos necesarios
        if (!this.list || !this.list.project_id) {
          throw new Error('No se pudo obtener la lista o el ID del proyecto')
        }

        // Luego obtenemos el proyecto y las referencias en paralelo
        const [projectData, referencesData] = await Promise.all([
          apiService.getProject(this.list.project_id),
          apiService.getReferences({
            organization: this.list.organization,
            project_id: this.list.project_id
          })
        ])

        // Actualizamos los datos
        this.project = projectData
        this.processReferences(referencesData)

        // Finalmente obtenemos los datos secundarios
        await Promise.all([
          this.getStageOneData(),
          this.getCharsOfStudies(),
          this.getMethAssessments(),
          this.getExtractedData()
        ])

        this.evidence_profile_table_settings.isBusy = false
        this.scrollToEvidenceProfile()
      } catch (error) {
        this.error = error.message
        this.printErrors(error)
        // Emitir evento de error para manejo global
        this.$emit('error', {
          message: 'Error al inicializar los datos',
          details: error.message
        })
      } finally {
        this.loading = false
      }
    },

    async getList (fromModal = false) {
      try {
        this.loading = true
        const listData = await apiService.getList(this.$route.params.id)
        this.list = JSON.parse(JSON.stringify(listData))
        this.list.sources = []
        this.evidence_profile = []
        this.extracted_data = {
          fields: [],
          items: []
        }

        await Promise.all([
          this.getProject(),
          this.getAllReferences(),
          this.getStageOneData(fromModal),
          this.getCharsOfStudies(),
          this.getMethAssessments()
        ])

        this.evidence_profile_table_settings.isBusy = false
        this.scrollToEvidenceProfile()
      } catch (error) {
        this.printErrors(error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async getProject () {
      if (!this.list.project_id) {
        console.warn('getProject: project_id no definido')
        return
      }

      try {
        const projectData = await apiService.getProject(this.list.project_id)
        this.project = projectData
        this.project.inclusion = this.project.inclusion || ''
        this.project.exclusion = this.project.exclusion || ''
      } catch (error) {
        this.printErrors(error)
        throw error
      }
    },

    async getAllReferences () {
      try {
        const params = {
          organization: this.list.organization,
          project_id: this.list.project_id
        }
        const references = await apiService.getReferences(params)
        this.processReferences(references)
      } catch (error) {
        this.printErrors(error)
        throw error
      }
    },

    processReferences (references) {
      if (!references || !Array.isArray(references)) {
        console.warn('processReferences: referencias no definidas o no es un array')
        return
      }

      const _references = references.map(reference => ({
        'id': reference.id,
        'content': this.parseReference(reference, true)
      }))

      const _refsWithTitles = references.map(reference => ({
        'id': reference.id,
        'content': this.parseReference(reference, false)
      }))

      this.references = _references.sort((a, b) => a.content.localeCompare(b.content))
      this.refsWithTitle = _refsWithTitles.sort((a, b) => a.content.localeCompare(b.content))
    },

    async getExtractedData () {
      try {
        if (!this.findings || !this.findings.id) {
          console.warn('getExtractedData: findings no definido o sin ID')
          return
        }

        const params = {
          organization: this.list.organization,
          finding_id: this.findings.id
        }

        const response = await apiService.getExtractedData(params)
        let localData = { id: null, fields: [], items: [] }

        if (response && response.length) {
          localData = response[0]
          this.extracted_data = response[0]
          localData.fields.push({ key: 'actions', label: '' })

          const _fields = JSON.parse(JSON.stringify(localData.fields))
          localData.fieldsObj = []
          this.mode_print_fieldsObj = []

          for (let field of _fields) {
            if (field.key !== 'ref_id') {
              localData.fieldsObj.push(field)
              if (field.key !== 'actions') {
                this.mode_print_fieldsObj.push(field)
              }
            }
          }

          const _references = this.list.references
          let _items = []
          let extractedDataItems = JSON.parse(JSON.stringify(localData.items))

          extractedDataItems.sort((a, b) => {
            if (a.authors < b.authors) return -1
            if (a.authors > b.authors) return 1
            return 0
          })

          localData.original_items = JSON.parse(JSON.stringify(localData.items))
          let haveContent = 0

          for (let i in _references) {
            let index = 0
            for (let item of extractedDataItems) {
              if (item.ref_id === _references[i]) {
                _items.push({
                  ref_id: item.ref_id,
                  authors: item.authors,
                  column_0: item.column_0,
                  index: index
                })
                if (item.column_0 === '') {
                  haveContent++
                }
              }
              index++
            }
          }

          this.ui.coherence.display_warning = true
          this.ui.methodological_assessments.extracted_data.display_warning = true
          this.ui.adequacy.extracted_data.display_warning = true

          if (!haveContent) {
            this.ui.coherence.display_warning = false
            this.ui.methodological_assessments.extracted_data.display_warning = false
            this.ui.adequacy.extracted_data.display_warning = false
          }

          this.extracted_data.items = _items
        }
      } catch (error) {
        this.printErrors(error)
      }
    },

    async getStageOneData (fromModal = false) {
      try {
        const params = {
          organization: this.list.organization,
          list_id: this.list.id
        }

        const response = await apiService.getFindings(params)

        if (response && response.length) {
          this.findings = JSON.parse(JSON.stringify(response[0]))
          this.findings.isoqf_id = this.list.sort
          this.evidence_profile = []

          if (this.findings.evidence_profile) {
            this.evidence_profile.push(this.findings.evidence_profile)
            this.evidence_profile[0].isoqf_id = this.list.sort
          }

          if (fromModal) {
            const title = this.buffer_modal_stage_two.title
            const type = this.buffer_modal_stage_two.type
            this.buffer_modal_stage_two = this.evidence_profile[0]
            this.buffer_modal_stage_two.title = title
            this.buffer_modal_stage_two.type = type
          }

          await this.updateMyData()
        }

        this.getStatus()
        await this.getExtractedData()
        this.evidence_profile_table_settings.isBusy = false
      } catch (error) {
        this.printErrors(error)
      }
    },

    async getCharsOfStudies () {
      try {
        const params = {
          organization: this.list.organization,
          project_id: this.list.project_id
        }

        const response = await apiService.getCharacteristics(params)

        if (response && response.length) {
          let data = response[0]
          let items = []
          let haveContent = 0

          for (let item of data.items) {
            for (let reference of this.list.references) {
              if (reference === item.ref_id) {
                items.push(item)
                for (let i in item) {
                  if (item[i] !== 'ref_id' && item[i] !== 'authors') {
                    if (item[i] === '') {
                      haveContent++
                    }
                  }
                }
                if (data.fields.length > Object.keys(item).length) {
                  haveContent++
                }
              }
            }
          }

          if (data.fields.length < 3) {
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

          if (data.fields.length) {
            let fields = JSON.parse(JSON.stringify(data.fields))
            let lastItem = fields.splice(fields.length - 1, 1)
            this.characteristics_studies.last_column = lastItem[0].key.split('_')[1]
            this.characteristics_studies.fieldsObj = []

            for (let field of data.fields) {
              if (field.key !== 'ref_id') {
                this.characteristics_studies.fieldsObj.push(field)
              }
            }

            if (!this.characteristics_studies.items) {
              this.characteristics_studies.items = []
            }
          }

          this.buffer_characteristics_studies = JSON.parse(JSON.stringify(this.characteristics_studies))
          this.buffer_characteristics_studies.fields.splice(this.buffer_characteristics_studies.fields.length - 1, 1)

          let tableTop = []

          if (this.characteristics_studies.mainFields) {
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
      } catch (error) {
        this.printErrors(error)
      }
    },

    async getMethAssessments () {
      try {
        const params = {
          organization: this.list.organization,
          project_id: this.list.project_id
        }

        const response = await apiService.getAssessments(params)

        if (response && response.length) {
          let data = response[0]

          // Asegurarse de que data.fields exista y sea un array
          if (!data.fields) {
            data.fields = []
          }

          // Asegurarse de que data.items exista y sea un array
          if (!data.items) {
            data.items = []
          }

          if (this.project.use_camelot) {
            // Para Camelot, simplemente asignar los datos pero asegurarse de que tenga las propiedades necesarias
            this.meth_assessments = data

            // Asegurar que exista fieldsObj si no viene en la respuesta
            if (!this.meth_assessments.fieldsObj) {
              this.meth_assessments.fieldsObj = []
            }
          } else {
            const _references = JSON.parse(JSON.stringify(this.list.references))
            let items = []
            let haveContent = 0

            for (let item of data.items) {
              for (let reference of _references) {
                if (reference === item.ref_id) {
                  items.push(item)
                  for (let i in item) {
                    if (item[i] !== 'author' && item[i] !== 'ref_id') {
                      if (item[i] === '') {
                        haveContent++
                      }
                    }
                  }
                  // Verificar que data.fields.length sea seguro de utilizar
                  if (data.fields.length > 0 && data.fields.length > Object.keys(item).length) {
                    haveContent++
                  }
                }
              }
            }

            // Verificar que data.fields.length sea seguro de utilizar
            if (data.fields.length < 3) {
              haveContent++
            }

            this.ui.methodological_assessments.display_warning = true
            if (!haveContent) {
              this.ui.methodological_assessments.display_warning = false
            }

            data.items = items
            data.fieldsObj = []

            // Verificar que data.fields exista antes de iterarlo
            if (data.fields && data.fields.length > 0) {
              for (let field of data.fields) {
                if (field.key !== 'ref_id') {
                  data.fieldsObj.push(field)
                }
              }
            }

            this.meth_assessments = data
          }
        } else {
          this.meth_assessments = { nroOfColumns: 1, fields: [], items: [], fieldsObj: [] }
        }
      } catch (error) {
        this.printErrors(error)
      }
    },

    async updateMyData () {
      try {
        let _extractedData = []
        const params = {
          organization: this.list.organization,
          list_id: this.list.id
        }

        const response = await apiService.getExtractedData(params)

        if (response && response.length && response[0].items.length && this.references.length > response[0].items.length) {
          let _items = response[0].items
          let _itemsChecks = []

          for (let item of _items) {
            _itemsChecks.push(item.ref_id)
          }

          for (let reference of this.references) {
            if (!_itemsChecks.includes(reference.id)) {
              _extractedData.push({ ref_id: reference.id, authors: reference.content })
            }
          }

          _items.push(..._extractedData)
          await apiService.updateList(response[0].id, { items: _items })
          await this.getExtractedData()
        }
      } catch (error) {
        this.printErrors(error)
      }
    },

    scrollToEvidenceProfile () {
      const elementScroll = document.getElementsByName('evidence-profile')[0]
      if (elementScroll) {
        window.scrollTo({ top: elementScroll.offsetParent.offsetTop, behavior: 'smooth' })
      }
    },

    checkPermissions (organizationId, type = 'can_write') {
      // Verificar que organizationId esté definido
      if (!organizationId) {
        console.warn('checkPermissions: organizationId no está definido')
        return false
      }

      // Verificar que el usuario esté autenticado
      if (!this.$store.state.user || !this.$store.state.user.personal_organization) {
        console.warn('checkPermissions: usuario no autenticado o sin organización personal')
        return false
      }

      // Verificar que el proyecto exista
      if (!this.project) {
        console.warn('checkPermissions: proyecto no definido')
        return false
      }

      // Si el usuario pertenece a la organización personal
      if (this.$store.state.user.personal_organization === organizationId) {
        return true
      }

      // Verificar permisos específicos del proyecto
      if (!this.project[type]) {
        console.warn(`checkPermissions: tipo de permiso '${type}' no definido en el proyecto`)
        return false
      }

      return this.project[type].includes(this.$store.state.user.id)
    },

    changeMode () {
      this.mode = (this.mode === 'edit') ? 'view' : 'edit'
    },

    parseReference (reference, onlyAuthors = false, hasSemicolon = true) {
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''

      if (reference && reference.authors) {
        if (reference.authors.length < 1) {
          result = 'no autho(s)'
        } else if (reference.authors.length === 1) {
          result = reference.authors[0].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else if (reference.authors.length === 2) {
          result = reference.authors[0].split(',')[0] + ' & ' + reference.authors[1].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else {
          result = reference.authors[0].split(',')[0] + ' et al. ' + reference.publication_year + semicolon
        }
        if (!onlyAuthors) {
          result = result + reference.title
        }
      }
      return result
    },

    getStatus () {
      this.status_evidence_profile.value = 0
      const profile = this.evidence_profile[0] || {}

      if (profile.methodological_limitations && profile.methodological_limitations.option !== null) {
        this.status_evidence_profile.value += 20
      }
      if (profile.coherence && profile.coherence.option !== null) {
        this.status_evidence_profile.value += 20
      }
      if (profile.adequacy && profile.adequacy.option !== null) {
        this.status_evidence_profile.value += 20
      }
      if (profile.relevance && profile.relevance.option !== null) {
        this.status_evidence_profile.value += 20
      }
      if (profile.cerqual && profile.cerqual.option !== null) {
        this.status_evidence_profile.value += 20
      }

      if (this.status_evidence_profile.value <= 40) {
        this.status_evidence_profile.variant = 'danger'
      } else if (this.status_evidence_profile.value <= 80) {
        this.status_evidence_profile.variant = 'warning'
      } else if (this.status_evidence_profile.value === 100) {
        this.status_evidence_profile.variant = 'success'
      }
    },

    printErrors (error) {
      console.error('Error:', {
        message: error.message,
        response: error.response && error.response.data,
        status: error.response && error.response.status,
        headers: error.response && error.response.headers,
        config: error.config
      })

      // Emitir evento de error para manejo global
      this.$emit('error', {
        message: error.message,
        details: error.response && error.response.data
      })
    },

    displaySelectedOption (option) {
      if (option === null) {
        return ''
      } else if (option >= 0 && this.select_options && this.select_options[option]) {
        return this.select_options[option].text
      }
      return ''
    },

    theLicense (license) {
      const globalLicenses = [
        {
          value: 'BY-NC-ND',
          text: 'CC BY-NC-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, for noncommercial purposes only, and only so long as attribution is given to the creator.',
          image: 'by-nc-nd-88x31.png'
        },
        { value: 'BY-ND', text: 'CC BY-ND: This license allows reusers to copy and distribute the material in any medium or format in unadapted form only, and only so long as attribution is given to the creator. The license allows for commercial use.', image: 'by-nd-88x31.png' },
        { value: 'BY-NC-SA', text: 'CC BY-NC-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.', image: 'by-nc-sa-88x31.png' },
        { value: 'BY-NC', text: 'CC BY-NC: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format for noncommercial purposes only, and only so long as attribution is given to the creator.', image: 'by-nc-88x31.png' },
        { value: 'BY-SA', text: 'CC BY-SA: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use. If you remix, adapt, or build upon the material, you must license the modified material under identical terms.', image: 'by-sa-88x31.png' },
        { value: 'BY', text: 'CC BY: This license allows reusers to distribute, remix, adapt, and build upon the material in any medium or format, so long as attribution is given to the creator. The license allows for commercial use.', image: 'by-88x31.png' }
      ]

      if (license) {
        for (let lic of globalLicenses) {
          if (lic.value === license) {
            this.licenseUrl = require('../../assets/' + lic.image)
            return lic.text
          }
        }
      }

      this.licenseUrl = require('../../assets/' + globalLicenses[0].image)
      return globalLicenses[0].text
    },

    async returnTo () {
      if (this.list.userEditing === this.$store.state.user.id) {
        try {
          const params = { editing: false, userEditing: '' }
          await apiService.updateList(this.$route.params.id, params)
          this.list.editing = false
          this.list.userEditing = ''
          this.$router.push({
            name: 'viewProject',
            params: {
              org_id: this.list.organization,
              id: this.list.project_id
            }
          })
        } catch (error) {
          this.printErrors(error)
        }
      } else {
        this.$router.push({
          name: 'viewProject',
          params: {
            org_id: this.list.organization,
            id: this.list.project_id
          }
        })
      }
    },

    modalDataChanged (data) {
      this.buffer_modal_stage_two = JSON.parse(JSON.stringify(data))
    },

    busyEvidenceProfileTable (status) {
      this.evidence_profile_table_settings.isBusy = status
    },

    callGetStageOneData (status) {
      this.getStageOneData(status)
    },

    setShowEditExtractedDataInPlace (data) {
      this.showEditExtractedDataInPlace = data
    }
  }
}
</script>

<style lang="scss" scoped>
div {
  :deep(.navlink) {
    padding: 0.5rem 0.9rem;
  }

  :deep(a.return) {
    font-size: 1.2rem;
  }

  :deep(h3) {
    span {
      font-size: 1.55rem;

      &.title-finding {
        font-weight: 300;
      }
    }
  }

  :deep(#assessments.table) {
    thead {
      th {
        width: 19%;

        &:first-child {
          width: 2%;
        }

        &:last-child {
          width: 3%;
        }
      }
    }
  }

  :deep(#assessments-print.table) {
    thead {
      th {
        &:first-child {
          width: 2%;
        }

        &:nth-child(2) {
          width: 35%;
        }

        &:last-child {
          width: 15%;
        }
      }
    }
  }

  :deep(.table) {
    tbody {
      td {
        div {
          li {
            font-size: 0.8rem;
            padding-top: 0.4rem;
            list-style-type: none;
          }
        }
      }
    }
  }

  :deep(#extracted.table) {
    thead {
      th {
        &:last-child {
          text-align: right;
          width: 13%;
        }
      }
    }
  }

  :deep(.table-small-font) {
    font-size: 14px;

    &.extracted-data {
      thead {
        th {
          &:last-child {
            width: 3%;
          }
        }
      }
    }
  }

  :deep(.reference-txt) {
    font-size: 12px;
  }

  :deep(#span-txt) {
    font-size: 2rem;
  }

  :deep(label) {
    b {
      font-weight: bold;
    }
  }
}
</style>
