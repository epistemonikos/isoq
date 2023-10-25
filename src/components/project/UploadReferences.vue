<template>
  <div>
    <h4 class="mt-5">STEP 1: Upload the <b>references</b> for your included studies (required)</h4>
    <p class="font-weight-light">
    You must import only the references for your final list of included studies
    </p>
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
                id="btnEpisteRequestClean"
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
                  <ul>
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
                cols="6"
                class="pt-2">
                <span>You have <b>{{ references.length }}</b> references loaded</span>
              </b-col>
              <b-col cols="6">
                <b-button
                  block
                  @click="openModalReferencesSingle"
                  variant="outline-primary">
                  View references
                </b-button>
              </b-col>
            </b-row>
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
    lists: Array
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
      btnSearchPubMed: false,
      localReferences: []
    }
  },
  methods: {
    loadRefs: function (event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        this.pre_references = e.target.result
      }
      reader.readAsText(file)
    },
    saveReferences: function (from = '') {
      this.$emit('statusLoadReferences', true)
      let references = ''
      if (from === '') {
        references = this.fileReferences
      } else {
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
        references = _r
      }
      let axiosArray = []
      for (let ref of references) {
        ref.organization = this.$route.params.org_id
        ref.project_id = this.$route.params.id
        let newPromise = axios({
          method: 'POST',
          url: `/api/isoqf_references?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`,
          data: ref
        })
        axiosArray.push(newPromise)
      }
      axios.all(axiosArray)
        .then((responses) => {
          let cnt = 0
          for (let response of responses) {
            const data = response.data
            this.localReferences.push(data)
            cnt++
          }
          this.$emit('CallUpdateMyDataTables')
          const _references = JSON.parse(JSON.stringify(this.localReferences))
          this.prefetchDataForExtractedDataUpdate(_references)

          this.msgUploadReferences = `${cnt} references have been added.`
          this.pre_references = ''
          this.fileReferences = []
          this.$emit('CallEpisteReponse', [])
          this.$emit('CallGetReferences', false)
          this.$refs['file-input'].reset()
        })
        .catch((error) => {
          console.log('error', error)
        })
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
      for (const line of allLines) {
        if (!isNaN(line) && line.length === 8) {
          try {
            const response = await this.apiPubMed(line)
            if (response.status === 200) {
              if (Object.prototype.hasOwnProperty.call(response.data, 'error') || Object.prototype.hasOwnProperty.call(response.data, 'esummaryresult')) {
                this.pubmedErrorImported.push(line)
              } else {
                if (Object.prototype.hasOwnProperty.call(response.data.result, 'uids')) {
                  if (response.data.result.uids.length) {
                    const uid = response.data.result.uids[0]
                    const data = response.data.result[uid]
                    if (Object.prototype.hasOwnProperty.call(data, 'error')) {
                      this.pubmedErrorImported.push(line)
                    } else {
                      this.processPubmedData(data)
                    }
                  } else {
                    this.pubmedErrorImported.push(line)
                  }
                }
              }
            }
          } catch (error) {
            console.log(error)
          }
        } else {
          this.pubmedErrorImported.push(line)
        }
      }
      this.pubmed_loading = false
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
      const urlBase = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?api_key=abdb2d5a30084a5a7200df1515d45fb36f08&db=pubmed&retmode=json&id='
      try {
        const response = await axios.get(urlBase + id)
        return response
      } catch (error) {
        console.log(error)
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
    importReferences: function () {
      if (this.pubmed_selected.length) {
        for (let index of this.pubmed_selected) {
          delete this.pubmed_requested[index].disabled
          axios.post('/api/isoqf_references', this.pubmed_requested[index])
            .then(() => {
              this.pubmed_requested.splice(index, 1)
            })
            .catch((error) => {
              console.log(error)
            })
        }
        this.$emit('statusLoadReferences', true)
        this.pubmed_request = ''
        this.pubmed_requested = []
        this.pubmed_selected = []
        this.pubmedErrorImported = []
        this.$emit('CallGetReferences', false)
        this.btnSearchPubMed = false
      }
    },
    openModalReferencesSingle: function () {
      this.$emit('openModalReferencesSingle', true)
    },
    prefetchDataForExtractedDataUpdate: function (references) {
      let _lists = JSON.parse(JSON.stringify(this.lists))
      let _requestFindings = []
      let _requestExtractedData = []

      for (let list of _lists) {
        _requestFindings.push(axios.get(`/api/isoqf_findings?organization=${this.$route.params.org_id}&list_id=${list.id}`))
      }
      axios.all(_requestFindings)
        .then((responses) => {
          for (let _response of responses) {
            let response = _response.data[0]
            _requestExtractedData.push(axios.get(`/api/isoqf_extracted_data?organization=${response.organization}&finding_id=${response.id}`))
          }
          this.updateExtractedDataReferences(_requestExtractedData, references)
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    updateExtractedDataReferences: function (querys = [], references = []) {
      if (references.length) {
        if (querys.length) {
          axios.all(querys)
            .then((responses) => {
              let item = {}
              let _items = []
              let patchExtractedData = []
              for (let reference of references) {
                item = {
                  'ref_id': reference.id,
                  'authors': this.parseReference(reference, true),
                  'column_0': ''
                }
                _items.push(item)
              }
              for (let _response of responses) {
                let response = _response.data[0]
                for (let _item of _items) {
                  for (let item of response.items) {
                    if (item.ref_id === _item.ref_id) {
                      if (item.column_0.length) {
                        _item.column_0 = item.column_0
                      }
                    }
                  }
                }
                const params = {
                  items: _items
                }
                patchExtractedData.push(axios.patch(`/api/isoqf_extracted_data/${response.id}`, params))
              }
              if (patchExtractedData.length) {
                axios.all(patchExtractedData)
                  .then(() => {})
                  .catch((error) => {
                    this.printErrors(error)
                  })
              }
            })
        }
      }
    }
  },
  watch: {
    pre_references: function (data) {
      this.fileReferences = []
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
    }
  }
}
</script>
