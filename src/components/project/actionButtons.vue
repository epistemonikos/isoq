<template>
  <div>
    <b-row>
      <b-col
        cols="12">
        <b-row
          class="d-print-none justify-content-end mb-2">
          <b-col
            v-if="mode==='view'"
            cols="12"
            md="3"
            xl="3">
            <b-dropdown
              id="export-button"
              class="mt-1"
              block
              variant="outline-secondary"
              right
              :text="$t('actionButtons.export')">
              <b-dropdown-item @click="ExportToWord(project.name)">{{ $t('actionButtons.to_ms_word') }}</b-dropdown-item>
              <b-dropdown-item @click="exportToRIS">{{ $t('actionButtons.the_references') }}</b-dropdown-item>
            </b-dropdown>
          </b-col>
          
          <b-col
            v-if="mode==='view'"
            cols="12"
            md="3"
            xl="3">
              <b-button
                class="mt-1"
                variant="outline-info"
                block
                @click="printiSoQ">
                {{ $t('actionButtons.print_save_pdf') }}
              </b-button>
          </b-col>
          <b-col
            v-if="mode==='view' && !preview"
            cols="12"
            md="3"
            xl="3">
              <b-button
                class="mt-1"
                @click="changeMode"
                variant="primary"
                block>
                <font-awesome-icon icon="edit"></font-awesome-icon>
                {{ $t('actionButtons.edit') }}
              </b-button>
          </b-col>
          <b-col
            v-if="mode==='edit'"
            cols="12"
            md="3"
            xl="3">
              <b-button
                v-if="canWrite"
                class="mt-1"
                @click="modalChangePublicStatus"
                :variant="(project.is_public) ? 'outline-primary' : 'primary'"
                block
                v-b-tooltip.hover :title="$t('actionButtons.publish_tooltip')">
                <span v-if="project.is_public">{{ $t('actionButtons.published') }}</span><span v-else>{{ $t('actionButtons.publish') }}</span>
              </b-button>
          </b-col>
          <b-col
            v-if="mode==='edit'"
            cols="12"
            md="3"
            xl="3">
              <b-button
                class="mt-1"
                @click="changeMode"
                variant="outline-success"
                block
                v-b-tooltip.hover :title="$t('actionButtons.view_mode_tooltip')">
                {{ $t('actionButtons.print_or_export') }}
              </b-button>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
    
    <!-- Publish Modal Component -->
    <PublishModal
      ref="publishModal"
      :project="project"
      :ui="ui"
      @getProject="$emit('getProject')"
      @uiPublishShowLoader="$emit('uiPublishShowLoader', $event)"
    />
  </div>
</template>

<script>
import axios from 'axios'
import { displayExplanation } from '../utils/commons'
import PublishModal from '@/components/project/PublishModal'
import { getWordExportService } from '@/services/wordExportService'
import { getRisExportService } from '@/services/risExportService'
const videoHelp = () => import(/* webpackChunkName: "videohelp" */ '../videoHelp')

export default {
  name: 'actionButtons',
  props: {
    mode: {
      type: String,
      required: false,
      default: ''
    },
    preview: {
      type: Boolean,
      default: false
    },
    project: Object,
    canWrite: Boolean,
    permissions: Boolean,
    ui: Object,
    lists: Array,
    findings: Array,
    references: Array,
    charsOfStudies: Object,
    methodologicalTableRefs: Object,
    listsPrintVersion: Array,
    selectOptions: Array,
    cerqualConfidence: Array,
    printableItems: Array
  },
  components: {
    videoHelp,
    PublishModal
  },
  data () {
    return {
      exportService: getWordExportService(),
      risExportService: getRisExportService(),
      modalProject: {name: ''},
      yes_or_no: [
        { value: false, text: 'no' },
        { value: true, text: 'yes' }
      ],
      errors: [],
      state: {
        name: null,
        authors: null,
        author: null,
        author_email: null,
        review_question: null,
        published_status: null,
        url_doi: null,
        complete_by_author: null,
        lists_authors: null,
        public_type: null,
        license_type: null
      },
      errorsResponse: {
        message: '',
        items: []
      }
    }
  },
  watch: {
    'modalProject.name': function (val) {
      this.state.name = val.length > 0 ? null : false
    }
  },
  methods: {
    async ExportToWord(filename = '') {
      try {
        // Use listsPrintVersion as primary source for categories and order
        const findingsData = (this.listsPrintVersion && this.listsPrintVersion.length > 0)
          ? this.listsPrintVersion
          : this.findings

        // Prepare export data
        const data = {
          findings: findingsData, // Primary display list (includes categories)
          originalFindings: this.findings, // Detailed data source for enrichment
          references: this.references,
          lists: this.lists,
          listsPrintVersion: this.listsPrintVersion,
          printableItems: this.printableItems,
          charsOfStudies: this.charsOfStudies,
          methodologicalTableRefs: this.methodologicalTableRefs
        }

        // Use WordExportService with current locale
        await this.exportService.exportToWord(this.project, data, { 
          filename,
          locale: this.$i18n.locale 
        })

      } catch (error) {
        alert('Error al exportar: ' + error.message)
      }
    },
    modalChangePublicStatus: function () {
      this.$refs.publishModal.openModal()
    },
    changeMode: function () {
      this.$emit('changeMode', (this.mode === 'edit') ? 'view' : 'edit')
      if (this.mode === 'view') {
        this.$emit('changeTableSettings', {perPage: this.lists.length, currentPage: 1})
      } else {
        this.$emit('changeTableSettings', {perPage: 5, currentPage: 1})
      }
    },
    savePublicStatus: async function (event) {
      event.preventDefault()
      this.$emit('uiPublishShowLoader', true)
      let params = {}
      params.id = this.project.id
      params.public_type = this.modalProject.public_type
      const isModal = this.modalProject.isModal || false
      params.private = true
      params.is_public = false

      if (this.modalProject.public_type !== 'private') {
        params.private = false
        params.is_public = true
        params.license_type = this.modalProject.license_type
        if (this.modalProject.license_type === '' || this.modalProject.license_type === null) {
          this.state.license_type = false
          this.$emit('uiPublishShowLoader', false)
          return
        }
      } else {
        params.license_type = ''
      }

      if (this.modalProject.public_type !== 'private') {
        const canPublish = await axios.get('/api/project/can_publish', {params: {id: this.project.id, workspace: this.$route.params.org_id, isModal: isModal}})
        if (canPublish.data.status) {
          axios.patch('/api/publish', {params})
            .then(() => {
              this.modalProject = {name: ''}
              this.$emit('getProject')
              this.$emit('uiPublishShowLoader', false)
              this.$refs['modal-change-status'].hide()
            })
            .catch((error) => {
              // Error handling
            })
        } else {
          document.getElementById('modal-change-status___BV_modal_body_').scrollTo({ top: 0, behavior: 'smooth' })
          this.errorsResponse.message = canPublish.data.message
          this.$emit('uiPublishShowLoader', false)
        }
      } else {
        axios.patch('/api/publish', {params})
          .then(() => {
            this.modalProject = {name: ''}
            this.$emit('getProject')
            this.$emit('uiPublishShowLoader', false)
            this.$refs['modal-change-status'].hide()
          })
          .catch((error) => {
            // Error handling
          })
      }
    },
    exportToRIS: function () {
      this.risExportService.exportToRIS(this.references, {
        projectName: this.project.name
      })
    },
    printiSoQ: function () {
      window.print()
    },
    generateAuthorInfo: function () {
      let data = ''
      if (this.project.author.length) {
        data = this.project.author.toString()
        if (this.project.author_email.length) {
          const email = this.project.author_email.toString()
          data = data.concat(' - ' + email)
        }
      }

      return data
    },
    filteredPrintedData: function () {
      const items = this.listsPrintVersion
      return items.filter((item) => {
        if (this.printableItems.includes(item.id)) {
          return item
        }
      })
    },
    displaySelectedOption: function (option, type = '') {
      if (option === null) {
        return ''
      } else if (option >= 0) {
        if (type === 'cerqual') {
          return this.cerqualConfidence[option].text
        } else {
          return this.selectOptions[option].text
        }
      } else {
        return ''
      }
    },
    returnRefWithNames: function (array) {
      let authorsList = []
      for (const i in array) {
        for (const r of this.references) {
          if (r.id === array[i]) {
            authorsList.push(this.getAuthorsFormat(r.authors, r.publication_year))
          }
        }
      }
      authorsList.sort()
      let authors = ''
      for (let x in authorsList) {
        authors = authors + authorsList[x] + '; '
      }
      return authors
    },
    getAuthorsFormat: function (authors = [], pubYear = '') {
      if (authors.length) {
        const nroAuthors = authors.length
        if (nroAuthors === 1) {
          return authors[0].split(',')[0] + ' ' + pubYear
        } else if (nroAuthors === 2) {
          return authors[0].split(',')[0] + ' & ' + authors[1].split(',')[0] + ' ' + pubYear
        } else {
          return authors[0].split(',')[0] + ' et al. ' + ' ' + pubYear
        }
      } else {
        return 'author(s) not found'
      }
    },
    getExplanation: function (type, option, explanation) {
      return displayExplanation(type, option, explanation)
    },
    handleErrorClick: function (event) {
      if (event.target.tagName === 'A') {
        this.$refs['modal-change-status'].hide()
      }
    }
  },
  computed: {
    getLicense: {
      get: function () {
        if (!Object.prototype.hasOwnProperty.call(this.modalProject, 'license_type')) {
          return 'CC-BY-NC-ND'
        } else {
          if (this.modalProject.license_type === '') {
            return 'CC-BY-NC-ND'
          } else {
            return this.modalProject.license_type
          }
        }
      },
      set: function (license) {
        this.modalProject.license_type = license
      }
    }
  }
}
</script>

<style>

</style>
