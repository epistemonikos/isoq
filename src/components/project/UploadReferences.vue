<template>
  <div>
    <h4>STEP 1: Upload the <b>references</b> for your included studies (required)</h4>
    <p class="font-weight-light">
    You must import only the references for your final list of included studies
    </p>

    <!-- Incomplete operation recovery message -->
    <b-alert
      v-if="showRestorePrompt"
      show
      variant="info"
      dismissible>
      <h5>Incomplete upload detected</h5>
      <p>We found a previous upload that didn't complete. Would you like to restore it?</p>
      <b-button
        variant="outline-primary"
        class="mr-2"
        @click="restoreSavedProgress">
        Yes, restore my upload
      </b-button>
      <b-button
        variant="outline-secondary"
        @click="clearSavedProgress">
        No, start new
      </b-button>
    </b-alert>

    <!-- Progreso de carga por lotes -->
    <!-- <b-alert
      v-if="uploadProgress"
      show
      variant="info">
      <strong>Upload progress:</strong> {{uploadProgress}}
    </b-alert> -->

    <b-card no-body>
      <b-tabs id="import-data" card>
        <b-tab title="File upload" active>
          <b-row>
            <b-col
              cols="12">
              <videoHelp txt="File upload" tag="h4" urlId="449247762"></videoHelp>
            </b-col>
          </b-row>
          <p class="font-weight-light">
            <b>STEP 1:</b> Export the references for your included studies from your reference management software (e.g. Endnote). You must select RIS as the output style.
          </p>
          <p class="font-weight-light">
            <b>STEP 2:</b> Import the .ris/.txt file into iSoQ.
          </p>
          <b-form-file
            id="input-ris-file-key"
            ref="file-input"
            plain
            :disabled="!checkPermissions"
            @change="loadRefs($event)"></b-form-file>
          <b-button
            block
            :disabled="(fileReferences.length >= 1) ? false : true"
            class="mt-2"
            variant="success"
            @click="saveReferences()">
            Upload
          </b-button>
          <p>
              Reminder: If you later add studies to your review, you can do a second import of these and they will be added to your existing list.
          </p>

          <!-- Preview message and table -->
          <div v-if="fileReferences.length > 0">
            <b-alert show variant="info" class="mt-3">
              <strong>Preview only:</strong> This is a preview of the references that will be uploaded. Click the Upload button to save them to the system.
            </b-alert>

            <b-table
              sort-by="authors"
              :items="fileReferences"
              :fields="tableFields"
              hover
              striped
              responsive
              class="mt-3">
              <!-- The formatting logic is now in the formatter of tableFields -->
            </b-table>
          </div>
        </b-tab>
        <b-tab title="Import from PubMed">
          <b-row>
            <b-col
              cols="12">
                <videoHelp txt="Import from PubMed" tag="h4" urlId="449248998"></videoHelp>
            </b-col>
          </b-row>
          <b-row>
            <b-col
              sm="6">
              <p class="font-weight-light">
                You can import individual references from PubMed by pasting the references PMID below. The PMID is the 8-digit identification number appearing at the end of the web address for the article on PubMed. Add one PMID per line below and click Find.
              </p>
              <b-form-textarea
                v-model="pubmed_request"
                placeholder="Ej: 17253524"
                rows="6"
                max-rows="100"></b-form-textarea>
              <b-button
                v-if="checkPermissions && !btnSearchPubMed && pubmed_request.length"
                id="btnEpisteRequest"
                class="mt-2"
                block
                variant="outline-primary"
                @click="PubmedRequest">Find</b-button>
              <b-button
                v-if="checkPermissions && (pubmed_requested.length || pubmedErrorImported.length)"
                :disabled="btnCleanDisabled"
                class="mt-1"
                block
                variant="outline-secondary"
                @click="PubmedRequestClean">Clean</b-button>
            </b-col>
            <b-col
              sm="6">
              <template
                v-if="pubmed_loading">
                <div class="text-center text-danger my-2">
                  <b-spinner class="align-middle"></b-spinner>
                  <strong>Loading...</strong>
                </div>
              </template>
              <template
                v-else-if="pubmed_error">
                <p class="font-weight-light">
                  The reference could not be reached, try again or using other ID
                  </p>
              </template>
              <template v-else>
                <template v-if="pubmed_requested.length">
                  <p>Select the references to import</p>
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
                  <p>The following PubMed IDs are invalid</p>
                  <ul v-for="(id, index) in pubmedErrorImported" :key="index">
                    <li>{{ id }}</li>
                  </ul>
                </template>
                <b-button
                  v-if="pubmed_selected.length && checkPermissions"
                  variant="outline-success"
                  block
                  @click="importReferences()">Import references</b-button>
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
              <strong>Loading...</strong>
            </div>
          </template>
          <template v-else>
            <b-row v-if="!references.length">
              <b-col
                cols="12">
                <p class="text-center my-0">No references have been uploaded</p>
              </b-col>
            </b-row>
            <b-row v-else>
              <b-col
                cols="12">
                <p class="text-center my-0">You have <b>{{ references.length }}</b> references loaded listed below</p>
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
              <p class="alert text-danger">This action will delete all the references and all the data linked to them, including Characteristics of Studies Table, Methodological Limitations Table, Extracted Data tables, and all the GRADE-CERQual assessments in the Evidence Profile and Summary of Qualitative Findings Table.<br><b>Are you sure you want to delete all the references?</b></p>
            </b-col>
          </b-row>
          <b-row align-h="center">
            <b-col
              cols="3">
              <b-button
                block
                @click="removeAllReferences"
                variant="outline-danger">
                Yes
              </b-button>
            </b-col>
            <b-col
              cols="3">
              <b-button
                block
                @click="appearMsgRemoveReferences = false"
                variant="outline-success">
                No
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
            :fields="fields_references_table"
            :items="references"
            head-variant="light"
            outlined>
            <template v-slot:cell(action)="data">
              <b-button
                v-if="checkPermissions"
                variant="outline-danger"
                @click="data.toggleDetails">
                <font-awesome-icon
                  icon="trash"></font-awesome-icon>
              </b-button>
            </template>
            <template v-slot:row-details="data">
              <b-card>
                <p>You are about to exclude a study from your review. This will delete it, and all associated information, from all tables in iSoQ. If you exclude this study please remember to redo your GRADE-CERQual assessments for all review findings that it supported.</p>
                <p>{{ findRelatedFindings(data.item.id) }}</p>
                <p>Are you sure you want to delete this reference?</p>
                <div>
                  <b-row align-h="center">
                    <b-col cols="3">
                      <b-button
                        block
                        variant="outline-success"
                        @click="data.toggleDetails">No</b-button>
                    </b-col>
                    <b-col cols="3">
                      <b-button
                        block
                        variant="outline-danger"
                        @click="confirmRemoveReferenceById(data.item.id)">Yes</b-button>
                    </b-col>
                  </b-row>
                </div>
              </b-card>
            </template>
          </b-table>
          <div v-if="checkPermissions" class="mt-2">
            <b-button
            @click="confirmRemoveAllReferences($event)"
              >Delete all references</b-button>
          </div>
        </template>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import axios from 'axios'
const videoHelp = () => import('@/components/videoHelp.vue')

export default {
  props: {
    checkPermissions: Boolean,
    loadReferences: Boolean,
    references: Array,
    episteResponse: Array,
    lists: Array,
    charsOfStudies: Object,
    methodologicalTableRefs: Object
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
      pubmed_response: [], // Añadido campo que faltaba
      btnSearchPubMed: false,
      localReferences: [],
      btnCleanDisabled: true,
      disableBtnRemoveAllRefs: false,
      appearMsgRemoveReferences: false,
      // Nuevos campos para control de operación
      operationId: null,
      uploadProgress: '',
      showRestorePrompt: false,
      savedProgress: null,
      // Preview table fields
      tableFields: [
        {
          key: 'authors',
          label: 'Author(s)',
          formatter: (value, key, item) => this.formatAuthors(item.authors)
        },
        { key: 'title', label: 'Title' },
        { key: 'publication_year', label: 'Year' }
      ],
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
    // Verificar si hay operaciones incompletas al cargar el componente
    this.checkIncompleteOperations()
  },
  methods: {
    // Método auxiliar para formatear autores (reutilizable)
    formatAuthors (authors) {
      if (!authors || !authors.length) return 'author(s) not found'

      if (authors.length === 1) {
        return authors[0].split(',')[0]
      } else if (authors.length === 2) {
        return authors[0].split(',')[0] + ' & ' + authors[1].split(',')[0]
      } else {
        return authors[0].split(',')[0] + ' et al.'
      }
    },

    // Métodos de persistencia local
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
          // Ofrecer restaurar si no han pasado más de 24 horas
          if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
            this.showRestorePrompt = true
            this.savedProgress = progress
          } else {
            // Eliminar datos antiguos
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

    // Método para generar ID de operación para idempotencia
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
      // Mostrar feedback visual al usuario
      this.uploadProgress = 'Leyendo archivo...'

      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          this.uploadProgress = 'Procesando referencias...'
          this.pre_references = e.target.result

          // El watcher se activará automáticamente aquí
          // Pero podemos mostrar un feedback inmediato
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
    // Método para subida de archivos RIS directamente al servidor
    uploadRisFile: async function (file) {
      if (!file) return

      this.$emit('statusLoadReferences', true)
      const formData = new FormData()
      formData.append('risFile', file)
      formData.append('projectId', this.$route.params.id)
      formData.append('organization', this.$route.params.org_id)

      try {
        const response = await axios.post('/api/isoqf_references/process-ris', formData)

        if (response.data && response.data.references) {
          this.localReferences = response.data.references
          const _references = JSON.parse(JSON.stringify(this.localReferences))
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
      return axios({
        method: 'POST',
        url: `/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`,
        data: ref
      })
    },

    saveReferences: async function (from = '') {
      this.$emit('statusLoadReferences', true)
      try {
        // Si tenemos un archivo completo, usamos el método de procesamiento del servidor
        if (this.$refs['file-input'] && this.$refs['file-input'].$el &&
            this.$refs['file-input'].$el.files && this.$refs['file-input'].$el.files[0]) {
          return this.uploadRisFile(this.$refs['file-input'].$el.files[0])
        }

        let references = []
        if (from === '') {
          references = this.fileReferences
          // Guardar progreso actual por si ocurre desconexión
          this.storeProgress()
        } else {
          // Procesar referencias de Epistemonikos (si aplica)
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

        // Generar ID de operación para idempotencia
        this.operationId = this.generateOperationId()

        // Dividir en lotes si hay muchas referencias
        const batchSize = 10
        const batches = []
        for (let i = 0; i < references.length; i += batchSize) {
          batches.push(references.slice(i, i + batchSize))
        }

        let successCount = 0
        let failedItems = []

        // Procesar por lotes para mostrar progreso
        for (let i = 0; i < batches.length; i++) {
          this.uploadProgress = `Procesando lote ${i + 1}/${batches.length}...`

          // Guardar punto de control
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

            // Procesar resultados
            for (const response of responses) {
              if (response && response.data) {
                this.localReferences.push(response.data)
                successCount++
              }
            }
          } catch (error) {
            console.error(`Error en lote ${i+1}:`, error)
            failedItems = [...failedItems, ...batches[i].map(r => r.title || 'Referencia sin título')]
          }
        }

        // Finalizar proceso
        if (this.localReferences.length) {
          const _references = JSON.parse(JSON.stringify(this.localReferences))
          await this.prefetchDataForExtractedDataUpdate(_references)
        }

        this.msgUploadReferences = `${successCount} referencias añadidas. ${failedItems.length ? `${failedItems.length} fallaron.` : ''}`
        this.pre_references = ''
        this.fileReferences = []
        this.$refs['file-input'].reset()

        // Limpiar checkpoint cuando completamos
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
        // Filtrar líneas vacías y validar IDs
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

        // Procesar en paralelo hasta 5 IDs a la vez para no sobrecargar
        const batchSize = 5
        for (let i = 0; i < validLines.length; i += batchSize) {
          const batch = validLines.slice(i, i + batchSize)
          const promises = batch.map(pubMedId => this.apiPubMed(pubMedId))

          try {
            const responses = await Promise.all(promises)

            // Procesar respuestas
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
            // Añadir todos los IDs de este lote a la lista de errores
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
        // Usar el endpoint proxy en el backend para ocultar la API key
        return await axios.get(`/api/pubmed/fetch?id=${id}`)
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
      return axios({
        method: 'POST',
        url: `/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`,
        data: this.pubmed_requested[index]
      })
    },
    importReferences: async function () {
      if (!this.pubmed_selected.length) return

      this.$emit('statusLoadReferences', true)

      try {
        // Generar ID de operación para idempotencia
        const operationId = this.generateOperationId()

        // Preparar referencias seleccionadas
        const refsToImport = this.pubmed_selected.map(index => {
          const ref = { ...this.pubmed_requested[index] }
          delete ref.disabled
          return ref
        })

        // Usando el nuevo endpoint para importación por lotes con idempotencia
        const response = await axios.post('/api/isoqf_references/batch-import', {
          references: refsToImport,
          operation_id: operationId,
          organization: this.$route.params.org_id,
          project_id: this.$route.params.id
        })

        if (response.data && response.data.references) {
          const importedRefs = response.data.references
          await this.prefetchDataForExtractedDataUpdate(importedRefs)
        }

        // Limpiar formulario
        this.pubmed_request = ''
        this.pubmed_requested = []
        this.pubmed_selected = []
        this.pubmedErrorImported = []
        this.btnSearchPubMed = false

        // Refrescar datos
        this.$emit('CallGetReferences', false)
      } catch (error) {
        console.error('Error importing references', error)
      } finally {
        this.$emit('statusLoadReferences', false)
      }
    },
    axiosGetFindings: async function (listId) {
      return axios.get(`/api/isoqf_findings?organization=${this.$route.params.org_id}&list_id=${listId}`)
    },
    axiosGetExtractedData: async function (organization, findingId) {
      return axios.get(`/api/isoqf_extracted_data?organization=${organization}&finding_id=${findingId}`)
    },
    axiosPatchExtractedData: async function (id, params) {
      return axios.patch(`/api/isoqf_extracted_data/${id}`, params)
    },
    prefetchDataForExtractedDataUpdate: async function (references) {
      try {
        // Crear una copia profunda de las listas
        const _lists = JSON.parse(JSON.stringify(this.lists))
        if (!_lists || _lists.length === 0) {
          console.log('No lists available to update')
          return
        }

        // Obtener findings en paralelo
        const findingPromises = _lists.map(list => this.axiosGetFindings(list.id))
        const findResponses = await Promise.all(findingPromises)

        // Preparar promesas para extractedData
        const extractPromises = findResponses.map(response => {
          if (response.data && response.data[0]) {
            return this.axiosGetExtractedData(
              response.data[0].organization,
              response.data[0].id
            )
          }
          return Promise.resolve(null)
        }).filter(promise => promise !== null)

        // Obtener extractedData en paralelo
        const extractedResponses = await Promise.all(extractPromises)

        // Actualizar referencias
        await this.updateExtractedDataReferences(extractedResponses, references)
      } catch (error) {
        console.error('Error in prefetchDataForExtractedDataUpdate:', error)
      }
    },
    updateExtractedDataReferences: async function (extractedDataQuerys = [], references = []) {
      if (!references.length || !extractedDataQuerys.length) return

      try {
        // Preparar referencias formateadas para actualización
        const itemsReferences = references.map(reference => {
          return {
            'ref_id': reference.id,
            'authors': this.parseReference(reference, true),
            'column_0': ''
          }
        }).filter(item => item.ref_id) // Filtrar elementos sin ID

        if (!itemsReferences.length) return

        // Preparar las promesas de actualización sin await en el bucle
        const patchPromises = [];

        for (const response of extractedDataQuerys) {
          if (!response || !response.data || !response.data[0]) continue

          const responseData = response.data[0]
          const responseItems = Array.isArray(responseData.items) ? responseData.items : []

          // Añadir nuevas referencias a items existentes
          responseItems.push(...itemsReferences)

          const params = {
            items: responseItems
          }

          // Agregar la promesa sin await
          patchPromises.push(this.axiosPatchExtractedData(responseData.id, params))
        }

        // Ejecutar todas las actualizaciones en paralelo
        if (patchPromises.length > 0) {
          await Promise.all(patchPromises)
        }
      } catch (error) {
        console.error('Error updating extracted data references:', error)
      }
    },
    openModalReferencesSingle: function (showModal) {
      if (showModal) {
        // this.getReferences(false)
        // this.$emit('CallGetReferences', false)
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
        return 'The findings affected are: ' + findings.join(', ')
      } else {
        return 'No review findings will be affected.'
      }
    },
    confirmRemoveAllReferences: function (event) {
      event.preventDefault()
      this.appearMsgRemoveReferences = true
      this.disableBtnRemoveAllRefs = true
    },
    removeAllReferences: function () {
      axios.post('/api/isoqf_references/batch-delete', {
        delete_all: true,
        project_id: this.$route.params.id,
        organization: this.$route.params.org_id,
        confirmation: `DELETE_ALL_REFERENCES_${this.$route.params.id}` // Confirmación explícita
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

      axios.post('/api/isoqf_references/batch-delete', {
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
      // Usar nuestra función auxiliar para formatear autores
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''

      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        // Obtener formato de autores
        const authorPart = this.formatAuthors(reference.authors)

        // Si no se encontraron autores, devolver mensaje
        if (authorPart === 'author(s) not found') {
          return authorPart
        }

        // Agregar año a los autores formateados si hay autores válidos
        result = authorPart + ' ' + reference.publication_year + semicolon

        // Agregar título si se requiere
        if (!onlyAuthors) {
          result = result + reference.title
        }
      }

      return result
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

        // Código existente de procesamiento...
        const file = data
        const allLines = file.split(/\r\n|\n/)
        // Reading line by line
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
        // Al finalizar:
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
