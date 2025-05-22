<template>
  <div>
    <h4>STEP 1: Upload the <b>references</b> for your included studies (required)</h4>
    <p class="font-weight-light">
      You must import only the references for your final list of included studies
    </p>
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

      // Estado para PubMed
      pubmed_request: '',
      pubmed_requested: [],
      pubmed_selected: [],
      pubmed_loading: false,
      pubmed_error: false,
      pubmedErrorImported: [],
      btnSearchPubMed: false,
      btnCleanDisabled: true,

      // Estado para referencias locales
      localReferences: [],

      // Estado para eliminación
      disableBtnRemoveAllRefs: false,
      appearMsgRemoveReferences: false,

      // Configuración de la tabla
      fields_references_table: [
        {
          key: 'authors',
          label: 'Author(s)',
          formatter: value => {
            if (value.length < 1) return 'no author(s)'
            if (value.length === 1) return value[0].split(',')[0]
            if (value.length === 2) return value[0].split(',')[0] + ' & ' + value[1].split(',')[0]
            return value[0].split(',')[0] + ' et al.'
          }
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
                  findings.push(`#${list.cnt || list.sort}`)
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
  methods: {
    // Método para cargar referencias
    loadRefs (event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        this.pre_references = e.target.result
        // Probar el procesamiento de referencias
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
      if (key === 'ER') {
        const referenceCopy = JSON.parse(JSON.stringify(base))
        this.fileReferences.push(referenceCopy)
        base = { title: '', authors: [], user_definable: [] }
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

    // Métodos para API
    async apiPubMed (id) {
      const urlBase = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?api_key=${process.env.PUBMED_API_KEY}&db=pubmed&retmode=json&id=`
      try {
        return await axios.get(urlBase + id)
      } catch (error) {
        console.error('Error en API PubMed:', error)
        throw error
      }
    },

    // Métodos para guardar referencias
    async saveReferences (from = '') {
      this.$emit('statusLoadReferences', true)
      let references = from === '' ? this.fileReferences : this.processEpisteResponse()

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
        }

        await this.prefetchDataForExtractedDataUpdate(_references)

        this.msgUploadReferences = `${this.localReferences.length} references have been added.`
        this.resetFileUpload()
        this.$emit('CallGetReferences', false)
      } catch (error) {
        console.error('Error guardando referencias:', error)
        this.$emit('statusLoadReferences', false)
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

    getProject: function () {
      this.$emit('CallGetProject')
    },

    requestsImportReferences: async function (ref) {
      return axios({
        method: 'POST',
        url: `/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`,
        data: ref
      })
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
      let axiosRequests = []
      for (const index of this.pubmed_selected) {
        delete this.pubmed_requested[index].disabled
        axiosRequests.push(await this.requestImportReferences(index))
      }
      Promise.all(axiosRequests)
        .then(() => {
          this.pubmed_request = ''
          this.pubmed_requested = []
          this.pubmed_selected = []
          this.pubmedErrorImported = []
          this.btnSearchPubMed = false
          this.$emit('CallGetReferences', false)
        })
        .catch((error) => {
          this.$emit('statusLoadReferences', false)
          console.log('error', error)
        })
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
      let _lists = JSON.parse(JSON.stringify(this.lists))
      let _requestFindings = []

      for (const list of _lists) {
        _requestFindings.push(await this.axiosGetFindings(list.id))
      }
      Promise.all(_requestFindings)
        .then(async (responses) => {
          let requestExtractedData = []
          for (const response of responses) {
            requestExtractedData.push(await this.axiosGetExtractedData(response.data[0].organization, response.data[0].id))
          }
          await this.updateExtractedDataReferences(requestExtractedData, references)
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },

    updateExtractedDataReferences: async function (extractedDataQuerys = [], references = []) {
      if (references.length) {
        if (extractedDataQuerys.length) {
          Promise.all(extractedDataQuerys)
            .then(async (responses) => {
              let item = {}
              let itemsReferences = []
              let patchExtractedData = []
              for (let reference of references) {
                item = {
                  'ref_id': reference.id,
                  'authors': this.parseReference(reference, true),
                  'column_0': ''
                }
                itemsReferences.push(item)
              }
              for (let _response of responses) {
                let responseItems = _response.data[0].items
                responseItems.push(...itemsReferences)
                const params = {
                  items: responseItems
                }
                patchExtractedData.push(await this.axiosPatchExtractedData(_response.data[0].id, params))
              }
              Promise.all(patchExtractedData)
                .then(() => { })
                .catch((error) => {
                  this.printErrors(error)
                })
            })
        }
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

    confirmRemoveReferenceById: function (refId) {
      if (!refId) return
      const lists = JSON.parse(JSON.stringify(this.lists))
      const charsOfStudies = JSON.parse(JSON.stringify(this.charsOfStudies))
      const _assessments = JSON.parse(JSON.stringify(this.methodologicalTableRefs))
      let objs = []
      let requests = []

      for (const list of lists) {
        let obj = { id: null, references: [] }
        for (const rr of list.raw_ref) {
          if (rr.id !== refId) {
            obj.references.push(rr.id)
          }
          if (rr.id === refId) {
            obj.id = list.id
            objs.push(obj)
          }
        }
      }

      if (Object.prototype.hasOwnProperty.call(charsOfStudies, 'id')) {
        if (charsOfStudies.items.length) {
          let items = []

          for (const item of charsOfStudies.items) {
            if (item.ref_id !== refId) {
              items.push(item)
            }
          }
          charsOfStudies.items = items

          requests.push(axios.patch(`/api/isoqf_characteristics/${charsOfStudies.id}`, charsOfStudies))
        }
      }

      if (Object.prototype.hasOwnProperty.call(_assessments, 'id')) {
        if (_assessments.items.length) {
          let items = []

          for (const item of _assessments.items) {
            if (item.ref_id !== refId) {
              items.push(item)
            }
          }
          _assessments.items = items

          requests.push(axios.patch(`/api/isoqf_assessments/${_assessments.id}`, _assessments))
        }
      }

      for (let o of objs) {
        requests.push(axios.patch(`/api/isoqf_lists/${o.id}`, { references: o.references }))
      }

      if (requests.length) {
        Promise.all(requests)
      }

      axios.delete(`/api/isoqf_references/${refId}`)
        .then(() => {
          this.$emit('CallGetReferences', false)
          this.openModalReferencesSingle(false)
          this.$emit('CallGetProject')
        })
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
        const _assessments = response.data[0]
        if (response.data.length) {
          const assessmentId = _assessments.id

          let data = []
          for (let i = 0; i < references.length; i++) {
            data.push({
              ref_id: references[i].id,
              authors: this.parseReference(references[i], true),
              stages: [
                {
                  key: 0,
                  options: [
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    }
                  ]
                },
                {
                  key: 1,
                  options: [
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    }
                  ]
                },
                {
                  key: 2,
                  options: [
                    {
                      option: null,
                      text: ''
                    }
                  ]
                },
                {
                  key: 3,
                  options: [
                    {
                      option: null,
                      text: ''
                    }
                  ]
                }
              ]
            })
          }
          _assessments.items.push(...data)
          await axios.patch(`/api/isoqf_assessments/${assessmentId}`, _assessments)
        } else {
          let items = []
          for (let i = 0; i < references.length; i++) {
            items.push({
              ref_id: references[i].id,
              authors: this.parseReference(references[i], true),
              stages: [
                {
                  key: 0,
                  options: [
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    }
                  ]
                },
                {
                  key: 1,
                  options: [
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    },
                    {
                      option: null,
                      text: ''
                    }
                  ]
                },
                {
                  key: 2,
                  options: [
                    {
                      option: null,
                      text: ''
                    }
                  ]
                },
                {
                  key: 3,
                  options: [
                    {
                      option: null,
                      text: ''
                    }
                  ]
                }
              ]
            })
          }
          await axios.post('/api/isoqf_assessments', {
            organization: this.$route.params.org_id,
            project_id: this.$route.params.id,
            items: items
          })
        }
      } catch (error) {
        console.error('Error en la actualización de calificaciones:', error)
      }
    }
  },
  watch: {
    pre_references: {
      handler (data) {
        console.log('Iniciando procesamiento de referencias...')
        this.fileReferences = []
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
        console.log(`Total de referencias procesadas: ${this.fileReferences.length}`)
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
