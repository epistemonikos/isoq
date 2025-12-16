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

    <b-card no-body>
      <b-tabs id="import-data" card>
        <b-tab title="File upload" active>
          <b-row>
            <b-col cols="12">
              <videoHelp txt="File upload" tag="h4" urlId="449247762"></videoHelp>
            </b-col>
          </b-row>
          <p class="font-weight-light">
            <b>STEP 1:</b> Export the references for your included studies from your reference management software (e.g.
            Endnote). You must select RIS as the output style.
          </p>
          <p class="font-weight-light">
            <b>STEP 2:</b> Import the .ris/.txt file into iSoQ.
          </p>
          <b-form-file id="input-ris-file-key" ref="file-input" plain :disabled="!checkPermissions"
            @change="loadRefs($event)"></b-form-file>
          <b-button block :disabled="(fileReferences.length >= 1) ? false : true" class="mt-2" variant="success"
            @click="saveReferences()">
            Upload
          </b-button>
          <p>
            Reminder: If you later add studies to your review, you can do a second import of these and they will be
            added to your existing list.
          </p>
        </b-tab>
        <b-tab title="Import from PubMed">
          <b-row>
            <b-col cols="12">
              <videoHelp txt="Import from PubMed" tag="h4" urlId="449248998"></videoHelp>
            </b-col>
          </b-row>
          <b-row>
            <b-col sm="6">
              <p class="font-weight-light">
                You can import individual references from PubMed by pasting the references PMID below. The PMID is the
                8-digit identification number appearing at the end of the web address for the article on PubMed. Add one
                PMID per line or separate multiple PMIDs with commas below and click Find.
              </p>
              <b-form-textarea v-model="pubmed_request" placeholder="Ej: 17253524" rows="6"
                max-rows="100"></b-form-textarea>
              <b-button v-if="checkPermissions && !btnSearchPubMed && pubmed_request.length" id="btnEpisteRequest"
                class="mt-2" block variant="outline-primary" @click="PubmedRequest">Find</b-button>
              <b-button v-if="checkPermissions && (pubmed_requested.length || pubmedErrorImported.length)"
                :disabled="btnCleanDisabled" class="mt-1" block variant="outline-secondary"
                @click="PubmedRequestClean">Clean</b-button>
            </b-col>
            <b-col sm="6">
              <template v-if="pubmed_loading">
                <div class="text-center text-danger my-2">
                  <b-spinner class="align-middle"></b-spinner>
                  <strong>Loading...</strong>
                </div>
              </template>
              <template v-else-if="pubmed_error">
                <p class="font-weight-light">
                  The reference could not be reached, try again or using other ID
                </p>
              </template>
              <template v-else>
                <template v-if="pubmed_requested.length">
                  <p>Select the references to import</p>
                  <ul class="list-unstyled">
                    <li v-for="(r, index) in pubmed_requested" :key="index">
                      <b-form-checkbox :id="`checkbox-${index}`" v-model="pubmed_selected" :name="`checkbox-${index}`"
                        :value="index" :disabled="r.disabled">
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
                <b-button v-if="pubmed_selected.length && checkPermissions" variant="outline-success" block
                  @click="importReferences()">Import references</b-button>
              </template>
            </b-col>
          </b-row>
        </b-tab>
      </b-tabs>
    </b-card>
    <b-row class="mt-3 mb-3">
      <b-col cols="12">
        <b-card bg-variant="light">
          <template v-if="loadReferences">
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
              <strong>Loading...</strong>
            </div>
          </template>
          <template v-else>
            <b-row v-if="!references.length">
              <b-col cols="12">
                <p class="text-center my-0">No references have been uploaded</p>
              </b-col>
            </b-row>
            <b-row v-else>
              <b-col cols="12">
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
              <b-col cols="12">
                <p class="alert text-danger">This action will delete all the references and all the data linked to them,
                  including Characteristics of Studies Table, Methodological Limitations Table, Extracted Data tables,
                  and all the GRADE-CERQual assessments in the Evidence Profile and Summary of Qualitative Findings
                  Table.<br><b>Are you sure you want to delete all the references?</b></p>
              </b-col>
            </b-row>
            <b-row align-h="center">
              <b-col cols="3">
                <b-button block @click="removeAllReferences" variant="outline-danger">
                  Yes
                </b-button>
              </b-col>
              <b-col cols="3">
                <b-button block @click="appearMsgRemoveReferences = false" variant="outline-success">
                  No
                </b-button>
              </b-col>
            </b-row>
          </template>
          <template v-else>
            <b-table sort-by="authors" responsive hover bordered borderless striped :fields="fields_references_table"
              :items="references" head-variant="light" outlined>
              <template v-slot:cell(action)="data">
                <b-button v-if="checkPermissions" variant="outline-danger" @click="data.toggleDetails">
                  <font-awesome-icon icon="trash"></font-awesome-icon>
                </b-button>
              </template>
              <template v-slot:row-details="data">
                <b-card>
                  <p>You are about to exclude a study from your review. This will delete it, and all associated
                    information, from all tables in iSoQ. If you exclude this study please remember to redo your
                    GRADE-CERQual assessments for all review findings that it supported.</p>
                  <p>{{ findRelatedFindings(data.item.id) }}</p>
                  <p>Are you sure you want to delete this reference?</p>
                  <div>
                    <b-row align-h="center">
                      <b-col cols="3">
                        <b-button block variant="outline-success" @click="data.toggleDetails">No</b-button>
                      </b-col>
                      <b-col cols="3">
                        <b-button block variant="outline-danger"
                          @click="confirmRemoveReferenceById(data.item.id)">Yes</b-button>
                      </b-col>
                    </b-row>
                  </div>
                </b-card>
              </template>
            </b-table>
            <div v-if="checkPermissions" class="mt-2">
              <b-button @click="confirmRemoveAllReferences($event)">Delete all references</b-button>
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
  name: 'UploadReferences',
  components: {
    videoHelp
  },
  props: {
    checkPermissions: Boolean,
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
  data () {
    return {
      // Estado para carga de archivos
      pre_references: '',
      fileReferences: [],
      episte_selected: [],

      // Estado para PubMed
      pubmed_request: '',
      pubmed_requested: [],
      pubmed_selected: [],
      pubmed_loading: false,
      pubmed_error: false,
      pubmedErrorImported: [],
      pubmed_response: [],
      btnSearchPubMed: false,
      btnCleanDisabled: true,

      // Estado para referencias locales
      localReferences: [],

      // Estado para eliminación
      disableBtnRemoveAllRefs: false,
      appearMsgRemoveReferences: false,

      // Campos para persistencia y recuperación
      operationId: null,
      uploadProgress: '',
      showRestorePrompt: false,
      savedProgress: null,

      // Configuración de la tabla
      fields_references_table: [
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

    processReferenceLine (key, content, base, titleTags, authorTags, userDefinable) {
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
        if (!base['authors']) {
          base['authors'] = []
        }
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
        if (!base['user_definable']) {
          base['user_definable'] = []
        }
        base['user_definable'].push(content)
      }
    },

    requestsImportReferences: function (ref) {
      return axios({
        method: 'POST',
        url: `/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`,
        data: ref
      })
    },

    // Métodos para guardar referencias
    async saveReferences (from = '') {
      this.$emit('statusLoadReferences', true)
      let references = from === '' ? this.fileReferences : this.processEpisteResponse()

      // Guardar progreso actual por si ocurre desconexión
      if (from === '') {
        this.storeProgress()
      }

      try {
        const responses = await Promise.all(
          references.map(ref => {
            ref.organization = this.$route.params.org_id
            ref.project_id = this.$route.params.id
            return this.requestsImportReferences(ref)
          })
        )

        this.localReferences = responses.map(response => response.data)
        const _references = JSON.parse(JSON.stringify(this.localReferences))

        if (this.useCamelot) {
          await this.handleCamelotAssessments(_references)
          await this.handleCamelotCharacteristics(_references)
        }

        await this.prefetchDataForExtractedDataUpdate(_references)

        this.msgUploadReferences = `${this.localReferences.length} references have been added.`
        this.resetFileUpload()

        // Limpiar checkpoint cuando completamos
        localStorage.removeItem('reference-upload-checkpoint')
        localStorage.removeItem('reference-upload-progress')

        this.$emit('CallGetReferences', false)
      } catch (error) {
        console.error('Error guardando referencias:', error)
        this.$emit('statusLoadReferences', false)
      }
    },

    // Métodos para PubMed
    async PubmedRequest () {
      this.btnSearchPubMed = true
      this.pubmed_loading = true
      this.pubmed_error = false
      this.pubmed_response = []
      this.pubmedErrorImported = []

      // Dividir por líneas y comas, y limpiar espacios
      const allLines = this.pubmed_request
        .split(/[\n,]+/)
        .map(line => line.trim())
        .filter(id => id !== '')

      await this.processPubMedRequest(allLines)
    },

    async processPubMedRequest (allLines = []) {
      // Limpiar IDs duplicados antes de procesar
      const uniqueIds = [...new Set(allLines.map(line => line.trim()).filter(id => id !== ''))]
      console.log('IDs únicos a procesar:', uniqueIds)

      for (const pubMedId of uniqueIds) {
        try {
          console.log(`Procesando PubMed ID: ${pubMedId}`)
          const response = await this.apiPubMed(pubMedId)

          if (response.status === 200) {
            if (Object.prototype.hasOwnProperty.call(response.data, 'error') ||
                Object.prototype.hasOwnProperty.call(response.data, 'esummaryresult')) {
              console.log(`Error en PubMed ID ${pubMedId}: Referencia no encontrada`)
              this.pubmedErrorImported.push(pubMedId)
            } else {
              if (Object.prototype.hasOwnProperty.call(response.data.result, 'uids')) {
                if (response.data.result.uids.length) {
                  const uid = response.data.result.uids[0]
                  const data = response.data.result[uid]

                  if (Object.prototype.hasOwnProperty.call(data, 'error')) {
                    console.log(`Error en PubMed ID ${pubMedId}: ${data.error}`)
                    this.pubmedErrorImported.push(pubMedId)
                  } else {
                    // Verificar duplicados en referencias existentes
                    const isDuplicateInReferences = this.references.some(ref =>
                      (ref.uid && ref.uid === data.uid) ||
                      (ref.title === data.title && ref.publication_year === data.pubdate.split(' ')[0])
                    )

                    // Verificar duplicados en referencias solicitadas
                    const isDuplicateInRequested = this.pubmed_requested.some(ref =>
                      (ref.uid && ref.uid === data.uid) ||
                      (ref.title === data.title && ref.publication_year === data.pubdate.split(' ')[0])
                    )

                    if (!isDuplicateInReferences && !isDuplicateInRequested) {
                      this.processPubmedData(data)
                    } else {
                      console.log(`Referencia duplicada encontrada: ${data.title}`)
                      // Marcar como deshabilitada en la lista de referencias solicitadas
                      const reference = {
                        title: data.title,
                        database: 'PubMed',
                        authors: data.authors.map(a => a.name),
                        publication_year: data.pubdate.split(' ')[0],
                        isbn_issn: data.issn,
                        organization: this.$route.params.org_id,
                        project_id: this.$route.params.id,
                        disabled: true,
                        uid: data.uid
                      }
                      this.pubmed_requested.push(reference)
                    }
                  }
                } else {
                  console.log(`Error en PubMed ID ${pubMedId}: No se encontraron UIDs`)
                  this.pubmedErrorImported.push(pubMedId)
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error procesando PubMed ID ${pubMedId}:`, error)
          this.pubmedErrorImported.push(pubMedId)
        }
      }
      this.pubmed_loading = false
      this.btnCleanDisabled = false
    },

    processPubmedData (data) {
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

      const reference = {
        title: refTitle,
        database: refDatabase,
        authors: refAuthors,
        publication_year: refPublicatonYear,
        isbn_issn: refIssn,
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        disabled: false,
        uid: refUid
      }

      this.pubmed_requested.push(reference)
    },

    PubmedRequestClean () {
      this.btnSearchPubMed = false
      this.pubmed_request = ''
      this.pubmed_requested = []
      this.pubmed_selected = []
      this.pubmedErrorImported = []
      this.pubmed_loading = false
      this.pubmed_error = false
    },

    // Métodos para API - usar endpoint proxy del backend para mayor seguridad
    async apiPubMed (id) {
      try {
        // Usar el endpoint proxy en el backend para ocultar la API key
        return await axios.get(`/api/pubmed/fetch?id=${id}`)
      } catch (error) {
        console.error('Error fetching PubMed data', error)
        throw error
      }
    },


    // Métodos para eliminación
    confirmRemoveAllReferences (event) {
      event.preventDefault()
      this.appearMsgRemoveReferences = true
      this.disableBtnRemoveAllRefs = true
    },

    async removeAllReferences () {
      try {
        // Ensure tables are properly cleared before removing references
        const charsOfStudies = JSON.parse(JSON.stringify(this.charsOfStudies))
        const _assessments = JSON.parse(JSON.stringify(this.methodologicalTableRefs))
        let requests = []

        // Clear characteristics of studies table but keep structure
        if (Object.prototype.hasOwnProperty.call(charsOfStudies, 'id')) {
          if (charsOfStudies.items && charsOfStudies.items.length) {
            // Reset all items' data fields except ref_id and authors
            for (let item of charsOfStudies.items) {
              for (let key in item) {
                if (key !== 'ref_id' && key !== 'authors') {
                  item[key] = ''
                }
              }
            }
            requests.push(axios.patch(`/api/isoqf_characteristics/${charsOfStudies.id}`, charsOfStudies))
          }
        }

        // Clear methodological assessments table but keep structure
        if (Object.prototype.hasOwnProperty.call(_assessments, 'id')) {
          if (_assessments.items && _assessments.items.length) {
            // Reset all items' data fields except ref_id and authors
            for (let item of _assessments.items) {
              for (let key in item) {
                if (key !== 'ref_id' && key !== 'authors') {
                  item[key] = ''
                }
              }
            }
            requests.push(axios.patch(`/api/isoqf_assessments/${_assessments.id}`, _assessments))
          }
        }

        // Wait for table updates to complete before removing references
        if (requests.length) {
          await Promise.all(requests)
        }

        await axios.post(`/api/remove/references/all?project_id=${this.$route.params.id}`)
        this.$emit('loadReferences', true)
        this.$emit('CallGetReferences')
        this.$emit('CallGetProject')
        this.appearMsgRemoveReferences = false
      } catch (error) {
        console.error('Error eliminando todas las referencias:', error)
      }
    },

    // Utilidades
    parseReference (reference, onlyAuthors = false, hasSemicolon = true) {
      let result = ''
      const semicolon = hasSemicolon ? '; ' : ''

      if (Object.prototype.hasOwnProperty.call(reference, 'authors')) {
        if (reference.authors.length) {
          if (reference.authors.length === 1) {
            result = reference.authors[0].split(',')[0] + ' ' + reference.publication_year + semicolon
          } else if (reference.authors.length === 2) {
            result = reference.authors[0].split(',')[0] + ' & ' + reference.authors[1].split(',')[0] + ' ' + reference.publication_year + semicolon
          } else {
            result = reference.authors[0].split(',')[0] + ' et al. ' + reference.publication_year + semicolon
          }
          if (!onlyAuthors) {
            result = result + reference.title
          }
        } else {
          return 'author(s) not found'
        }
      }
      return result
    },

    processEpisteResponse: function () {
      let _r = []
      for (let index of this.episte_selected) {
        let content = JSON.parse(JSON.stringify(this.episteResponse[index].content))
        content.publication_year = content.year
        delete (content.year)
        content.isbn_issn = content.publication.ISSN
        if (content.publication.type === 'journal') {
          content.type = 'JOUR'
        }
        _r.push(content)
      }
      return _r
    },

    importReferences: async function () {
      if (!this.pubmed_selected.length) return

      this.$emit('statusLoadReferences', true)
      let axiosRequests = []

      for (const index of this.pubmed_selected) {
        axiosRequests.push(this.requestsImportReferences(this.pubmed_requested[index]))
      }

      try {
        const responses = await Promise.all(axiosRequests)

        // Si es un proyecto CAMELOT, manejar las estructuras automáticamente
        if (this.useCamelot && responses.length > 0) {
          const _references = responses.map(response => response.data)
          try {
            await this.handleCamelotAssessments(_references)
            await this.handleCamelotCharacteristics(_references)
          } catch (error) {
            console.error('Error manejando estructuras CAMELOT:', error)
          }
        }

        this.pubmed_request = ''
        this.pubmed_requested = []
        this.pubmed_selected = []
        this.pubmedErrorImported = []
        this.btnSearchPubMed = false
        this.$emit('CallGetReferences', false)
      } catch (error) {
        this.$emit('statusLoadReferences', false)
        console.log('error', error)
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
        const patchPromises = []

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

    confirmRemoveReferenceById: async function (refId) {
      if (!refId) return

      console.log('=== ELIMINANDO REFERENCIA ===')
      console.log('Referencia ID a eliminar:', refId)

      const lists = JSON.parse(JSON.stringify(this.lists))
      const charsOfStudies = JSON.parse(JSON.stringify(this.charsOfStudies))
      const _assessments = JSON.parse(JSON.stringify(this.methodologicalTableRefs))
      let requests = []


      // Manejar listas
      for (const list of lists) {
        let obj = { id: null, references: [] }
        for (const rr of list.raw_ref) {
          if (rr.id !== refId) {
            obj.references.push(rr.id)
          }
          if (rr.id === refId) {
            obj.id = list.id
            console.log('Eliminando referencia de lista:', list.id)
            requests.push(axios.patch(`/api/isoqf_lists/${list.id}`, { references: obj.references }))
          }
        }
      }

      // Eliminar entrada de isoqf_characteristics
      if (charsOfStudies && Object.prototype.hasOwnProperty.call(charsOfStudies, 'id') && charsOfStudies.id) {
        console.log('=== PROCESANDO CHARACTERISTICS ===')
        console.log('ID de characteristics:', charsOfStudies.id)

        if (charsOfStudies.items && charsOfStudies.items.length) {
          let items = JSON.parse(JSON.stringify(charsOfStudies.items))
          const originalLength = items.length

          // Filtrar para eliminar completamente el item con el refId
          items = items.filter(item => item.ref_id !== refId)
          charsOfStudies.items = items

          console.log(`Characteristics: Items antes: ${originalLength}, después: ${items.length}`)

          requests.push(axios.patch(`/api/isoqf_characteristics/${charsOfStudies.id}`, charsOfStudies))
        } else {
          console.log('No hay items en characteristics o está vacío')
        }
      } else {
        console.log('No se encontró ID en charsOfStudies o charsOfStudies es null')
      }

      // Eliminar entrada de isoqf_assessments
      if (_assessments && Object.prototype.hasOwnProperty.call(_assessments, 'id') && _assessments.id) {
        console.log('=== PROCESANDO ASSESSMENTS ===')
        console.log('ID de assessments:', _assessments.id)

        if (_assessments.items && _assessments.items.length) {
          let items = JSON.parse(JSON.stringify(_assessments.items))
          const originalLength = items.length

          // Filtrar para eliminar completamente el item con el refId
          items = items.filter(item => item.ref_id !== refId)
          _assessments.items = items

          console.log(`Assessments: Items antes: ${originalLength}, después: ${items.length}`)

          requests.push(axios.patch(`/api/isoqf_assessments/${_assessments.id}`, _assessments))
        } else {
          console.log('No hay items en assessments o está vacío')
        }
      } else {
        console.log('No se encontró ID en _assessments o _assessments es null')
      }

      console.log('Total de requests a ejecutar:', requests.length)

      try {
        // Esperar a que todas las requests de actualización se completen
        if (requests.length > 0) {
          console.log('Ejecutando requests de actualización...')
          await Promise.all(requests)
          console.log('Todas las requests de actualización completadas')
        }

        // Ahora eliminar la referencia principal
        console.log('Eliminando referencia principal...')
        await axios.delete(`/api/isoqf_references/${refId}`)

        // Actualizar la UI
        this.$emit('CallGetReferences', false)
        this.openModalReferencesSingle(false)
        this.$emit('CallGetProject')

        console.log('=== ELIMINACIÓN COMPLETADA ===')
      } catch (error) {
        console.error('Error durante la eliminación:', error)
        console.error('Detalles del error:', error.response?.data)
      }
    },

    resetFileUpload: function () {
      this.pre_references = ''
      this.fileReferences = []
      this.$refs['file-input'].reset()
    },

    printErrors: function (error) {
      console.error('Error en la actualización de datos:', error)
    },

    handleCamelotAssessments: async function (references) {
      try {
        const response = await axios.get('/api/isoqf_assessments?organization=' + this.$route.params.org_id + '&project_id=' + this.$route.params.id)

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
            await axios.patch(`/api/isoqf_assessments/${assessmentId}`, _assessments)
          }
        } else {
          // Create new assessments table
          const items = references.map(ref => createAssessmentItem(ref))

          // Post new assessments table
          await axios.post('/api/isoqf_assessments', {
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
        const response = await axios.get('/api/isoqf_characteristics?organization=' + this.$route.params.org_id + '&project_id=' + this.$route.params.id)

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
            await axios.patch(`/api/isoqf_characteristics/${charId}`, _characteristics)
          }
        } else {
          // Create new characteristics table
          const items = references.map(ref => createCharacteristicItem(ref))

          // Post new characteristics table
          await axios.post('/api/isoqf_characteristics/', {
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
    pre_references: {
      handler (data) {
        try {
          if (!data || data.trim() === '') {
            console.log('Contenido de archivo vacío')
            this.uploadProgress = ''
            return
          }

          console.log('Iniciando procesamiento de referencias...')
          this.fileReferences = []
          this.uploadProgress = 'Procesando referencias...'

          const file = data
          const allLines = file.split(/\r\n|\n/)

          const titleTags = ['TI', 'T1', 'T2', 'T3']
          const authorTags = ['AU', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10']
          const userDefinable = ['U1', 'U2', 'U3', 'U4', 'U5']
          let base = { title: '', authors: [], user_definable: [] }
          let currentReference = 0

          allLines.forEach((line) => {
            const _line = line.split('  -')
            if (_line.length > 1) {
              const key = _line[0]
              const content = _line[1].trimStart()

              if (key === 'ER') {
                currentReference++
                const isDuplicate = this.fileReferences.some(ref =>
                  ref.title === base.title &&
                  ref.publication_year === base.publication_year
                )

                if (!isDuplicate) {
                  console.log(`Procesando referencia ${currentReference}:`, {
                    title: base.title,
                    authors: base.authors.length,
                    year: base.publication_year
                  })
                  const referenceCopy = JSON.parse(JSON.stringify(base))
                  this.fileReferences.push(referenceCopy)
                } else {
                  console.log(`Referencia duplicada encontrada: ${base.title}`)
                }
                base = { title: '', authors: [], user_definable: [] }
              } else {
                this.processReferenceLine(key, content, base, titleTags, authorTags, userDefinable)
              }
            }
          })

          this.uploadProgress = `${this.fileReferences.length} referencias procesadas localmente`
          console.log(`Total de referencias procesadas: ${this.fileReferences.length}`)
        } catch (error) {
          console.error('Error en watcher pre_references:', error)
          this.uploadProgress = `Error: ${error.message}`
        }
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
