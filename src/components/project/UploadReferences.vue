<template>
  <div>
    <h4 v-html="$t('references.step_title')"></h4>
    <p class="font-weight-light">
    {{ $t('references.must_import') }}
    </p>

    <!-- Incomplete operation recovery message -->
    <b-alert
      v-if="showRestorePrompt"
      show
      variant="info"
      dismissible>
      <h5>{{ $t('references.incomplete_upload') }}</h5>
      <p>{{ $t('references.restore_upload') }}</p>
      <b-button
        variant="outline-primary"
        class="mr-2"
        @click="restoreSavedProgress">
        {{ $t('references.restore_yes') }}
      </b-button>
      <b-button
        variant="outline-secondary"
        @click="clearSavedProgress">
        {{ $t('references.start_new') }}
      </b-button>
    </b-alert>

    <b-card no-body>
      <b-tabs id="import-data" card>
        <b-tab :title="$t('references.file_upload')" active>
          <b-row>
            <b-col
              cols="12">
              <videoHelp :txt="$t('references.file_upload')" tag="h4" urlId="449247762"></videoHelp>
            </b-col>
          </b-row>
          <p class="font-weight-light">
            {{ $t('references.export_step') }}
          </p>
          <p class="font-weight-light">
            {{ $t('references.import_step') }}
          </p>
          <b-form-file
            id="input-ris-file-key"
            ref="file-input"
            plain
            :disabled="!canEdit || !isOnline"
            v-b-tooltip.hover :title="isOnline ? '' : $t('offline.action_disabled')"
            @change="loadRefs($event)"></b-form-file>
          <b-button
            block
            :disabled="((fileReferences.length >= 1) ? false : true) || !isOnline"
            v-b-tooltip.hover :title="isOnline ? '' : $t('offline.action_disabled')"
            class="mt-2"
            variant="success"
            @click="saveReferences()">
            {{ $t('common.upload') }}
          </b-button>
          <p>
              {{ $t('references.reminder') }}
          </p>
        </b-tab>
        <b-tab :title="$t('references.import_pubmed')">
          <b-row>
            <b-col
              cols="12">
                <videoHelp :txt="$t('references.import_pubmed')" tag="h4" urlId="449248998"></videoHelp>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              sm="6">
              <p class="font-weight-light">
                {{ $t('references.pubmed_instructions') }}
              </p>
              <b-form-textarea
                v-model="pubmed_request"
                :placeholder="$t('references.pmid_example')"
                rows="6"
                max-rows="100"></b-form-textarea>
              <b-button
                v-if="canEdit && !btnSearchPubMed && pubmed_request.length"
                id="btnEpisteRequest"
                class="mt-2"
                block
                variant="outline-primary"
                :disabled="!isOnline"
                v-b-tooltip.hover :title="isOnline ? '' : $t('offline.action_disabled')"
                @click="PubmedRequest">{{ $t('common.find') }}</b-button>
              <b-button
                v-if="canEdit && (pubmed_requested.length || pubmedErrorImported.length)"
                :disabled="btnCleanDisabled"
                class="mt-1"
                block
                variant="outline-secondary"
                @click="PubmedRequestClean">{{ $t('common.clean') }}</b-button>
            </b-col>
            <b-col
              sm="6">
              <template
                v-if="pubmed_loading">
                <div class="text-center text-danger my-2">
                  <b-spinner class="align-middle"></b-spinner>
                  <strong>{{ $t('common.loading') }}</strong>
                </div>
              </template>
              <template
                v-else-if="pubmed_error">
                <p class="font-weight-light">
                  {{ $t('references.ref_not_found') }}
                  </p>
              </template>
              <template v-else>
                <template v-if="pubmed_requested.length">
                  <p>{{ $t('references.select_to_import') }}</p>
                  <ul class="list-unstyled">
                    <li v-for="(r, index) in pubmed_requested" :key="index">
                      <b-form-checkbox
                        :id="`checkbox-${index}`"
                        v-model="pubmed_selected"
                        :name="`checkbox-${index}`"
                        :value="index"
                        :disabled="r.disabled">
                          {{ r.title }}
                      </b-form-checkbox>
                    </li>
                  </ul>
                </template>
                <template v-if="pubmedErrorImported.length">
                  <p>{{ $t('references.invalid_pmids') }}</p>
                  <ul v-for="(id, index) in pubmedErrorImported" :key="index">
                    <li>{{ id }}</li>
                  </ul>
                </template>
                <b-button
                  v-if="pubmed_selected.length && canEdit"
                  variant="outline-success"
                  block
                  :disabled="!isOnline"
                  v-b-tooltip.hover :title="isOnline ? '' : $t('offline.action_disabled')"
                  @click="importReferences">{{ $t('references.import_references') }}</b-button>
              </template>
            </b-col>
          </b-row>
        </b-tab>
      </b-tabs>
    </b-card>
    <b-row
      class="mt-3 mb-3">
      <b-col
        cols="12">
        <b-card
          bg-variant="light">
          <template
            v-if="loadReferences">
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
              <strong>{{ $t('common.loading') }}</strong>
            </div>
          </template>
          <template v-else>
            <b-row v-if="!references.length">
              <b-col
                cols="12">
                <p class="text-center my-0">{{ $t('references.no_references') }}</p>
              </b-col>
            </b-row>
            <b-row v-else>
              <b-col
                cols="12">
                <p class="text-center my-0" v-html="$t('references.references_loaded', { count: references.length })"></p>
              </b-col>
            </b-row>
          </template>
        </b-card>
      </b-col>
    </b-row>
    <b-row v-if="references.length">
      <b-col>
        <b-card>
        <template v-if="appearMsgRemoveReferences">
          <b-row>
            <b-col
              cols="12">
              <p class="alert text-danger" v-html="$t('references.delete_all_warning')"></p>
            </b-col>
          </b-row>
          <b-row align-h="center">
            <b-col
              cols="3">
              <b-button
                block
                @click="removeAllReferences"
                variant="outline-danger">
                {{ $t('common.yes') }}
              </b-button>
            </b-col>
            <b-col
              cols="3">
              <b-button
                block
                @click="appearMsgRemoveReferences = false"
                variant="outline-success">
                {{ $t('common.no') }}
              </b-button>
            </b-col>
          </b-row>
        </template>
        <template v-else>
          <b-table
            sort-by="authors"
            responsive
            hover
            bordered
            borderless
            striped
            :fields="translatedReferencesTableFields"
            :items="references"
            head-variant="light"
            outlined>
            <template v-slot:cell(action)="data">
              <b-button
                v-if="canEdit"
                variant="outline-danger"
                @click="data.toggleDetails">
                <font-awesome-icon
                  icon="trash"></font-awesome-icon>
              </b-button>
            </template>
            <template v-slot:row-details="data">
              <b-card>
                <p>{{ $t('references.exclude_study_warning') }}</p>
                <p>{{ findRelatedFindings(data.item.id) }}</p>
                <p>{{ $t('references.confirm_delete') }}</p>
                <div>
                  <b-row align-h="center">
                    <b-col cols="3">
                      <b-button
                        block
                        variant="outline-success"
                        @click="data.toggleDetails">{{ $t('common.no') }}</b-button>
                    </b-col>
                    <b-col cols="3">
                      <b-button
                        block
                        variant="outline-danger"
                        @click="confirmRemoveReferenceById(data.item.id)">{{ $t('common.yes') }}</b-button>
                    </b-col>
                  </b-row>
                </div>
              </b-card>
            </template>
          </b-table>
          <div v-if="canEdit" class="mt-2">
            <b-button
            @click="confirmRemoveAllReferences($event)"
              >{{ $t('references.delete_all') }}</b-button>
          </div>
        </template>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import Api from '@/utils/Api'
const videoHelp = () => import('@/components/videoHelp.vue')

export default {
  name: 'UploadReferences',
  props: {
    canEdit: Boolean,
    loadReferences: Boolean,
    references: Array,
    episteResponse: Array,
    lists: Array,
    charsOfStudies: Object,
    methodologicalTableRefs: Object,
    useCamelot: {
      type: Boolean,
      default: false
    }
  },
  components: {
    videoHelp
  },
  data () {
    return {
      pre_references: '',
      fileReferences: [],
      pubmed_request: '',
      pubmed_requested: [],
      pubmed_selected: [],
      pubmed_loading: false,
      pubmed_error: false,
      pubmedErrorImported: [],
      pubmed_response: [],
      btnSearchPubMed: false,
      localReferences: [],
      btnCleanDisabled: true,
      disableBtnRemoveAllRefs: false,
      appearMsgRemoveReferences: false,
      operationId: null,
      uploadProgress: '',
      showRestorePrompt: false,
      savedProgress: null,
      fields_references_table:
        [
          {
            key: 'authors',
            label: 'Author(s)',
            formatter: (value, key, item) => this.formatAuthors(item.authors)
          },
          { key: 'title', label: 'Title' },
          { key: 'publication_year', label: 'Year' },
          {
            key: 'id',
            label: 'Related to review finding(s)',
            formatter: value => {
              let findings = []
              for (let list of this.lists) {
                for (let ref of list.raw_ref) {
                  if (ref.id === value) {
                    if (Object.prototype.hasOwnProperty.call(list, 'cnt')) {
                      findings.push(`#${list.cnt}`)
                    } else {
                      findings.push(`#${list.sort}`)
                    }
                  }
                }
              }
              return findings.join(', ')
            }
          },
          { key: 'action', label: '' }
        ]
    }
  },
  created () {
    this.checkIncompleteOperations()
  },
  computed: {
    translatedReferencesTableFields: function () {
      return [
        {
          key: 'authors',
          label: this.$t('table_headers.authors'),
          formatter: (value, key, item) => this.formatAuthors(item.authors)
        },
        { key: 'title', label: this.$t('table_headers.title') },
        { key: 'publication_year', label: this.$t('table_headers.year') },
        {
          key: 'id',
          label: this.$t('table_headers.related_to_findings'),
          formatter: value => {
            let findings = []
            for (let list of this.lists) {
              for (let ref of list.raw_ref) {
                if (ref.id === value) {
                  if (Object.prototype.hasOwnProperty.call(list, 'cnt')) {
                    findings.push(`#${list.cnt}`)
                  } else {
                    findings.push(`#${list.sort}`)
                  }
                }
              }
            }
            return findings.join(', ')
          }
        },
        { key: 'action', label: this.$t('table_headers.action') }
      ]
    }
  },
  methods: {
    formatAuthors (authors) {
      if (!authors || !authors.length) return this.$t('references.author_not_found')

      if (authors.length === 1) {
        return authors[0].split(',')[0]
      } else if (authors.length === 2) {
        return authors[0].split(',')[0] + ' & ' + authors[1].split(',')[0]
      } else {
        return authors[0].split(',')[0] + ' et al.'
      }
    },
    storeProgress () {
      const progress = {
        fileReferences: this.fileReferences,
        timestamp: Date.now()
      }
      localStorage.setItem('reference-upload-progress', JSON.stringify(progress))
    },
    checkIncompleteOperations () {
      const saved = localStorage.getItem('reference-upload-progress')
      if (saved) {
        try {
          const progress = JSON.parse(saved)
          if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
            this.showRestorePrompt = true
            this.savedProgress = progress
          } else {
            localStorage.removeItem('reference-upload-progress')
          }
        } catch (e) {
          console.error('Error parsing saved progress', e)
          localStorage.removeItem('reference-upload-progress')
        }
      }
    },
    restoreSavedProgress () {
      if (this.savedProgress && this.savedProgress.fileReferences) {
        this.fileReferences = this.savedProgress.fileReferences
        this.showRestorePrompt = false
      }
    },
    clearSavedProgress () {
      localStorage.removeItem('reference-upload-progress')
      this.showRestorePrompt = false
    },
    generateOperationId () {
      return Date.now() + '-' + Math.random().toString(36).substring(2)
    },
    saveCheckpoint (data) {
      localStorage.setItem('reference-upload-checkpoint', JSON.stringify({
        timestamp: Date.now(),
        ...data
      }))
    },
    getProject: function () {
      this.$emit('CallGetProject')
    },
    loadRefs: function (event) {
      if (!event.target.files || !event.target.files[0]) return

      const file = event.target.files[0]
      this.uploadProgress = 'Leyendo archivo...'

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          this.uploadProgress = 'Procesando referencias...'
          this.pre_references = e.target.result
          const lineCount = this.pre_references.split(/\r\n|\n/).length
          console.log(`Archivo cargado: ${lineCount} líneas para procesar`)
        } catch (error) {
          console.error('Error processing file:', error)
          this.uploadProgress = `Error: ${error.message}`
        }
      }

      reader.onerror = (e) => {
        console.error('Error reading file:', e)
        this.uploadProgress = 'Error al leer el archivo'
      }

      reader.readAsText(file)
    },
    uploadRisFile: async function (file) {
      if (!file) return

      this.$emit('statusLoadReferences', true)
      const formData = new FormData()
      formData.append('risFile', file)
      formData.append('projectId', this.$route.params.id)
      formData.append('organization', this.$route.params.org_id)

      try {
        const response = await Api.post('/isoqf_references/process-ris', formData)

        if (response.data && response.data.references) {
          this.localReferences = response.data.references
          const _references = JSON.parse(JSON.stringify(this.localReferences))
          
          if (this.useCamelot) {
            await this.handleCamelotAssessments(_references)
            await this.handleCamelotCharacteristics(_references)
          }
          
          await this.prefetchDataForExtractedDataUpdate(_references)
          this.msgUploadReferences = response.data.message || `${response.data.references.length} references have been added.`
        }

        this.pre_references = ''
        this.fileReferences = []
        this.$refs['file-input'].reset()
        localStorage.removeItem('reference-upload-progress')
        this.$emit('CallGetReferences', false)
      } catch (error) {
        console.error('Error uploading RIS file', error)
        this.$emit('statusLoadReferences', false)
      }
    },
    requestsImportReferences: function (ref) {
      return Api.post(`/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`, ref)
    },
    saveReferences: async function (from = '') {
      this.$emit('statusLoadReferences', true)
      try {
        if (this.$refs['file-input'] && this.$refs['file-input'].$el &&
            this.$refs['file-input'].$el.files && this.$refs['file-input'].$el.files[0]) {
          return this.uploadRisFile(this.$refs['file-input'].$el.files[0])
        }

        let references = []
        if (from === '') {
          references = this.fileReferences
          this.storeProgress()
        } else {
          const _r = []
          for (const index of this.episte_selected) {
            const content = JSON.parse(JSON.stringify(this.episteResponse[index].content))
            content.publication_year = content.year
            delete content.year
            content.isbn_issn = content.publication.ISSN
            if (content.publication.type === 'journal') {
              content.type = 'JOUR'
            }
            _r.push(content)
          }
          references = _r
        }

        this.operationId = this.generateOperationId()

        const batchSize = 10
        const batches = []
        for (let i = 0; i < references.length; i += batchSize) {
          batches.push(references.slice(i, i + batchSize))
        }

        let successCount = 0
        let failedItems = []

        for (let i = 0; i < batches.length; i++) {
          this.uploadProgress = `Procesando lote ${i + 1}/${batches.length}...`

          this.saveCheckpoint({
            completedBatches: i,
            totalBatches: batches.length,
            failedItems
          })

          try {
            const promises = batches[i].map(ref => {
              const refWithProject = { ...ref }
              refWithProject.organization = this.$route.params.org_id
              refWithProject.project_id = this.$route.params.id
              return this.requestsImportReferences(refWithProject)
            })

            const responses = await Promise.all(promises)

            for (const response of responses) {
              if (response && response.data) {
                this.localReferences.push(response.data)
                successCount++
              }
            }
          } catch (error) {
            failedItems = [...failedItems, ...batches[i].map(r => r.title || 'Referencia sin título')]
          }
        }

        if (this.localReferences.length) {
          const _references = JSON.parse(JSON.stringify(this.localReferences))
          
          if (this.useCamelot) {
            await this.handleCamelotAssessments(_references)
            await this.handleCamelotCharacteristics(_references)
          }
          
          await this.prefetchDataForExtractedDataUpdate(_references)
        }

        this.msgUploadReferences = `${successCount} referencias añadidas. ${failedItems.length ? `${failedItems.length} fallaron.` : ''}`
        this.pre_references = ''
        this.fileReferences = []
        this.$refs['file-input'].reset()

        localStorage.removeItem('reference-upload-checkpoint')
        localStorage.removeItem('reference-upload-progress')

        this.$emit('CallGetReferences', false)
      } catch (error) {
        console.error('saveReferences error', error)
        this.$emit('statusLoadReferences', false)
      }
    },
    PubmedRequest: function () {
      this.btnSearchPubMed = true
      this.pubmed_loading = true
      this.pubmed_error = false
      this.pubmed_response = []
      this.pubmedErrorImported = []
      const allLines = this.pubmed_request.split(/\r\n|\n/)
      this.processPubMedRequest(allLines)
    },
    processPubMedRequest: async function (allLines = []) {
      try {
        const validLines = allLines
          .map(line => line.trim())
          .filter(line => line && !isNaN(line) && line.length >= 7)

        if (validLines.length === 0) {
          console.log('No valid PubMed IDs found')
          this.pubmed_loading = false
          this.btnSearchPubMed = false
          this.btnCleanDisabled = false
          return
        }

        const batchSize = 5
        for (let i = 0; i < validLines.length; i += batchSize) {
          const batch = validLines.slice(i, i + batchSize)
          const promises = batch.map(pubMedId => this.apiPubMed(pubMedId))

          try {
            const responses = await Promise.all(promises)

            responses.forEach((response, index) => {
              const pubMedId = batch[index]

              if (!response || response.status !== 200) {
                this.pubmedErrorImported.push(pubMedId)
                return
              }

              const data = response.data

              if (Object.prototype.hasOwnProperty.call(data, 'error') ||
                  Object.prototype.hasOwnProperty.call(data, 'esummaryresult')) {
                this.pubmedErrorImported.push(pubMedId)
                return
              }

              if (!Object.prototype.hasOwnProperty.call(data.result, 'uids') ||
                  !data.result.uids.length) {
                this.pubmedErrorImported.push(pubMedId)
                return
              }

              const uid = data.result.uids[0]
              const pubmedData = data.result[uid]

              if (Object.prototype.hasOwnProperty.call(pubmedData, 'error')) {
                this.pubmedErrorImported.push(pubMedId)
                return
              }

              this.processPubmedData(pubmedData)
            })
          } catch (error) {
            console.error(`Error processing batch ${i / batchSize + 1}:`, error)
            this.pubmedErrorImported.push(...batch)
          }
        }
      } catch (error) {
        console.error('Error in processPubMedRequest:', error)
      } finally {
        this.pubmed_loading = false
        this.btnCleanDisabled = false
      }
    },
    PubmedRequestClean: function () {
      this.btnSearchPubMed = false
      this.pubmed_request = ''
      this.pubmed_requested = []
      this.pubmed_selected = []
      this.pubmedErrorImported = []
      this.pubmed_loading = false
      this.pubmed_error = false
    },
    apiPubMed: async function (id) {
      try {
        return await Api.get(`/pubmed/fetch?id=${id}`)
      } catch (error) {
        console.error('Error fetching PubMed data', error)
        throw error
      }
    },
    processPubmedData: function (data) {
      const refTitle = data.title
      const refDatabase = 'PubMed'
      let authors = []
      for (let author of data.authors) {
        authors.push(author.name)
      }
      const refAuthors = authors
      const refPublicatonYear = data.pubdate.split(' ')[0]
      const refIssn = data.issn
      const refUid = data.uid
      let refDisabled = false

      for (let _reference of this.references) {
        if (Object.prototype.hasOwnProperty.call(_reference, 'uid') && Object.prototype.hasOwnProperty.call(data, 'uid')) {
          if (_reference.uid === data.uid) {
            refDisabled = true
          }
        }
      }

      const reference = {
        title: refTitle,
        database: refDatabase,
        authors: refAuthors,
        publication_year: refPublicatonYear,
        isbn_issn: refIssn,
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        disabled: refDisabled,
        uid: refUid
      }

      this.pubmed_requested.push(reference)
    },
    requestImportReferences: async function (index) {
      return Api.post(`/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`, this.pubmed_requested[index])
    },
    importReferences: async function () {
      if (!this.pubmed_selected.length) return

      this.$emit('statusLoadReferences', true)

      try {
        const operationId = this.generateOperationId()

        const refsToImport = this.pubmed_selected.map(index => {
          const ref = { ...this.pubmed_requested[index] }
          delete ref.disabled
          return ref
        })

        const response = await Api.post('/isoqf_references/batch-import', {
          references: refsToImport,
          operation_id: operationId,
          organization: this.$route.params.org_id,
          project_id: this.$route.params.id
        })

        if (response.data && response.data.references) {
          const importedRefs = response.data.references
          
          if (this.useCamelot) {
            await this.handleCamelotAssessments(importedRefs)
            await this.handleCamelotCharacteristics(importedRefs)
          }
          
          await this.prefetchDataForExtractedDataUpdate(importedRefs)
        }

        this.pubmed_request = ''
        this.pubmed_requested = []
        this.pubmed_selected = []
        this.pubmedErrorImported = []
        this.btnSearchPubMed = false

        this.$emit('CallGetReferences', false)
      } catch (error) {
        console.error('Error importing references', error)
      } finally {
        this.$emit('statusLoadReferences', false)
      }
    },
    axiosGetFindings: async function (listId) {
      return Api.get(`/isoqf_findings?organization=${this.$route.params.org_id}&list_id=${listId}`)
    },
    axiosGetExtractedData: async function (organization, findingId) {
      return Api.get(`/isoqf_extracted_data?organization=${organization}&finding_id=${findingId}`)
    },
    axiosPatchExtractedData: async function (id, params) {
      return Api.patch(`/isoqf_extracted_data/${id}`, params)
    },
    prefetchDataForExtractedDataUpdate: async function (references) {
      try {
        const _lists = JSON.parse(JSON.stringify(this.lists))
        if (!_lists || _lists.length === 0) {
          console.log('No lists available to update')
          return
        }

        const findingPromises = _lists.map(list => this.axiosGetFindings(list.id))
        const findResponses = await Promise.all(findingPromises)

        const extractPromises = findResponses.map(response => {
          if (response.data && response.data[0]) {
            return this.axiosGetExtractedData(
              response.data[0].organization,
              response.data[0].id
            )
          }
          return Promise.resolve(null)
        }).filter(promise => promise !== null)

        const extractedResponses = await Promise.all(extractPromises)

        await this.updateExtractedDataReferences(extractedResponses, references)
      } catch (error) {
        console.error('Error in prefetchDataForExtractedDataUpdate:', error)
      }
    },
    updateExtractedDataReferences: async function (extractedDataQuerys = [], references = []) {
      if (!references.length || !extractedDataQuerys.length) return

      try {
        const itemsReferences = references.map(reference => {
          return {
            'ref_id': reference.id,
            'authors': this.parseReference(reference, true),
            'column_0': ''
          }
        }).filter(item => item.ref_id)

        if (!itemsReferences.length) return

        const patchPromises = []

        for (const response of extractedDataQuerys) {
          if (!response || !response.data || !response.data[0]) continue

          const responseData = response.data[0]
          const responseItems = Array.isArray(responseData.items) ? responseData.items : []

          responseItems.push(...itemsReferences)

          const params = {
            items: responseItems
          }

          patchPromises.push(this.axiosPatchExtractedData(responseData.id, params))
        }

        if (patchPromises.length > 0) {
          await Promise.all(patchPromises)
        }
      } catch (error) {
        console.error('Error updating extracted data references:', error)
      }
    },
    openModalReferencesSingle: function (showModal) {
      if (showModal) {
        this.msgUploadReferences = ''
        this.appearMsgRemoveReferences = false
        this.disableBtnRemoveAllRefs = false
        this.$refs['modal-references'].show()
      }
    },
    findRelatedFindings: function (refId = null) {
      if (!refId) return

      let findings = []
      for (const list of this.lists) {
        for (const ref of list.raw_ref) {
          if (ref.id === refId) {
            findings.push(`#${list.cnt || list.sort}`)
          }
        }
      }
      if (findings.length) {
        return this.$t('references.findings_affected', { findings: findings.join(', ') })
      } else {
        return this.$t('references.no_findings_affected')
      }
    },
    confirmRemoveAllReferences: function (event) {
      event.preventDefault()
      this.appearMsgRemoveReferences = true
      this.disableBtnRemoveAllRefs = true
    },
    removeAllReferences: function () {
      Api.post('/isoqf_references/batch-delete', {
        delete_all: true,
        project_id: this.$route.params.id,
        organization: this.$route.params.org_id,
        confirmation: `DELETE_ALL_REFERENCES_${this.$route.params.id}`
      })
        .then(() => {
          this.$emit('loadReferences', true)
          this.$emit('CallGetReferences')
          this.$emit('CallGetProject')
          this.appearMsgRemoveReferences = false
        })
        .catch(error => {
          console.error('Error deleting all references:', error)
          this.disableBtnRemoveAllRefs = false
        })
    },
    confirmRemoveReferenceById: function (refId) {
      if (!refId) return

      Api.post('/api/isoqf_references/batch-delete', {
        reference_ids: [refId],
        project_id: this.$route.params.id,
        organization: this.$route.params.org_id
      })
        .then(() => {
          this.$emit('CallGetReferences', false)
          this.openModalReferencesSingle(false)
          this.$emit('CallGetProject')
        })
        .catch(error => {
          console.error('Error deleting reference:', error)
        })
    },
    parseReference: function (reference, onlyAuthors = false, hasSemicolon = true) {
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''

      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        const authorPart = this.formatAuthors(reference.authors)

        if (authorPart === this.$t('references.author_not_found')) {
          return authorPart
        }

        result = authorPart + ' ' + reference.publication_year + semicolon

        if (!onlyAuthors) {
          result = result + reference.title
        }
      }

      return result
    },
    handleCamelotAssessments: async function (references) {
      try {
        const response = await Api.get('/isoqf_assessments?organization=' + this.$route.params.org_id + '&project_id=' + this.$route.params.id)

        // Create the assessment object structure
        const createAssessmentItem = (reference) => ({
          ref_id: reference.id,
          authors: this.parseReference(reference, true),
          stages: [
            {
              key: 0,
              options: Array(4).fill({ option: null, text: '' })
            },
            {
              key: 1,
              options: Array(4).fill({ option: null, text: '' })
            },
            {
              key: 2,
              options: [{ option: null, text: '' }]
            },
            {
              key: 3,
              options: [{ option: null, text: '' }]
            }
          ]
        })

        if (response.data.length) {
          // Update existing assessment
          const _assessments = response.data[0]
          const assessmentId = _assessments.id

          // Get existing reference IDs
          const existingRefIds = _assessments.items.map(item => item.ref_id)

          // Only add references that don't already exist
          const newReferences = references.filter(ref => !existingRefIds.includes(ref.id))

          if (newReferences.length > 0) {
            // Create new assessment items for the new references
            const newItems = newReferences.map(ref => createAssessmentItem(ref))

            // Add new items to the assessments
            _assessments.items.push(...newItems)

            // Update the assessments table
            await Api.patch(`/isoqf_assessments/${assessmentId}`, _assessments)
          }
        } else {
          // Create new assessments table
          const items = references.map(ref => createAssessmentItem(ref))

          // Post new assessments table
          await Api.post('/isoqf_assessments', {
            organization: this.$route.params.org_id,
            project_id: this.$route.params.id,
            items: items
          })
        }
      } catch (error) {
        console.error('Error en la actualización de calificaciones:', error)
      }
    },

    handleCamelotCharacteristics: async function (references) {
      try {
        const response = await Api.get('/isoqf_characteristics?organization=' + this.$route.params.org_id + '&project_id=' + this.$route.params.id)

        // Create the characteristics object structure
        const createCharacteristicItem = (reference) => ({
          ref_id: reference.id,
          authors: this.parseReference(reference, true)
        })

        if (response.data.length) {
          // Update existing characteristics
          const _characteristics = response.data[0]
          const charId = _characteristics.id

          // Get existing reference IDs
          const existingRefIds = _characteristics.items.map(item => item.ref_id)

          // Only add references that don't already exist
          const newReferences = references.filter(ref => !existingRefIds.includes(ref.id))

          if (newReferences.length > 0) {
            // Create new characteristic items for the new references
            const newItems = newReferences.map(ref => createCharacteristicItem(ref))

            // Add new items to the characteristics
            _characteristics.items.push(...newItems)

            // Update the characteristics table
            await Api.patch(`/isoqf_characteristics/${charId}`, _characteristics)
          }
        } else {
          // Create new characteristics table
          const items = references.map(ref => createCharacteristicItem(ref))

          // Post new characteristics table
          await Api.post('/isoqf_characteristics/', {
            organization: this.$route.params.org_id,
            project_id: this.$route.params.id,
            fields: [
              { key: 'ref_id', label: 'Reference ID' },
              { key: 'authors', label: 'Author(s), Year' }
            ],
            items: items
          })
        }
      } catch (error) {
        console.error('Error en la actualización de características:', error)
      }
    }
  },
  watch: {
    pre_references: function (data) {
      try {
        if (!data || data.trim() === '') {
          console.log('Contenido de archivo vacío')
          this.uploadProgress = ''
          return
        }

        this.fileReferences = []
        this.uploadProgress = 'Procesando referencias...'

        const file = data
        const allLines = file.split(/\r\n|\n/)
        const titleTags = ['TI', 'T1', 'T2', 'T3']
        const authorTags = ['AU', 'A1', 'A2', 'A3', 'A4']
        const userDefinable = ['U1', 'U2', 'U3', 'U4', 'U5']
        let base = { title: '', authors: [], user_definable: [] }

        allLines.forEach((line) => {
          const _line = line.split('  -')
          if (_line.length > 1) {
            const key = _line[0]
            const content = _line[1].trimStart()

            if (key === 'TY') {
              base['type'] = content
            }
            if (titleTags.includes(key)) {
              switch (key) {
                case 'TI':
                  base['title'] = content
                  break
                case 'T1':
                  if (base['title'].length) {
                    base['title_1'] = content
                  } else {
                    base['title'] = content
                  }
                  break
                case 'T2':
                  if (base['title'].length) {
                    base['title_2'] = content
                  } else {
                    base['title'] = content
                  }
                  break
                case 'T3':
                  if (base['title'].length) {
                    base['title_3'] = content
                  } else {
                    base['title'] = content
                  }
                  break
              }
            }
            if (authorTags.includes(key)) {
              base['authors'].push(content)
            }
            if (key === 'AB') {
              base['abstract'] = content
            }
            if (key === 'VL') {
              base['volume_number'] = content
            }
            if (key === 'SP') {
              base['start_page'] = content
            }
            if (key === 'EP') {
              base['end_page'] = content
            }
            if (key === 'IN') {
              base['issue_number'] = content
            }
            if (key === 'SN') {
              base['isbn_issn'] = content
            }
            if (['PY', 'Y1'].includes(key)) {
              base['publication_year'] = content.split('/')[0]
              base['real_date'] = content
            }
            if (key === 'DA') {
              base['date'] = content
            }
            if (key === 'DB') {
              base['database'] = content
            }
            if (key === 'UR') {
              base['url'] = content
            }
            if (key === 'DO') {
              base['doi'] = content
            }
            if (userDefinable.includes(key)) {
              base['user_definable'].push(content)
            }
            if (key === 'ER') {
              this.fileReferences.push(base)
              base = { title: '', authors: [], user_definable: [] }
            }
          }
        })
        this.uploadProgress = `${this.fileReferences.length} referencias procesadas localmente`
        console.log('Referencias procesadas:', this.fileReferences.length)
      } catch (error) {
        console.error('Error en watcher pre_references:', error)
        this.uploadProgress = `Error: ${error.message}`
      }
    }
  }
}
</script>

<style scoped>
.reference-table {
  margin-top: 1rem;
}

.reference-actions {
  display: flex;
  gap: 0.5rem;
}

.warning-text {
  color: #dc3545;
  font-weight: 500;
}
</style>