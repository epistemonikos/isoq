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
      :list="list"></edit-header-list>
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
        ></edit-list-actions-buttons>
      <b-row
        class="sticky-top"
        style="background-color: #fff; padding-bottom: 0.3rem"
        v-if="mode==='edit'">
        <b-col
          class="d-print-none"
          cols="12">
          <b-nav class="mt-2">
            <b-nav-item disabled>Navigate this page:</b-nav-item>
            <b-nav-item href="#evidence-profile">
              Evidence Profile
              <span
                v-if="ui.adequacy.chars_of_studies.display_warning || ui.methodological_assessments.display_warning || ui.adequacy.extracted_data.display_warning || (project.review_question === '') ? true : false || (project.inclusion === '') ? true: false || (project.exclusion === '') ? true: false"
                class="text-danger"
                v-b-tooltip.hover title="Data are missing. Click link to see what's missing.">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
            <b-nav-item href="#characteristics-of-studies">
              Characteristics of Studies
              <span
                v-if="ui.adequacy.chars_of_studies.display_warning"
                class="text-danger"
                v-b-tooltip.hover title="Data are missing. Click link to see what's missing.">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
            <b-nav-item href="#methodological-assessments">
              Methodological Assessments
              <span
                v-if="ui.methodological_assessments.display_warning"
                class="text-danger"
                v-b-tooltip.hover title="Data are missing. Click link to see what's missing.">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
            <b-nav-item href="#extracted-data">
              Extracted Data
              <span
                v-if="ui.adequacy.extracted_data.display_warning"
                class="text-danger"
                v-b-tooltip.hover title="Data are missing. Click link to see what's missing.">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
          </b-nav>
        </b-col>
      </b-row>
      <b-row
        class="justify-content-end"
        v-if="mode==='edit' && checkPermissions(list.organization)">
        <b-col
          cols="12"
          md="3">
            <b-button
              class="mt-2"
              @click="changeMode"
              variant="outline-success"
              block>
              Print or Export
            </b-button>
        </b-col>
      </b-row>

      <b-row class="mt-4">
        <b-col cols="12">
          <!--<b-tabs>-->
            <!-- Evidence Profile-->
            <!--<b-tab :title="$t('Evidence Profile')">-->
              <div id="progress-status"
                v-if="mode==='edit'"
                class="d-print-none">
                <h5>Progress status <span v-b-tooltip.hover title="This progress bar shows you how far along you are in making your GRADE-CERQual assessment of confidence. You have 5 assessments to make in total. Firstly, an assessment for each of the 4 GRADE-CERQual components, and lastly the overall assessment.">*</span></h5>
                <p v-if="list.cerqual.option !== null">
                  Your GRADE-CERQual assessment has been added to the iSoQ for this finding. Click “return to iSoQ table” above to view it
                </p>
                <b-progress
                  :value="status_evidence_profile.value"
                  :max="status_evidence_profile.max"
                  :variant="status_evidence_profile.variant"
                  class="mb-3">
                </b-progress>
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
                @callGetFinding="callGetFinding"
                @setShowEditExtractedDataInPlace="setShowEditExtractedDataInPlace"
                @getExtractedData="getExtractedData"
              ></evidence-profile-table>

            <table-chars-of-studies
              :ui="ui"
              :show="show"
              :mode="mode"
              :list="list"
              :permission="checkPermissions(list.organization)"
              :charsOfStudies="characteristics_studies"
              :refsWithTitle="refsWithTitle"
              :showParagraph="true"></table-chars-of-studies>

            <table-meth-assessments
              :ui="ui"
              :show="show"
              :mode="mode"
              :list="list"
              :permission="checkPermissions(list.organization)"
              :methAssessments="meth_assessments"
              :refsWithTitle="refsWithTitle"
              :showParagraph="true"></table-meth-assessments>

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
              @getExtractedData="getExtractedData"></table-extracted-data>

            <template v-if="Object.prototype.hasOwnProperty.call(this.project, 'license_type') && this.project.is_public">
              <div class="mt-5 alert alert-info" role="alert">
                <h5>License type</h5>
                <p>{{ theLicense(this.project.license_type) }}</p>
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
import Commons from '../../utils/commons'
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

export default {
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
    this.getList()
  },
  methods: {
    checkPermissions: function (organizationId, type = 'can_write') {
      if (this.$store.state.user.personal_organization === organizationId) {
        return true
      }
      if (!Object.prototype.hasOwnProperty.call(this.project, type)) {
        return false
      }
      if (this.project[type].includes(this.$store.state.user.id)) {
        return true
      }
      return false
    },
    changeMode: function () {
      this.mode = (this.mode === 'edit') ? 'view' : 'edit'
    },
    parseReference: (reference, onlyAuthors = false, hasSemicolon = true) => {
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
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
        return result
      } else {
        return result
      }
    },
    getAllReferences: function (references) {
      let _references = references
      let _refs = []
      let _refsWithTitles = []
      for (let reference of _references) {
        _refs.push({
          'id': reference.id,
          'content': this.parseReference(reference, true)
        })
        _refsWithTitles.push({
          'id': reference.id,
          'content': this.parseReference(reference, false)})
      }

      this.references = _refs.sort((a, b) => a.content.localeCompare(b.content))
      this.refsWithTitle = _refsWithTitles.sort((a, b) => a.content.localeCompare(b.content))
    },
    getList: function (fromModal = false) {
      axios.get('/api/getLists', {params: {list_id: this.$route.params.id}})
        .then((response) => {
          this.list = JSON.parse(JSON.stringify(response.data[0]))
          // this.list.sources = []
          // this.evidence_profile = []
          // this.extracted_data = {
          //   fields: [],
          //   items: []
          // }
          const project = JSON.parse(JSON.stringify(response.data[0]['project']))
          const references = JSON.parse(JSON.stringify(response.data[0]['fullreferences']))
          const characteristics = JSON.parse(JSON.stringify(response.data[0]['characteristics']))
          const assessments = JSON.parse(JSON.stringify(response.data[0]['assessments']))
          const extractedData = JSON.parse(JSON.stringify(response.data[0]['extracted_data']))
          this.getProject(project)
          this.getAllReferences(references)
          this.getFinding(fromModal)
          this.getCharsOfStudies(characteristics[0])
          this.getMethAssessments(assessments)
          this.getExtractedData(extractedData)

          this.evidence_profile_table_settings.isBusy = false
          const elementScroll = document.getElementsByName('evidence-profile')[0]

          window.scrollTo({ top: elementScroll.offsetParent.offsetTop, behavior: 'smooth' })
        })
    },
    updateMyData: function () {
      let _extractedData = []
      const params = {
        organization: this.list.organization,
        list_id: this.list.id
      }
      axios.get(`/api/isoqf_extracted_data`, {params})
        .then((response) => {
          if (response.data.length && response.data[0].items.length && this.references.length > response.data[0].items.length) {
            let _items = response.data[0].items
            let _itemsChecks = []
            for (let item of _items) {
              _itemsChecks.push(item.ref_id)
            }
            for (let reference of this.references) {
              if (!_itemsChecks.includes(reference.id)) {
                _extractedData.push({ref_id: reference.id, authors: reference.content})
              }
            }
            _items.push(..._extractedData)
            let params = {
              items: _items
            }
            axios.patch(`/api/isoqf_extracted_data/${response.data[0].id}`, params)
              .then(() => {
                this.getExtractedData()
              })
          }
        })
    },
    getProject: function (project) {
      this.project = project
      if (!Object.prototype.hasOwnProperty.call(this.project, 'inclusion')) {
        this.project.inclusion = ''
      }
      if (!Object.prototype.hasOwnProperty.call(this.project, 'exclusion')) {
        this.project.exclusion = ''
      }
    },
    renderReference: function (reference) {
      let authors = ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length === 1) {
          authors = reference.authors[0] + '. ' + reference.publication_year + '; '
        } else if (reference.authors.length < 3) {
          authors = reference.authors[0] + ', ' + reference.authors[1] + '. ' + reference.publication_year + '; '
        } else {
          authors = reference.authors[0] + ' et al., ' + reference.publication_year + '; '
        }
      }
      return authors
    },
    getReferences: function () {
      let promises = []
      for (let ref of this.list.references) {
        promises.push(axios.get(`/api/isoqf_references/${ref}`))
      }
      axios.all(promises)
        .then(axios.spread((...responses) => {
          let authors = []
          for (let response of responses) {
            const reference = response.data

            authors.push(this.renderReference(reference))
          }
          this.evidence_profile = [Object.assign({}, this.evidence_profile, { references: authors })]
        }))
        .catch((error) => {
          this.printErrors(error)
        })
    },
    getFinding: function (fromModal = false) {
      const finding = this.list.findings
      if (finding.length) {
        this.findings = JSON.parse(JSON.stringify(finding[0]))
        this.findings.isoqf_id = this.list.sort
        this.evidence_profile = []
        if (Object.prototype.hasOwnProperty.call(this.findings, 'evidence_profile')) {
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
        this.updateMyData()
      }
      this.getStatus()
      // this.getExtractedData()
      this.evidence_profile_table_settings.isBusy = false
    },
    getStatus: function () {
      this.status_evidence_profile.value = 0
      if (this.evidence_profile[0].methodological_limitations.option !== null) {
        this.status_evidence_profile.value = this.status_evidence_profile.value + 20
      }
      if (this.evidence_profile[0].coherence.option !== null) {
        this.status_evidence_profile.value = this.status_evidence_profile.value + 20
      }
      if (this.evidence_profile[0].adequacy.option !== null) {
        this.status_evidence_profile.value = this.status_evidence_profile.value + 20
      }
      if (this.evidence_profile[0].relevance.option !== null) {
        this.status_evidence_profile.value = this.status_evidence_profile.value + 20
      }
      if (this.evidence_profile[0].cerqual.option !== null) {
        this.status_evidence_profile.value = this.status_evidence_profile.value + 20
      }
      if (this.status_evidence_profile.value <= 40) {
        this.status_evidence_profile.variant = 'danger'
      }
      if (this.status_evidence_profile.value > 40 && this.status_evidence_profile.value <= 80) {
        this.status_evidence_profile.variant = 'warning'
      }
      if (this.status_evidence_profile.value === 100) {
        this.status_evidence_profile.variant = 'success'
      }
    },
    getCharsOfStudies: function (characteristics) {
      if (characteristics.items.length) {
        let data = characteristics
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
    },
    getMethAssessments: function (assessments) {
      if (assessments.length) {
        const _references = JSON.parse(JSON.stringify(this.list.references))
        let data = assessments[0]
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
              if (data.fields.length > Object.keys(item).length) {
                haveContent++
              }
            }
          }
        }
        if (data.fields.length < 3) {
          haveContent++
        }
        this.ui.methodological_assessments.display_warning = true
        if (!haveContent) {
          this.ui.methodological_assessments.display_warning = false
        }

        data.items = items

        let _fields = data.fields
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
    },
    getExtractedData: function (extractedData) {
      let localData = {id: null, fields: [], items: []}
      if (extractedData.length) {
        localData = extractedData[0]
        this.extracted_data = extractedData[0]
        localData.fields.push({key: 'actions', label: ''})
        let _fields = JSON.parse(JSON.stringify(localData.fields))
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
        extractedDataItems.sort(function (a, b) {
          if (a.authors < b.authors) {
            return -1
          }
          if (a.authors > b.authors) {
            return 1
          }
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
              if (Object.prototype.hasOwnProperty.call(item, 'column_0')) {
                if (item.column_0 === '') {
                  haveContent++
                }
              } else {
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
    },
    printErrors: function (error) {
      Commons.printErrors(error)
    },
    displaySelectedOption: function (option) {
      if (option === null) {
        return ''
      } else if (option >= 0) {
        return this.select_options[option].text
      } else {
        return ''
      }
    },
    theLicense: function (license) {
      return Commons.theLicense(license)
    },
    returnTo: function () {
      if (this.list.userEditing === this.$store.state.user.id) {
        const params = { editing: false, userEditing: '' }
        axios.patch(`/api/isoqf_lists/${this.$route.params.id}`, params)
          .then((response) => {
            this.list.editing = false
            this.list.userEditing = ''
            this.$router.push({name: 'viewProject', params: {org_id: this.list.organization, id: this.list.project_id}})
          })
          .catch((error) => {
            console.log(error)
          })
      } else {
        this.$router.push({name: 'viewProject', params: {org_id: this.list.organization, id: this.list.project_id}})
      }
    },
    modalDataChanged: function (data) {
      this.buffer_modal_stage_two = JSON.parse(JSON.stringify(data))
    },
    busyEvidenceProfileTable: function (status) {
      this.evidence_profile_table_settings.isBusy = status
    },
    callGetFinding: function (status) {
      this.getFinding(status)
    },
    setShowEditExtractedDataInPlace: function (data) {
      this.showEditExtractedDataInPlace = data
    }
  }
}
</script>

<style scoped>
  div >>>
    .navlink {
      padding: 0.5rem 0.9rem;
    }
  div >>>
    a.return {
      font-size: 1.2rem;
    }
  div >>>
    h3 span {
      font-size: 1.55rem
    }
  div >>>
    h3 span.title-finding {
      font-weight: 300;
    }
  div >>>
    #assessments.table thead th:first-child {
      width: 2%;
    }
  div >>>
    #assessments.table thead th:last-child {
      width: 3%;
    }
  div >>>
    #assessments.table thead th {
      width: 19%;
    }
  div >>>
    #assessments-print.table thead th:first-child {
      width: 2%;
    }
  div >>>
    #assessments-print.table thead th:nth-child(2) {
      width: 35%;
    }
  div >>>
    #assessments-print.table thead th:last-child {
      width: 15%;
    }
  div >>>
    .table tbody td div li {
      font-size: 0.8rem;
      padding-top: 0.4rem;
      list-style-type: none;
    }
  div >>>
    #extracted.table thead th:last-child {
      text-align: right;
      width: 13%;
    }
  div >>>
    .table-small-font {
      font-size: 14px;
    }
  div >>>
    .table-small-font.extracted-data thead th:last-child {
      width: 3%;
    }
  div >>>
    .reference-txt {
      font-size: 12px;
    }
  div >>>
    #span-txt {
      font-size: 2rem;
    }
  div >>>
    label b {
      font-weight: bold;
    }
  /* .extracted-data-table tbody tr td:last-child button {
    display: none;
  }
  .extracted-data-table tbody tr:hover td:last-child button {
    display: inline;
  } */
</style>
