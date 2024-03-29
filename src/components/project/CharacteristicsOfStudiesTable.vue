<template>
  <div>
    <h4 class="mt-5">STEP 3: Create or import your <b>characteristics of studies table</b> (recommended)</h4>
    <p class="font-weight-light">
      Descriptive information extracted from the included studies (e.g. setting, country, perspectives, methods, etc.)
    </p>
    <b-row
      v-if="checkPermissions">
      <b-col
        sm="4">
        <b-button
          block
          variant="outline-primary"
          :disabled="(references.length) ? false : true"
          v-if="charsOfStudies.fields.length <= 2"
          @click="openModalCharsOfStudies()">
          Create Table
        </b-button>
        <b-button
          block
          variant="outline-primary"
          v-if="charsOfStudies.fields.length > 2"
          @click="openModalCharsOfStudiesEdit">
          Add or Edit column headings
        </b-button>
      </b-col>
      <b-col
        sm="1">
        <p class="text-center pt-1">OR</p>
      </b-col>
      <b-col
        sm="4">
        <b-button
          block
          variant="outline-info"
          :disabled="(references.length) ? false : true"
          v-b-modal.import-characteristics-table>
          Import table
        </b-button>
      </b-col>
      <b-col
        sm="3"
        v-if="charsOfStudies.fields.length > 2">
        <b-button
          variant="outline-secondary"
          block
          @click="exportTableToCSV('chars_of_studies')">
          Export to XLS file
        </b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col
        cols="12">
        <b-table
          sort-by="authors"
          id="chars-of-studies-table"
          class="table-content-refs mt-3"
          v-if="charsOfStudies.fieldsObj.length > 1"
          :fields="charsOfStudies.fieldsObj"
          :items="charsOfStudies.items"
          :current-page="charsOfStudiesTableSettings.currentPage"
          :per-page="charsOfStudiesTableSettings.perPage"
          :busy="charsOfStudiesTableSettings.isBusy">
          <template
            v-slot:cell(authors)="data">
            <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
          </template>
          <template
            v-slot:cell(actions)="data"
            v-if="charsOfStudies.fields.length > 2">
            <b-button
              block
              variant="outline-success"
              @click="addDataCharsOfStudies((charsOfStudiesTableSettings.currentPage > 1) ? (charsOfStudiesTableSettings.perPage * (charsOfStudiesTableSettings.currentPage - 1)) + data.index : data.index)">
              <font-awesome-icon
                icon="edit"></font-awesome-icon>
            </b-button>
            <b-button
              block
              variant="outline-danger"
              @click="removeItemCharOfStudies((charsOfStudiesTableSettings.currentPage > 1) ? (charsOfStudiesTableSettings.perPage * (charsOfStudiesTableSettings.currentPage - 1)) + data.index : data.index, data.item.ref_id)">
              <font-awesome-icon
                icon="trash"></font-awesome-icon>
            </b-button>
          </template>
          <template v-slot:table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
              <strong>Loading...</strong>
            </div>
          </template>
        </b-table>
      </b-col>

      <b-col
        cols="12">
        <b-pagination
          v-if="charsOfStudies.items.length && charsOfStudies.items.length > charsOfStudiesTableSettings.perPage"
          align="center"
          v-model="charsOfStudiesTableSettings.currentPage"
          :total-rows="charsOfStudies.items.length"
          :per-page="charsOfStudiesTableSettings.perPage"
          aria-controls="chars-of-studies-table">
        </b-pagination>
      </b-col>

      <b-col
        cols="12">
        <BackToTop/>
      </b-col>

      <b-modal
        size="xl"
        id="open-char-of-studies-table-modal"
        ref="open-char-of-studies-table-modal"
        scrollable
        :ok-disabled="(charsOfStudiesFieldsModal.fields[0])?false:true"
        @ok="saveCharacteristicsStudiesFields"
        ok-title="Save"
        ok-variant="outline-success"
        cancel-variant="outline-secondary">
        <template v-slot:modal-title>
          <videoHelp txt="Column Headers" tag="none" urlId="449742512"></videoHelp>
        </template>
        <p class="font-weight-light">
          Column headings describe the categories of the descriptive information extracted – e.g. setting, country, perspectives, methods, etc.
        </p>
        <ul class="font-weight-light text-danger">
          <li>Do not add columns for author or year (these will be added automatically)</li>
          <li>Do not add methodological assessments (critical/quality appraisal). These go in a separate table.</li>
        </ul>
        <b-form-group
          label="Number of columns">
          <b-form-input
            id="nro-columns"
            v-model="charsOfStudiesFieldsModal.nroColumns"
            type="number" min="1"></b-form-input>
        </b-form-group>
        <b-form-group
          v-for="cnt in parseInt(charsOfStudiesFieldsModal.nroColumns)"
          :key="cnt"
          :label="`Column #${cnt}`">
          <b-input-group>
            <b-form-input
              :id="`column_${cnt}`"
              v-model="charsOfStudiesFieldsModal.fields[cnt - 1]"
              type="text"></b-form-input>
            <b-input-group-append
              v-if="charsOfStudies.id">
              <b-button
                variant="outline-danger"
                @click="deleteFieldFromCharsSudies(cnt - 1)">
                <font-awesome-icon
                  icon="trash"></font-awesome-icon>
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>
      </b-modal>

      <b-modal
        size="xl"
        id="open-char-of-studies-table-modal-edit"
        ref="open-char-of-studies-table-modal-edit"
        scrollable
        :ok-disabled="(charsOfStudiesFieldsModalEdit.fields.length)?((charsOfStudiesFieldsModalEdit.fields[0].label)?false:true):false"
        @ok="updateCharacteristicsStudiesFields"
        ok-variant="outline-success"
        ok-title="Save"
        cancel-variant="outline-secondary">
        <template v-slot:modal-title>
          <videoHelp txt="Edit column headers" tag="none" urlId="449742512"></videoHelp>
        </template>
        <p class="font-weight-light">
          Column headings describe the categories of the descriptive information extracted – e.g. setting, country, perspectives, methods, etc.
        </p>
        <draggable v-model="charsOfStudiesFieldsModalEdit.fields" group="columns" @start="drag=true" @end="drag=false">
          <b-form-group
            v-for="(field, index) in charsOfStudiesFieldsModalEdit.fields"
            :key="index"
            :label="`Column #${index}`">
            <b-input-group>
              <b-form-input
                :id="`column_${index}`"
                v-model="field.label"
                type="text"></b-form-input>
              <b-input-group-append>
                <b-button
                  v-if="charsOfStudiesFieldsModalEdit.fields.length > 1"
                  :id="`drag-button-chars-${index}`"
                  variant="outline-secondary"
                  v-b-tooltip
                  title="Drag to sort">
                  <font-awesome-icon
                    icon="arrows-alt"></font-awesome-icon>
                </b-button>
                <b-button
                  variant="outline-danger"
                  @click="deleteFieldFromCharsSudiesEdit(index)">
                  <font-awesome-icon
                    icon="trash"></font-awesome-icon>
                </b-button>
              </b-input-group-append>
            </b-input-group>
          </b-form-group>
        </draggable>
        <b-button
          class="mb-2"
          @click="charsOfStudiesNewColumn"
          variant="outline-success">
          Add new column
        </b-button>
      </b-modal>

      <b-modal
        size="xl"
        ref="edit-chars-of-studies-data"
        title="Edit data"
        scrollable
        @ok="saveDataCharsOfStudies"
        ok-title="Save"
        ok-variant="outline-success"
        cancel-variant="outline-secondary">
        <template
          v-if="charsOfStudiesFieldsModal.items.length">
          <b-form-group
            v-if="field.key !== 'ref_id'"
            v-for="field of charsOfStudies.fields"
            :key="field.id"
            :label="field.label"
            label-class="font-weight-bold">
            <template v-if="['ref_id', 'authors'].includes(field.key)">
              <p>{{ charsOfStudiesFieldsModal.items[charsOfStudiesFieldsModal.selected_item_index][field.key] }}</p>
            </template>
            <template v-else>
              <b-form-textarea
                v-if="!['ref_id', 'authors'].includes(field.key)"
                v-model="charsOfStudiesFieldsModal.items[charsOfStudiesFieldsModal.selected_item_index][field.key]"
                rows="2"
                max-rows="100"></b-form-textarea>
            </template>
          </b-form-group>
        </template>
      </b-modal>

      <b-modal
        :no-close-on-backdrop="true"
        :no-close-on-esc="true"
        ok-title="Save"
        cancel-title="Close"
        size="xl"
        id="import-characteristics-table"
        ref="import-characteristics-table">
        <template v-slot:modal-title>
          <videoHelp txt="Import table" tag="none" urlId="450046545"></videoHelp>
        </template>
        <b-alert show variant="danger">
          <b>Beware:</b> The newly imported and saved data will delete and replace any previous data entered manually or through import.
        </b-alert>
        <p
        class="font-weight-light">
          To upload a table, follow these steps:
        </p>
        <h4>STEP 1: Download the template (excel file), save it to your computer, and populate it with your information.</h4>
        <p
          class="text-danger">
          <b>When you save the file, choose 'CSV-UTF-8 (Comma delimited) (*.csv)' as the "Save as type"</b>
        </p>
        <p class="text-danger">
          <b>If you have problems with the template this may be due to the version of Excel you are using or your settings. We recommend you work on the table in Google Sheets (Gdrive)</b>
        </p>
        <p
          class="text-danger">
          <b>The first two columns «Reference ID» and «Author(s), Year» must not be altered in any way.</b>
        </p>
        <b-button
          variant="info"
          @click="callGenerateTemplate">
          Download template
        </b-button>
        <h4 class="mt-5">STEP 2: Import the populated template to iSoQ</h4>
        <b-form-file
          ref="import-chars-table-file"
          id="input-template-chars-file"
          plain
          @change="loadTableImportData($event)"></b-form-file>
        <h4 class="mt-5">STEP 3: Look at the preview of the table below and accept or reject it</h4>
        <p>If it looks right, accept the import by clicking the "Save" button at the bottom of the page.</p>
        <p>If something doesn't look right, remove it by clicking the "Reject" button at the bottom of the page and return to Step 2. <a href="#" v-b-modal='`videoHelp-450046545`'>See help video</a> for support.</p>
        <b-alert
          variant="info"
          :show="importDataTable.error !== null">
          {{ importDataTable.error }}
        </b-alert>
        <b-table
          v-if="importDataTable.items.length"
          sticky-header
          responsive
          :fields="importDataTable.fieldsObj"
          :items="importDataTable.items"></b-table>
        <template v-slot:modal-footer>
          <b-button
            variant="outline-secondary"
            @click="cleanVars('close', 'modal-chars')">Close</b-button>
          <b-button
            variant="outline-info"
            :disabled="!importDataTable.items.length"
            @click="cleanVars('chars')">Reject</b-button>
          <b-button
            variant="outline-success"
            :disabled="!importDataTable.items.length"
            @click="saveImportedData('isoqf_characteristics')">Save</b-button>
        </template>
      </b-modal>

      <b-modal
        size="xl"
        id="removeContentModalCharsOfStudies"
        ref="removeContentModalCharsOfStudies"
        title="Remove content"
        ok-title="Confirm"
        ok-variant="outline-danger"
        cancel-variant="outline-success"
        @cancel="cleanRemoveContentCharsOfStudies"
        @ok="removeDataFromLists">
        <p>Are you sure you want to delete all the content for this row?</p>
        <p
          v-if="removeReferenceCharsOfStudies.findings.length === 0">
          <b>No findings will be affected</b>
        </p>
        <p
          v-if="removeReferenceCharsOfStudies.findings.length">
          <b>Findings that will be affected</b>
          <ul>
            <li v-for="(finding, index) in removeReferenceCharsOfStudies.findings" :key="index">
              {{ `finding # ${finding}`}}
            </li>
          </ul>
        </p>
      </b-modal>
    </b-row>
  </div>
</template>

<script>
import draggable from 'vuedraggable'
import axios from 'axios'
import Papa from 'papaparse'
const ExportCSV = require('export-to-csv').ExportToCsv

export default {
  name: 'CharacteristicsOfStudiesTable',
  components: {
    draggable,
    BackToTop: () => import('@/components/backToTop.vue'),
    videoHelp: () => import('@/components/videoHelp.vue')
  },
  props: {
    checkPermissions: {
      type: Boolean,
      required: true
    },
    project: {
      type: Object,
      required: true
    },
    ui: {
      type: Object,
      required: true
    },
    // charsOfStudies: {
    //   type: Object,
    //   required: true
    // },
    references: {
      type: Array,
      required: true
    },
    refs: {
      type: Array,
      required: true
    },
    // importDataTable: {
    //   type: Object,
    //   required: true
    // },
    lists: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      charsOfStudies: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      charsOfStudiesFieldsModal: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0
      },
      charsOfStudiesFieldsModalEdit: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0
      },
      charsOfStudiesTableSettings: {
        currentPage: 1,
        perPage: 10,
        isBusy: false
      },
      removeReferenceCharsOfStudies: {
        id: null,
        findings: []
      },
      pre_ImportDataTable: '',
      importDataTable: {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      }
    }
  },
  watch: {
    references () {
      console.log('watch references')
      this.updateMyDataTables()
    },
    pre_ImportDataTable: function (data) {
      let fields = []
      let items = []
      const csvData = Papa.parse(data, { skipEmptyLines: true })
      this.importDataTable.error = null
      if (csvData.data.length) {
        if (csvData.data[0].length < 3) {
          this.importDataTable.error = 'Your data might be wrongly formatted and therefore will not display. Check that you saved your file as the following file type: CSV-UTF-8 (Comma delimited) (*.csv). Also check that your table has at least one column.'
        } else {
          for (let cnt in csvData.data) {
            if (parseInt(cnt) === 0) {
              let cntI = 0
              for (let i in csvData.data[cnt]) {
                let obj = {}
                if (parseInt(i) === 0) {
                  obj.key = 'ref_id'
                }
                if (parseInt(i) === 1) {
                  obj.key = 'authors'
                }
                if (parseInt(i) > 1) {
                  this.importDataTable.fieldsObj.push({ 'key': 'column_' + cntI, 'label': csvData.data[cnt][i] })
                  obj.key = 'column_' + cntI
                  cntI++
                }
                obj.label = csvData.data[cnt][i]
                fields.push(obj)
              }
            } else {
              let cntI = 0
              let obj = {}
              for (let i in csvData.data[cnt]) {
                if (parseInt(i) === 0) {
                  obj.ref_id = csvData.data[cnt][i]
                }
                if (parseInt(i) === 1) {
                  obj.authors = csvData.data[cnt][i]
                }
                if (parseInt(i) > 1) {
                  obj[`column_${cntI}`] = csvData.data[cnt][i]
                  cntI++
                }
              }
              items.push(obj)
            }
          }
        }
      }
      this.importDataTable.fields = fields
      this.importDataTable.items = items
    },
    charsOfStudies () {
      this.$emit('fill-charsOfStudies', this.charsOfStudies, {})
    }
  },
  mounted () {
    this.getCharacteristics()
  },
  methods: {
    getCharacteristics: function () {
      this.charsOfStudiesTableSettings.isBusy = true
      console.log('getCharacteristics')
      axios.get(`/api/isoqf_characteristics?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
        .then((response) => {
          console.log('response: ', response)
          if (response.data.length) {
            this.charsOfStudies = response.data[0]
            if (Object.prototype.hasOwnProperty.call(this.charsOfStudies, 'fields')) {
              this.charsOfStudies.fieldsObj = [{ 'key': 'authors', 'label': 'Author(s), Year' }]

              const fields = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
              const items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

              const _items = items.sort((a, b) => a.authors.localeCompare(b.authors))
              this.charsOfStudies.items = _items

              this.charsOfStudiesFieldsModal.fields = []
              for (let f of fields) {
                if (f.key !== 'ref_id' && f.key !== 'authors' && f.key !== 'actions') {
                  this.charsOfStudiesFieldsModal.fields.push(f.label)
                  this.charsOfStudies.fieldsObj.push({ key: f.key, label: f.label })
                }
              }

              this.charsOfStudies.fieldsObj.push({'key': 'actions', 'label': ''})

              this.charsOfStudiesFieldsModal.nroColumns = (this.charsOfStudies.fieldsObj.length === 2) ? 1 : this.charsOfStudies.fieldsObj.length - 2

              for (let item of _items) {
                this.charsOfStudiesFieldsModal.items.push(item)
              }
            }
          } else {
            this.charsOfStudies = { fields: [], items: [], authors: '', fieldsObj: [ { key: 'authors', label: 'Author(s), Year' } ] }
          }
          this.charsOfStudiesTableSettings.isBusy = false
          this.$emit('fill-charsOfStudies', this.charsOfStudies, this.charsOfStudiesFieldsModal)
        })
    },
    callGenerateTemplate: function () {
      this.$emit('generate-template')
    },
    saveCharacteristicsStudiesFields: function () {
      console.log('saveCharacteristicsStudiesFields')
      this.charsOfStudiesTableSettings.isBusy = true
      let fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModal.fields))
      let references = JSON.parse(JSON.stringify(this.references))
      let params = {
        fields: [
          {'key': 'ref_id', 'label': 'Reference ID'},
          {'key': 'authors', 'label': 'Author(s), Year'}
        ],
        items: [],
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        nro_of_fields: fields.length,
        is_public: false
      }

      for (const index in fields) {
        let objField = {
          key: `column_${index}`,
          label: fields[index]
        }
        params.fields.push(objField)
      }

      for (const ref of references) {
        let objItem = {
          ref_id: ref.id,
          authors: this.getAuthorsFormat(ref.authors, ref.publication_year)
        }

        for (const cnt in fields) {
          objItem[`column_${cnt}`] = ''
        }

        params.items.push(objItem)
      }

      if (this.project.is_public) {
        params.is_public = true
      }

      if (Object.prototype.hasOwnProperty.call(this.charsOfStudies, 'id')) {
        axios.patch(`/api/isoqf_characteristics/${this.charsOfStudies.id}`, params)
          .then(() => {
            this.$emit('get-project')
            this.charsOfStudiesTableSettings.isBusy = false
          }).catch((error) => {
            console.log('error: ', error)
          })
      } else {
        axios.post('/api/isoqf_characteristics', params)
          .then(() => {
            this.getCharacteristics()
          })
          .catch((error) => {
            this.$emit('print-errors', error)
          })
      }
    },
    updateCharacteristicsStudiesFields: function () {
      this.charsOfStudiesTableSettings.isBusy = true
      let params = {
        is_public: false
      }
      let fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModalEdit.fields))

      fields.splice(0, 0, { 'key': 'ref_id', 'label': 'Reference ID' })
      fields.splice(1, 0, { 'key': 'authors', 'label': 'Author(s), Year' })

      params.fields = fields

      let _items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

      for (let item of _items) {
        for (let field of fields) {
          if (!Object.prototype.hasOwnProperty.call(item, field.key)) {
            delete item[field.key]
            item[field.key] = ''
          }
        }
      }

      params.items = _items

      if (this.project.is_public) {
        params.is_public = true
      }

      axios.patch(`/api/isoqf_characteristics/${this.charsOfStudies.id}`, params)
        .then(() => {
          this.getCharacteristics()
          this.charsOfStudiesTableSettings.isBusy = false
        })
        .catch((error) => {
          this.$emit('print-errors', error)
        })
    },
    charsOfStudiesNewColumn: function () {
      let _fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModalEdit.fields))
      let fields = []
      let column = '0'
      const excluded = ['ref_id', 'authors', 'actions']
      if (_fields.length) {
        for (let field of _fields) {
          if (!excluded.includes(field.key)) {
            fields.push(field)
          }
        }
        this.charsOfStudiesFieldsModalEdit.nroColumns = fields.length + 1
        column = parseInt(this.charsOfStudiesFieldsModalEdit.fields[ fields.length - 1 ].key.split('_')[1]) + 1
      }

      this.charsOfStudiesFieldsModalEdit.fields.push({'key': 'column_' + column.toString(), 'label': ''})
    },
    saveDataCharsOfStudies: function () {
      let params = {}
      let characteristicId = this.charsOfStudies.id
      params.items = this.charsOfStudiesFieldsModal.items

      axios.patch(`/api/isoqf_characteristics/${characteristicId}`, params)
        .then(() => {
          this.$emit('get-project')
          this.getCharacteristics()
          this.$refs['edit-chars-of-studies-data'].hide()
        })
        .catch((error) => {
          this.$emit('print-errors', error)
        })
    },
    cleanRemoveContentCharsOfStudies: function () {
      this.removeReferenceCharsOfStudies = {
        id: null,
        findings: []
      }
    },
    removeDataFromLists: function () {
      const index = this.removeReferenceCharsOfStudies.index
      let _items = JSON.parse(JSON.stringify(this.charsOfStudies.items))
      let params = {}
      let cnt = 0
      let items = []
      let _keys = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
      let keys = []
      for (let k of _keys) {
        keys.push(k.key)
      }

      for (let item of _items) {
        if (cnt === index) {
          let obj = {}
          for (let k in keys) {
            if (Object.prototype.hasOwnProperty.call(item, keys[k])) {
              if (keys[k] === 'ref_id' || keys[k] === 'authors') {
                obj[keys[k]] = item[keys[k]]
              } else {
                obj[keys[k]] = ''
              }
            } else {
              obj[keys[k]] = ''
            }
          }
          items.push(obj)
        } else {
          items.push(item)
        }
        cnt++
      }

      params.items = items

      axios.patch(`/api/isoqf_characteristics/${this.charsOfStudies.id}`, params)
        .then(() => {
          this.getCharacteristics()
        })
        .catch((error) => {
          this.$emit('print-errors', error)
        })
    },
    openModalCharsOfStudies: function () {
      let fields = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
      let editFields = []
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of fields) {
        if (!excluded.includes(field.key)) {
          editFields.push(field.label)
        }
      }
      this.charsOfStudiesFieldsModal.fields = editFields
      this.$refs['open-char-of-studies-table-modal'].show()
    },
    openModalCharsOfStudiesEdit: function () {
      let _fields = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
      let fields = []
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of _fields) {
        if (!excluded.includes(field.key)) {
          fields.push(field)
        }
      }

      this.charsOfStudiesFieldsModalEdit.fields = fields
      this.charsOfStudiesFieldsModalEdit.nroColumns = fields.length
      this.$refs['open-char-of-studies-table-modal-edit'].show()
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
    getReferenceInfo: function (refId) {
      for (let ref of this.refs) {
        if (ref.id === refId) {
          return ref.content
        }
      }
    },
    addDataCharsOfStudies: function (index = 0) {
      let items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

      this.charsOfStudiesFieldsModal.items = items
      this.charsOfStudiesFieldsModal.selected_item_index = index
      this.$refs['edit-chars-of-studies-data'].show()
    },
    removeItemCharOfStudies: function (index, id) {
      this.removeReferenceCharsOfStudies = {
        id: null,
        findings: []
      }
      let lists = JSON.parse(JSON.stringify(this.lists))

      this.removeReferenceCharsOfStudies.id = id
      this.removeReferenceCharsOfStudies.index = index

      for (let list of lists) {
        for (let ref of list.references) {
          if (id === ref) {
            this.removeReferenceCharsOfStudies.findings.push(list.isoqf_id)
          }
        }
      }
      this.$refs['removeContentModalCharsOfStudies'].show()
    },
    deleteFieldFromCharsSudiesEdit: function (index) {
      let params = {}
      const _fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModalEdit.fields))
      const _items = JSON.parse(JSON.stringify(this.charsOfStudies.items))

      let removedField = _fields.splice(index, 1)[0]

      _fields.splice(0, 0, { 'key': 'ref_id', 'label': 'Reference ID' })
      _fields.splice(1, 0, { 'key': 'authors', 'label': 'Author(s), Year' })

      for (let item of _items) {
        if (Object.prototype.hasOwnProperty.call(item, removedField.key)) {
          delete item[removedField.key]
        }
      }

      params.fields = _fields
      params.items = _items

      axios.patch(`/api/isoqf_characteristics/${this.charsOfStudies.id}`, params)
        .then((response) => {
          let _fields = JSON.parse(JSON.stringify(response.data['$set'].fields))
          const excluded = ['ref_id', 'authors', 'actions']
          let editFields = []
          for (let field of _fields) {
            if (!excluded.includes(field.key)) {
              editFields.push(field)
            }
          }

          this.charsOfStudiesFieldsModalEdit.fields = editFields
          this.charsOfStudiesFieldsModalEdit.nroColumns = editFields.length
          this.$emit('get-project')
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    loadTableImportData: function (event) {
      const file = event.target.files[0]
      const reader = new FileReader()
      reader.onload = (e) => {
        this.pre_ImportDataTable = e.target.result
      }
      reader.readAsText(file)
    },
    cleanVars: function (str = '', modal) {
      this.importDataTable = {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      }
      this.pre_ImportDataTable = ''
      if (str === 'chars') {
        this.$refs['import-chars-table-file'].reset()
      }
      if (str === 'meth') {
        this.$refs['import-meth-table-file'].reset()
      }
      if (str === 'close') {
        const _modal = (modal === 'modal-chars') ? 'import-characteristics-table' : 'import-methodological-table'
        this.$refs[_modal].hide()
      }
    },
    saveImportedData: function (endpoint = '') {
      if (!['isoqf_characteristics', 'isoqf_assessments'].includes(endpoint)) {
        return
      }
      if (!this.importDataTable.fields.length && !this.importDataTable.items.length) {
        return
      }
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        fields: this.importDataTable.fields,
        items: this.importDataTable.items
      }
      if (this.importDataTable.fields.length && this.importDataTable.items.length) {
        if (endpoint === 'isoqf_characteristics') {
          this.charsOfStudiesTableSettings.isBusy = true
          if (this.charsOfStudies.items.length) {
            this.cleanImportedData(this.charsOfStudies.id, endpoint, params)
          } else {
            this.insertImportedData(endpoint, params)
          }
        }
        if (endpoint === 'isoqf_assessments') {
          this.methodologicalTableRefsTableSettings.isBusy = true
          if (this.methodologicalTableRefs.items.length) {
            this.cleanImportedData(this.methodologicalTableRefs.id, endpoint, params)
          } else {
            this.insertImportedData(endpoint, params)
          }
        }
      }
      this.importDataTable = {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      }
      this.pre_ImportDataTable = ''
      this.$refs['import-characteristics-table'].hide()
    },
    cleanImportedData: function (id = '', endpoint = '', params = {}) {
      console.log('cleanImportedData', id, endpoint, params)
      axios.delete(`/api/${endpoint}/${id}`)
        .then(() => {
          this.pre_ImportDataTable = ''
          this.insertImportedData(endpoint, params)
        })
    },
    insertImportedData: function (endpoint = '', params = {}) {
      console.log('insertImportedData', endpoint, params)
      axios.post(`/api/${endpoint}/`, params)
        .then(() => {
          this.getCharacteristics()
        })
        .catch((error) => {
          this.printErrors(error)
        })
    },
    exportTableToCSV: function (type) {
      const _types = ['chars_of_studies', 'meth_assessments']
      let _headers = []
      let headers = []
      let _items = []
      let items = []

      if (_types.indexOf(type) !== -1) {
        switch (type) {
          case 'chars_of_studies':
            _headers = JSON.parse(JSON.stringify(this.charsOfStudies.fields))
            _items = JSON.parse(JSON.stringify(this.charsOfStudies.items))
            break
          case 'meth_assessments':
            _headers = JSON.parse(JSON.stringify(this.methodologicalTableRefs.fields))
            _items = JSON.parse(JSON.stringify(this.methodologicalTableRefs.items))
            break
          default:
            _headers = []
            _items = []
            break
        }

        let keys = []
        for (let f of _headers) {
          if (f.key !== 'ref_id' && f.key !== 'id') {
            headers.push('"' + f.label + '"')
            keys.push(f.key)
          }
        }

        for (let i of _items) {
          let item = {}
          for (let k in keys) {
            if (Object.prototype.hasOwnProperty.call(i, keys[k])) {
              item[keys[k]] = i[keys[k]]
            } else {
              item[keys[k]] = ''
            }
          }
          items.push(item)
        }
      }
      const options = {
        filename: type,
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalSeparator: '.',
        showLabels: true,
        useBom: true,
        headers: headers
      }
      const csvExporter = new ExportCSV(options)
      csvExporter.generateCsv(items)
    },
    updateMyDataTables: function () {
      let characteristicsItems = []
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }

      axios.get(`/api/isoqf_characteristics`, {params})
        .then((response) => {
          if (!response.data.length) {
            return
          }
          const responseData = JSON.parse(JSON.stringify(response.data[0]))
          const charId = responseData.id
          console.log(responseData.items.length, this.references.length, responseData.items.length)
          if (responseData.items.length) {
            console.log('aca')
            let items = JSON.parse(JSON.stringify(responseData.items))
            let references = []
            for (const item of items) {
              references.push(item.ref_id)
            }
            for (const reference of this.references) {
              if (!references.includes(reference.id)) {
                characteristicsItems.push({
                  ref_id: reference.id,
                  authors: this.parseReference(reference, true, false)
                })
              }
            }
            items.push(...characteristicsItems)
            let params = {
              items: items
            }
            axios.patch(`/api/isoqf_characteristics/${charId}`, params)
              .then(() => {
                console.log('patch characteristics')
                this.getCharacteristics()
              })
          }
        })

      // let _itemsMeth = []
        // axios.get(`/api/isoqf_assessments?organization=${this.$route.params.org_id}&project_id=${this.$route.params.id}`)
      //   .then((response) => {
      //     if (response.data.length && response.data[0].items.length && this.references.length > response.data[0].items.length) {
      //       let _items = response.data[0].items
      //       let _itemsChecks = []
      //       for (let item of _items) {
      //         _itemsChecks.push(item.ref_id)
      //       }
      //       for (let reference of this.references) {
      //         if (!_itemsChecks.includes(reference.id)) {
      //           _itemsMeth.push({ref_id: reference.id, authors: this.parseReference(reference, true, false)})
      //         }
      //       }
      //       _items.push(..._itemsMeth)
      //       let params = {
      //         items: _items
      //       }
      //       axios.patch(`/api/isoqf_assessments/${response.data[0].id}`, params)
      //         .then(() => {
      //           this.getMethodological()
      //         })
      //     }
      //   })
    },
    parseReference: (reference, onlyAuthors = false, hasSemicolon = true) => {
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
    deleteFieldFromCharsSudies: function (index) {
      let fields = JSON.parse(JSON.stringify(this.charsOfStudiesFieldsModal.fields))
      let params = {}
      params.fields = [{'key': 'ref_id', 'label': 'Reference ID'}, {'key': 'authors', 'label': 'Author(s), Year'}]

      fields.splice(index, 1)

      for (let cnt in fields) {
        let objField = {}
        objField.key = 'column_' + cnt
        objField.label = fields[cnt]
        params.fields.push(objField)
      }

      axios.patch(`/api/isoqf_characteristics/${this.charsOfStudies.id}`, params)
        .then((response) => {
          this.getProject()
          this.$emit('get-project')
        }).catch((error) => {
          console.log('error: ', error)
        })
    }
  }
}
</script>
