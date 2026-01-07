<template>
  <div>
    <!-- Lock Modals -->
    <b-modal id="modal-lock-lost-sheet" title="Connection Lost" ok-only ok-title="Reload" @ok="reloadPage" no-close-on-backdrop no-close-on-esc hide-header-close>
        <div class="text-center">
            <font-awesome-icon icon="exclamation-triangle" size="3x" class="text-warning mb-3" />
            <p>{{ $t('lock.lock_lost_message') || 'The connection to the server was lost or another user has taken the edit lock. To prevent data loss, please reload the page.' }}</p>
        </div>
    </b-modal>
      <b-modal id="modal-lock-idle-sheet" title="Session Timeout" ok-only ok-title="Reload" @ok="reloadPage" no-close-on-backdrop no-close-on-esc hide-header-close>
        <div class="text-center">
            <font-awesome-icon icon="lock" size="3x" class="text-secondary mb-3" />
            <p>{{ $t('lock.idle_message') || 'You have been inactive for a while. To allow others to edit, your write access has been released. Please reload to resume editing.' }}</p>
        </div>
    </b-modal>
    <b-alert
      :show="editingUser.show"
      class="position-fixed fixed-bottom m-0 rounded-0"
      style="z-index: 2000;"
      variant="danger"
      dismissible
    >
      <span v-html="$t('soqf_table.user_editing', { first_name: editingUser.first_name, last_name: editingUser.last_name })"></span>
    </b-alert>

    <edit-header-list
      :organizationId="project.organization"
      :projectId="project.id"
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
            <b-nav-item disabled>{{ $t('worksheet_nav.navigate_page') }}</b-nav-item>
            <b-nav-item href="#evidence-profile">
              {{ $t('worksheet_nav.evidence_profile') }}
              <span
                v-if="ui.adequacy.chars_of_studies.display_warning || ui.methodological_assessments.display_warning || ui.adequacy.extracted_data.display_warning || (project.review_question === '') ? true : false || (project.inclusion === '') ? true: false || (project.exclusion === '') ? true: false"
                class="text-danger"
                v-b-tooltip.hover :title="$t('worksheet.tooltips.data_missing')">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
            <b-nav-item href="#characteristics-of-studies">
              {{ $t('worksheet.characteristics_of_studies') }}
              <span
                v-if="ui.adequacy.chars_of_studies.display_warning"
                class="text-danger"
                v-b-tooltip.hover :title="$t('worksheet.tooltips.data_missing')">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
            <b-nav-item href="#methodological-assessments">
              {{ $t('worksheet.methodological_assessments') }}
              <span
                v-if="ui.methodological_assessments.display_warning"
                class="text-danger"
                v-b-tooltip.hover :title="$t('worksheet.tooltips.data_missing')">
                <font-awesome-icon icon="exclamation-circle"></font-awesome-icon>
              </span>
            </b-nav-item>
            <b-nav-item href="#extracted-data">
              {{ $t('worksheet.extracted_data') }}
              <span
                v-if="ui.adequacy.extracted_data.display_warning"
                class="text-danger"
                v-b-tooltip.hover :title="$t('worksheet.tooltips.data_missing')">
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
              {{ $t('publish.print_export') }}
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
                <h5>{{ $t('worksheet.progress_status') }} <span v-b-tooltip.hover :title="$t('worksheet.tooltips.progress_bar')">*</span></h5>
                <p v-if="list.cerqual.option !== null">
                  {{ $t('worksheet.assessment_added_isoq') }}
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
                :show="show"
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
                :modePrintFieldObject="mode_print_fieldsObj"
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
                        :useCamelot="project.use_camelot"
                        :ui="ui"              :show="show"
              :mode="mode"
              :list="list"
              :permission="checkPermissions(list.organization)"
              :charsOfStudies="characteristics_studies"
              :refsWithTitle="refsWithTitle"
              :showParagraph="true"></table-chars-of-studies>

                      <table-meth-assessments
                        :useCamelot="project.use_camelot"
                        :ui="ui"              :show="show"
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
                <h5>{{ $t('project.license_type') }}</h5>
                <p>{{ theLicense(this.project.license_type) }}</p>
              </div>
            </template>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import Commons from '../../utils/commons'
const editHeaderList = () => import(/* webpackChunkName: "editHeaderList" */'./editListHeader')
const editListActionButtons = () => import('./editListActionButtons.vue')
const editListEvidenceProfile = () => import('./editListEvidenceProfile.vue')
const editListCharsOfStudies = () => import('./editListCharsOfStudies.vue')
const editListMethAssessments = () => import('./editListMethAssessments.vue')
const editListExtractedData = () => import('./editListExtractedData.vue')

export default {
  components: {
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
        options: []
      },
      /** filters **/
      /** selectors **/
      select_options: [],
      level_confidence: [],
      /** selectors **/
      /** tables fields **/
      /** tables fields **/
      initial_modal_stage_one: {
        id: null,
        name: '',
        list_id: '',
        organization: ''
      },
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
      editingUser: {
        first_name: '',
        last_name: '',
        show: false
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
        cerqual_lists: [],
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
      lockInfo: {
        locked: false,
        lockedBy: null
      }
    }
  },
  mounted () {
    this.updateTranslations()
    this.getList()
    window.addEventListener('lock-lost', this.handleLockLost)
    window.addEventListener('lock-idle', this.handleIdle)
    window.addEventListener('axios-refresh-lock', this.handleLockLost)
  },
  beforeDestroy () {
    LockService.release()
    window.removeEventListener('lock-lost', this.handleLockLost)
    window.removeEventListener('lock-idle', this.handleIdle)
    window.removeEventListener('axios-refresh-lock', this.handleLockLost)
  },
  methods: {
    updateTranslations: function () {
      this.show.options = [
        { text: this.$t('worksheet.characteristics_of_studies'), value: 'cs' },
        { text: this.$t('worksheet.methodological_assessments'), value: 'ma' },
        { text: this.$t('worksheet.extracted_data'), value: 'ed' }
      ]
      this.select_options = [
        { value: 0, text: this.$t('worksheet.options.no_concerns') },
        { value: 1, text: this.$t('worksheet.options.minor_concerns') },
        { value: 2, text: this.$t('worksheet.options.moderate_concerns') },
        { value: 3, text: this.$t('worksheet.options.serious_concerns') },
        { value: null, text: this.$t('worksheet.options.undefined') }
      ]
      this.level_confidence = [
        { value: 0, text: this.$t('worksheet.options.high_confidence') },
        { value: 1, text: this.$t('worksheet.options.moderate_confidence') },
        { value: 2, text: this.$t('worksheet.options.low_confidence') },
        { value: 3, text: this.$t('worksheet.options.very_low_confidence') },
        { value: null, text: this.$t('worksheet.options.undefined') }
      ]
    },
    filterItemsByReferences: function (items, references, fieldsLength) {
      const referencesSet = new Set(references)
      const excludedKeys = new Set(['authors', 'ref_id'])
      let haveContent = 0
      const filteredItems = []

      for (const item of items) {
        if (!referencesSet.has(item.ref_id)) continue

        filteredItems.push(item)

        const itemKeys = Object.keys(item)
        for (const key of itemKeys) {
          if (!excludedKeys.has(key) && item[key] === '') {
            haveContent++
          }
        }

        if (fieldsLength > itemKeys.length) {
          haveContent++
        }
      }

      return { filteredItems, haveContent }
    },
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
    parseReference: function (reference, onlyAuthors = false, hasSemicolon = true) {
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''
      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length < 1) {
          result = ' ' + this.$t('common.no_authors')
        } else if (reference.authors.length === 1) {
          result = reference.authors[0].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else if (reference.authors.length === 2) {
          result = reference.authors[0].split(',')[0] + ' & ' + reference.authors[1].split(',')[0] + ' ' + reference.publication_year + semicolon
        } else {
          result = reference.authors[0].split(',')[0] + this.$t('common.et_al') + reference.publication_year + semicolon
        }
        if (!onlyAuthors) {
          result = result + reference.title
        }
        return result
      } else {
        return result
      }
    },
    getAllReferences: function () {
      let _references = JSON.parse(JSON.stringify(this.list.fullreferences))
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
      Api.get('/getLists', {id: this.$route.params.id})
        .then((response) => {
          if (response.data && response.data.length > 0) {
            this.list = JSON.parse(JSON.stringify(response.data[0]))
            
            // Attempt lock if we have write permissions
            // Note: We need 'project' loaded to check permissions properly, or check list.organization
            if (this.checkPermissions(this.list.organization)) {
                 this.attemptLock()
            }
          } else {
            console.log('Empty list response')
          }
          this.getProject()
          this.getAllReferences()
          this.getFinding(fromModal)
          this.getCharsOfStudies()
          this.getMethAssessments()
          this.getExtractedData()

          this.evidence_profile_table_settings.isBusy = false
          const elementScroll = document.getElementsByName('evidence-profile')[0]

          window.scrollTo({ top: elementScroll.offsetParent.offsetTop, behavior: 'smooth' })
        })
    },
    updateMyData: function () {
      let _extractedData = []
      const params = {
        finding_id: this.findings.id
      }
      Api.get(`/isoqf_extracted_data`, params)
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
            Api.patch(`/isoqf_extracted_data/${response.data[0].id}`, params)
              .then(() => {
                this.getExtractedData()
              })
          }
        })
    },
    getProject: function () {
      this.project = JSON.parse(JSON.stringify(this.list.project))
      if (!Object.prototype.hasOwnProperty.call(this.project, 'inclusion')) {
        this.project.inclusion = ''
      }
      if (!Object.prototype.hasOwnProperty.call(this.project, 'exclusion')) {
        this.project.exclusion = ''
      }
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
        } else {
          // Create a default evidence_profile structure if it doesn't exist
          this.evidence_profile.push({
            isoqf_id: this.list.sort,
            cerqual: { explanation: '', option: null },
            name: '',
            title: '',
            notes: '',
            coherence: { explanation: '', option: null },
            methodological_limitations: { explanation: '', option: null },
            references: [],
            relevance: { explanation: '', option: null },
            adequacy: { explanation: '', option: null }
          })
        }
        // Sync references from list.references to evidence_profile.references
        // The source of truth for references is list.references
        this.evidence_profile[0].references = this.list.references || []
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
    getCharsOfStudies: function () {
      const characteristics = JSON.parse(JSON.stringify(this.list.characteristics))
      if (characteristics.length) {
        let data = characteristics[0]

        const { filteredItems, haveContent } = this.filterItemsByReferences(
          data.items,
          this.list.references,
          data.fields.length
        )

        const hasWarning = haveContent > 0 || data.fields.length < 3
        this.ui.adequacy.chars_of_studies.display_warning = hasWarning
        this.ui.relevance.chars_of_studies.display_warning = hasWarning

        data.items = filteredItems
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
    getMethAssessments: function () {
      const assessments = JSON.parse(JSON.stringify(this.list.assessments))
      if (assessments.length) {
        let data = assessments[0]

        const { filteredItems, haveContent } = this.filterItemsByReferences(
          data.items,
          this.list.references,
          data.fields.length
        )

        const hasWarning = haveContent > 0 || data.fields.length < 3
        this.ui.methodological_assessments.display_warning = hasWarning

        data.items = filteredItems
        data.fieldsObj = data.fields.filter(field => field.key !== 'ref_id')

        this.meth_assessments = data
      } else {
        this.meth_assessments = { nroOfColumns: 1, fields: [], items: [] }
      }
    },
    getExtractedData: function (status = false) {
      let extractedData = JSON.parse(JSON.stringify(this.list.extracted_data))
      if (status) {
        Api.get(`/isoqf_extracted_data`, {finding_id: this.findings.id})
          .then((response) => {
            extractedData = response.data
            this.processExtractedData(extractedData)
          })
      }
      this.processExtractedData(extractedData)
    },
    processExtractedData: function (extractedData) {
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
        const referencesSet = new Set(_references)

        extractedDataItems.forEach((item, index) => {
          if (referencesSet.has(item.ref_id)) {
            _items.push({
              ref_id: item.ref_id,
              authors: item.authors,
              column_0: item.column_0,
              index: index
            })

            const hasEmptyOrMissingColumn = !item.column_0
            if (hasEmptyOrMissingColumn) {
              haveContent++
            }
          }
        })

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
      } else if (option >= 0 && this.select_options && this.select_options[option]) {
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
        Api.patch(`/isoqf_lists/${this.$route.params.id}`, params)
          .then((response) => {
            this.list.editing = false
            this.list.userEditing = ''
            this.$router.push({name: 'viewProject', params: {org_id: this.list.organization, id: this.list.project_id}})
          })
          .catch((error) => {
            this.printErrors(error)
          })
      } else {
        this.$router.push({name: 'viewProject', params: {org_id: this.list.organization, id: this.list.project_id}})
      }
    },

    async attemptLock () {
      // Use list.project_id if available, otherwise wait for getProject?
      // list object has project_id
      if (this.list.project_id) {
        const res = await LockService.acquire(this.list.project_id)
        if (res.success) {
            this.lockInfo.locked = true
        } else if (res.lockedBy) {
            this.lockInfo.locked = false
            this.lockInfo.lockedBy = res.lockedBy
            this.mode = 'view'
            this.$bvToast.toast(this.$t('lock.project_locked_by', { user: res.lockedBy }), {
            title: this.$t('lock.locked_title'),
            variant: 'warning',
            solid: true,
            noAutoHide: true
            })
        }
      }
    },
    handleLockLost (e) {
      if ((e.detail && e.detail.projectId === this.list.project_id) || e.type === 'axios-refresh-lock') {
        this.mode = 'view'
        this.$bvModal.show('modal-lock-lost-sheet')
      }
    },
    handleIdle (e) {
        if (e.detail && e.detail.projectId === this.list.project_id) {
        this.mode = 'view'
        this.$bvModal.show('modal-lock-idle-sheet')
      }
    },
    reloadPage () {
        window.location.reload()
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
  },
  mounted () {
    this.updateTranslations()
    this.getList()
  },
  watch: {
    '$i18n.locale' (val) {
      this.updateTranslations()
    },
    '$route' (to, from) {
      if (to.params.id !== from.params.id) {
        this.getList()
      }
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
