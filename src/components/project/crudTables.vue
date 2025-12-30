<template>
  <div>
    <b-row
      v-if="checkPermissions">
      <b-col
        sm="4">
        <b-button
          block
          variant="outline-primary"
          :disabled="(references.length) ? false : true"
          v-if="dataTable.fields.length <= 2"
          @click="openModalDataTable()">
          {{ $t('characteristics.create_table') }}
        </b-button>
        <b-button
          block
          variant="outline-primary"
          v-if="dataTable.fields.length > 2"
          @click="openModalDataTableEdit">
          {{ $t('characteristics.edit_columns') }}
        </b-button>
      </b-col>
      <b-col
        sm="1">
        <p class="text-center pt-1">{{ $t('common.or') }}</p>
      </b-col>
      <b-col
        sm="4">
        <b-button
          block
          variant="outline-info"
          :disabled="(references.length) ? false : true"
          @click="openModalImportTable()">
          {{ $t('characteristics.import_table') }}
        </b-button>
      </b-col>
      <b-col
        sm="3"
        v-if="dataTable.fields.length > 2">
        <b-button
          variant="outline-secondary"
          block
          @click="exportTableToCSV()">
          {{ $t('characteristics.export_xls') }}
        </b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col
        cols="12">
        <b-table
          sort-by="authors"
          :id="`${prefix}-table`"
          class="table-content-refs mt-3"
          v-if="dataTable.fieldsObj.length > 1"
          :fields="dataTable.fieldsObj"
          :items="dataTable.items"
          :current-page="dataTableSettings.currentPage"
          :per-page="dataTableSettings.perPage"
          :busy="dataTableSettings.isBusy"
          :responsive="true">
          <template
            v-slot:cell(authors)="data">
            <a :id="`${prefix}-${data.item.ref_id}`"></a>
            <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
          </template>
          <template
            v-slot:cell(actions)="data"
            v-if="dataTable.fields.length > 2 && checkPermissions">
            <b-row>
              <b-col>
                <b-button
                  v-if="checkPermissions"
                  block
                  variant="outline-success"
                  @click="addContentDataTable((dataTableSettings.currentPage > 1) ? (dataTableSettings.perPage * (dataTableSettings.currentPage - 1)) + data.index : data.index)">
                  <font-awesome-icon
                    icon="edit"></font-awesome-icon>
                </b-button>
              </b-col>
              <b-col class="pt-2">
                <b-button
                  v-if="checkPermissions"
                  block
                  variant="outline-danger"
                  @click="openModalRemoveContentDataTable(data.item.ref_id)">
                  <font-awesome-icon
                    icon="trash"></font-awesome-icon>
                </b-button>
              </b-col>
            </b-row>
          </template>
          <template v-slot:table-busy>
            <div class="text-center text-danger my-2">
              <b-spinner class="align-middle"></b-spinner>
              <strong>{{ $t('common.loading') }}</strong>
            </div>
          </template>
        </b-table>
      </b-col>

      <b-col
        cols="12">
        <b-pagination
          v-if="dataTable.items.length && dataTable.items.length > dataTableSettings.perPage"
          align="center"
          v-model="dataTableSettings.currentPage"
          :total-rows="dataTable.items.length"
          :per-page="dataTableSettings.perPage"
          :aria-controls="`${prefix}-table`">
        </b-pagination>
      </b-col>

      <b-col
        cols="12">
        <BackToTop/>
      </b-col>

      <b-modal
        size="xl"
        id="open-dataTable-modal"
        ref="open-dataTable-modal"
        scrollable
        :ok-disabled="(dataTableFieldsModal.fields[0])?false:true"
        @ok="saveDataTableFields"
        :ok-title="$t('common.save')"
        ok-variant="outline-success"
        cancel-variant="outline-secondary">
        <template v-slot:modal-title>
          <videoHelp :txt="$t('characteristics.column_headers')" tag="none" urlId="449742512"></videoHelp>
        </template>
        <p class="font-weight-light">
          {{ $t('characteristics.column_help') }}
        </p>
        <ul class="font-weight-light text-danger">
          <li>{{ $t('characteristics.no_author_year') }}</li>
          <li v-if="type !== 'isoqf_assessments'">{{ $t('characteristics.no_meth_here') }}</li>
        </ul>
        <b-form-group
          :label="$t('characteristics.num_columns')">
          <b-form-input
            id="nro-columns"
            v-model="dataTableFieldsModal.nroColumns"
            type="number" min="1"></b-form-input>
        </b-form-group>
        <b-form-group
          v-for="cnt in parseInt(dataTableFieldsModal.nroColumns)"
          :key="cnt"
          :label="$t('characteristics.column_n', {n: cnt})">
          <b-input-group>
            <b-form-input
              :id="`column_${cnt}`"
              v-model="dataTableFieldsModal.fields[cnt - 1]"
              type="text"></b-form-input>
            <b-input-group-append
              v-if="dataTable.id">
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
        id="open-dataTable-modal-edit"
        ref="open-dataTable-modal-edit"
        scrollable
        :ok-disabled="(dataTableFieldsModalEdit.fields.length)?((dataTableFieldsModalEdit.fields[0].label)?false:true):false"
        @ok="updateDataTableFields"
        ok-variant="outline-success"
        :ok-title="$t('common.save')"
        cancel-variant="outline-secondary">
        <template v-slot:modal-title>
          <videoHelp :txt="$t('characteristics.edit_columns')" tag="none" urlId="449742512"></videoHelp>
        </template>
        <p class="font-weight-light">
          {{ $t('characteristics.column_help') }}
        </p>
        <draggable v-model="dataTableFieldsModalEdit.fields" group="columns" @start="drag=true" @end="drag=false">
          <b-form-group
            v-for="(field, index) in dataTableFieldsModalEdit.fields"
            :key="index"
            :label="$t('characteristics.column_n', {n: index})">
            <b-input-group>
              <b-form-input
                :id="`column_${index}`"
                v-model="field.label"
                type="text"></b-form-input>
              <b-input-group-append>
                <b-button
                  v-if="dataTableFieldsModalEdit.fields.length > 1"
                  :id="`drag-button-chars-${index}`"
                  variant="outline-secondary"
                  v-b-tooltip
                  :title="$t('characteristics.drag_sort')">
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
          @click="dataTableNewColumn"
          variant="outline-success">
          {{ $t('characteristics.add_new_column') }}
        </b-button>
      </b-modal>

      <b-modal
        size="xl"
        ref="edit-content-dataTable"
        :title="$t('characteristics.edit_data')"
        scrollable
        @ok="saveContentDataTable"
        :ok-title="$t('common.save')"
        ok-variant="outline-success"
        cancel-variant="outline-secondary">
        <template
          v-if="dataTableFieldsModal.items.length">
          <b-form-group
            v-if="field.key !== 'ref_id'"
            v-for="field of dataTable.fields"
            :key="field.id"
            :label="field.label"
            label-class="font-weight-bold">
            <template v-if="['ref_id', 'authors'].includes(field.key)">
              <p>{{ dataTableFieldsModal.items[dataTableFieldsModal.selected_item_index][field.key] }}</p>
            </template>
            <template v-else>
              <b-form-textarea
                v-if="!['ref_id', 'authors'].includes(field.key)"
                v-model="dataTableFieldsModal.items[dataTableFieldsModal.selected_item_index][field.key]"
                :placeholder="(type === 'isoqf_assessments') ? $t('meth_assessments.enter_assessment') : ''"
                rows="2"
                max-rows="100"></b-form-textarea>
            </template>
          </b-form-group>
        </template>
      </b-modal>

      <b-modal
        size="xl"
        id="removeContentModalDataTable"
        ref="removeContentModalDataTable"
        :title="$t('characteristics.remove_content')"
        :ok-title="$t('common.confirm')"
        ok-variant="outline-danger"
        cancel-variant="outline-success"
        @cancel="cleanRemoveContentCharsOfStudies"
        @ok="removeDataFromLists">
        <p>{{ $t('characteristics.confirm_delete_row') }}</p>
        <p
          v-if="removeReferenceDataTable.findings.length === 0">
          <b>{{ $t('characteristics.no_findings_affected') }}</b>
        </p>
        <p
          v-if="removeReferenceDataTable.findings.length">
          <b>{{ $t('characteristics.findings_affected') }}</b>
          <ul>
            <li v-for="(finding, index) in removeReferenceDataTable.findings" :key="index">
              {{ $t('characteristics.finding_n', {n: finding}) }}
            </li>
          </ul>
        </p>
      </b-modal>

      <b-modal
        :no-close-on-backdrop="true"
        :no-close-on-esc="true"
        :ok-title="$t('common.save')"
        :cancel-title="$t('common.close')"
        size="xl"
        id="`import-table-${this.type}`"
        :ref="`import-table-${this.type}`">
        <template v-slot:modal-title>
          <videoHelp :txt="$t('characteristics.import_table')" tag="none" urlId="450046545"></videoHelp>
        </template>
        <b-alert show variant="danger">
          <b>{{ $t('import_modal.beware') }}</b> {{ $t('import_modal.overwrite_warning') }}
        </b-alert>
        <p
        class="font-weight-light">
          {{ $t('import_modal.steps_title') }}
        </p>
        <h4>{{ $t('import_modal.step1') }}</h4>
        <p
          class="text-danger">
          <b>{{ $t('import_modal.save_as_csv') }}</b>
        </p>
        <p class="text-danger">
          <b>{{ $t('import_modal.template_problems') }}</b>
        </p>
        <p
          class="text-danger">
          <b>{{ $t('import_modal.columns_warning') }}</b>
        </p>
        <b-button
          variant="info"
          @click="generateTemplate">
          {{ $t('import_modal.download_template') }}
        </b-button>
        <h4 class="mt-5">{{ $t('import_modal.step2') }}</h4>
        <b-form-file
          ref="import-file"
          id="input-template-chars-file"
          plain
          @change="loadTableImportData($event)"></b-form-file>
        <h4 class="mt-5">{{ $t('import_modal.step3') }}</h4>
        <p>{{ $t('import_modal.accept_info') }}</p>
        <p>{{ $t('import_modal.reject_info') }} <a href="#" v-b-modal='`videoHelp-450046545`'>{{ $t('import_modal.see_help') }}</a></p>
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
            @click="cleanVars(true)">{{ $t('common.close') }}</b-button>
          <b-button
            variant="outline-info"
            :disabled="!importDataTable.items.length"
            @click="cleanVars()">{{ $t('common.reject') }}</b-button>
          <b-button
            variant="outline-success"
            :disabled="!importDataTable.items.length"
            @click="saveImportedData()">{{ $t('common.save') }}</b-button>
        </template>
      </b-modal>

    </b-row>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import Papa from 'papaparse'
import Commmons from '@/utils/commons.js'
const ExportCSV = require('export-to-csv').ExportToCsv

export default {
  name: 'crudTables',
  props: {
    type: {
      type: String,
      default: ''
    },
    prefix: {
      type: String,
      default: ''
    },
    checkPermissions: {
      type: Boolean,
      default: false
    },
    project: {
      type: Object,
      default: () => {}
    },
    ui: {
      type: Object,
      default: () => {}
    },
    references: {
      type: Array,
      default: () => []
    },
    refs: {
      type: Array,
      default: () => []
    },
    lists: {
      type: Array,
      default: () => []
    }
  },
  components: {
    BackToTop: () => import('@/components/backToTop.vue'),
    draggable: () => import('vuedraggable'),
    videoHelp: () => import('@/components/videoHelp.vue')
  },
  mounted () {
    this.importDataTable.fieldsObj[0].label = this.$t('table_headers.author_year')
    this.getData()
  },
  data () {
    return {
      dataTable: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: this.$t('table_headers.author_year') }
        ]
      },
      dataTableFieldsModal: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0
      },
      dataTableFieldsModalEdit: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0
      },
      dataTableSettings: {
        currentPage: 1,
        perPage: 10,
        isBusy: false
      },
      removeReferenceDataTable: {
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
    pre_ImportDataTable: function (data) {
      let fields = []
      let items = []
      const csvData = Papa.parse(data, { skipEmptyLines: true })
      this.importDataTable.error = null
      if (csvData.data.length) {
        if (csvData.data[0].length < 3) {
          this.importDataTable.error = this.$t('import_modal.format_error')
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
    references () {
      this.updateMyDataTables()
    }
  },
  methods: {
    getData: function () {
      this.dataTableSettings.isBusy = true
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      Api.get(`/${this.type}`, params)
        .then((response) => {
          if (response.data.length) {
            const dataTable = JSON.parse(JSON.stringify(response.data[0]))
            this.dataTable = dataTable
            if (Object.prototype.hasOwnProperty.call(this.dataTable, 'fields')) {
              this.dataTable.fieldsObj = [{ 'key': 'authors', 'label': this.$t('table_headers.author_year') }]
              if (this.checkPermissions) {
                this.dataTable.fieldsObj = [{'key': 'actions', 'label': '', stickyColumn: true}, { 'key': 'authors', 'label': this.$t('table_headers.author_year') }]
              }

              const fields = JSON.parse(JSON.stringify(this.dataTable.fields))
              const items = JSON.parse(JSON.stringify(this.dataTable.items))

              const _items = items.sort((a, b) => a.authors.localeCompare(b.authors))
              this.dataTable.items = _items

              this.dataTableFieldsModal.fields = []
              for (let f of fields) {
                if (f.key !== 'ref_id' && f.key !== 'authors' && f.key !== 'actions') {
                  this.dataTableFieldsModal.fields.push(f.label)
                  this.dataTable.fieldsObj.push({ key: f.key, label: f.label })
                }
              }

              this.dataTableFieldsModal.nroColumns = (this.dataTable.fieldsObj.length === 2) ? 1 : this.dataTable.fieldsObj.length - 2

              for (let item of _items) {
                this.dataTableFieldsModal.items.push(item)
              }
            }
          } else {
            this.dataTable = {
              fields: [],
              items: [],
              authors: '',
              fieldsObj: [
                {
                  key: 'authors',
                  label: this.$t('table_headers.author_year')
                }
              ]
            }
          }
          this.$emit('updateDataTable', this.dataTable, this.type)
          this.dataTableSettings.isBusy = false
          // this.$emit('fill-dataTable', this.dataTable, this.dataTableFieldsModal)
        })
    },
    openModalDataTable: function () {
      let fields = JSON.parse(JSON.stringify(this.dataTable.fields))
      let editFields = []
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of fields) {
        if (!excluded.includes(field.key)) {
          editFields.push(field.label)
        }
      }
      this.dataTableFieldsModal.fields = editFields
      this.$refs['open-dataTable-modal'].show()
    },
    openModalDataTableEdit: function () {
      let _fields = JSON.parse(JSON.stringify(this.dataTable.fields))
      let fields = []
      const excluded = ['ref_id', 'authors', 'actions']
      for (let field of _fields) {
        if (!excluded.includes(field.key)) {
          fields.push(field)
        }
      }

      this.dataTableFieldsModalEdit.fields = fields
      this.dataTableFieldsModalEdit.nroColumns = fields.length
      this.$refs['open-dataTable-modal-edit'].show()
    },
    saveDataTableFields: function () {
      this.dataTableSettings.isBusy = true
      let fields = JSON.parse(JSON.stringify(this.dataTableFieldsModal.fields))
      let references = JSON.parse(JSON.stringify(this.references))
      let params = {
        fields: [
          {'key': 'ref_id', 'label': this.$t('table_headers.reference_id')},
          {'key': 'authors', 'label': this.$t('table_headers.author_year')}
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

      if (Object.prototype.hasOwnProperty.call(this.dataTable, 'id')) {
        Api.patch(`/${this.type}/${this.dataTable.id}`, params)
          .then(() => {
            this.$emit('get-project')
            this.dataTableSettings.isBusy = false
          }).catch((error) => {
            this.$emit('print-errors', error)
          })
      } else {
        Api.post(`/${this.type}`, params)
          .then(() => {
            this.getData()
          })
          .catch((error) => {
            this.$emit('print-errors', error)
          })
      }
    },
    updateDataTableFields: function () {
      this.dataTableSettings.isBusy = true
      let params = {
        is_public: false
      }
      let fields = JSON.parse(JSON.stringify(this.dataTableFieldsModalEdit.fields))

      fields.splice(0, 0, { 'key': 'ref_id', 'label': this.$t('table_headers.reference_id') })
      fields.splice(1, 0, { 'key': 'authors', 'label': this.$t('table_headers.author_year') })

      params.fields = fields

      let _items = JSON.parse(JSON.stringify(this.dataTable.items))

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

      Api.patch(`/${this.type}/${this.dataTable.id}`, params)
        .then(() => {
          this.getData()
          this.dataTableSettings.isBusy = false
        })
        .catch((error) => {
          this.$emit('print-errors', error)
        })
    },
    dataTableNewColumn: function () {
      let _fields = JSON.parse(JSON.stringify(this.dataTableFieldsModalEdit.fields))
      let fields = []
      let column = '0'
      const excluded = ['ref_id', 'authors', 'actions']
      if (_fields.length) {
        for (const field of _fields) {
          if (!excluded.includes(field.key)) {
            fields.push(field)
          }
        }
        // sort fields by key
        fields.sort((a, b) => {
          if (a.key.match(/\d+/g) && b.key.match(/\d+/g)) {
            return parseInt(a.key.match(/\d+/g)[0]) - parseInt(b.key.match(/\d+/g)[0])
          }
          return 0
        })
        this.dataTableFieldsModalEdit.nroColumns = fields.length + 1
        column = parseInt(fields[ fields.length - 1 ].key.split('_')[1]) + 1
      }

      this.dataTableFieldsModalEdit.fields.push(
        {
          'key': `column_${column.toString()}`,
          'label': ''
        }
      )
    },
    getReferenceInfo: function (refId) {
      for (let ref of this.refs) {
        if (ref.id === refId) {
          return ref.content
        }
      }
    },
    addContentDataTable: function (index = 0) {
      const items = JSON.parse(JSON.stringify(this.dataTable.items))

      this.dataTableFieldsModal.items = items
      this.dataTableFieldsModal.selected_item_index = index
      this.$refs['edit-content-dataTable'].show()
    },
    saveContentDataTable: function () {
      const id = this.dataTable.id
      const params = {
        items: this.dataTableFieldsModal.items
      }

      Api.patch(`/${this.type}/${id}`, params)
        .then(() => {
          this.$emit('set-item-data', `${this.prefix}-${this.dataTableFieldsModal.items[this.dataTableFieldsModal.selected_item_index].ref_id}`)
          this.$emit('get-project')
          this.getData()
          this.$refs['edit-content-dataTable'].hide()
        })
        .catch((error) => {
          this.$emit('print-errors', error)
        })
    },
    openModalRemoveContentDataTable: function (id) {
      if (!id) return

      const lists = JSON.parse(JSON.stringify(this.lists))
      this.removeReferenceDataTable = {
        id: id,
        findings: []
      }

      for (const list of lists) {
        for (const ref of list.references) {
          if (id === ref) {
            this.removeReferenceDataTable.findings.push(list.isoqf_id)
          }
        }
      }
      this.$refs['removeContentModalDataTable'].show()
    },
    cleanRemoveContentCharsOfStudies: function () {
      this.removeReferenceDataTable = {
        id: null,
        findings: []
      }
    },
    removeDataFromLists: function () {
      const removedId = this.removeReferenceDataTable.id
      const _items = JSON.parse(JSON.stringify(this.dataTable.items))
      let items = []
      let _keys = JSON.parse(JSON.stringify(this.dataTable.fields))
      let keys = []
      for (const k of _keys) {
        keys.push(k.key)
      }

      for (let item of _items) {
        if (item.ref_id === removedId) {
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
      }

      const params = {
        items: items
      }

      Api.patch(`/${this.type}/${this.dataTable.id}`, params)
        .then(() => {
          this.getData()
        })
        .catch((error) => {
          this.$emit('print-errors', error)
        })
    },
    generateTemplate: function () {
      const _refs = JSON.parse(JSON.stringify(this.refs))
      let obj = {
        fields: [this.$t('table_headers.reference_id'), this.$t('table_headers.author_year')],
        data: []
      }

      for (let ref of _refs) {
        obj.data.push([ref.id, ref.content.split(';')[0]])
      }

      const data = Papa.unparse(obj)

      var csvData = new Blob([data], {type: 'text/csv;charset=utf-8;'})
      var csvURL = window.URL.createObjectURL(csvData)

      let link = document.createElement('a')
      link.setAttribute('href', csvURL)
      link.setAttribute('download', 'my_data.csv')
      document.body.appendChild(link)

      link.click()
    },
    loadTableImportData: function (event) {
      const file = event.target.files[0]
      if (!file) {
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        this.pre_ImportDataTable = e.target.result
      }
      reader.readAsText(file)
    },
    cleanVars: function (isCancel = false) {
      this.importDataTable = {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: this.$t('table_headers.author_year') }
        ]
      }
      this.pre_ImportDataTable = ''
      this.$refs['import-file'].reset()
      if (isCancel) {
        this.$refs[`import-table-${this.type}`].hide()
      }
    },
    openModalImportTable: function () {
      this.$refs[`import-table-${this.type}`].show()
    },
    exportTableToCSV: function (type) {
      let _headers = JSON.parse(JSON.stringify(this.dataTable.fields))
      let _items = JSON.parse(JSON.stringify(this.dataTable.items))
      let headers = []
      let items = []
      let keys = []

      for (const field of _headers) {
        if (!['ref_id', 'id'].includes(field.key)) {
          headers.push(`"${field.label}"`)
          keys.push(field.key)
        }
      }

      for (const i of _items) {
        let item = {}
        for (const k in keys) {
          if (Object.prototype.hasOwnProperty.call(i, keys[k])) {
            item[keys[k]] = i[keys[k]]
          } else {
            item[keys[k]] = ''
          }
        }
        items.push(item)
      }

      const options = {
        filename: 'exportable_table',
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
    saveImportedData: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        fields: this.importDataTable.fields,
        items: this.importDataTable.items
      }
      if (this.importDataTable.fields.length && this.importDataTable.items.length) {
        if (this.dataTable.items.length) {
          this.cleanImportedData(this.dataTable.id, params)
        } else {
          this.insertImportedData(params)
        }
      }
      this.importDataTable = {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: this.$t('table_headers.author_year') }
        ]
      }
      this.pre_ImportDataTable = ''
    },
    cleanImportedData: function (id = '', params = {}) {
      Api.delete(`/${this.type}/${id}`)
        .then(() => {
          this.pre_ImportDataTable = ''
          this.insertImportedData(params)
        })
        .catch((error) => {
          this.$emit('print-errors', error)
        })
    },
    insertImportedData: function (params = {}) {
      if (!Object.prototype.hasOwnProperty.call(params, 'organization') || !Object.prototype.hasOwnProperty.call(params, 'project_id') || !Object.prototype.hasOwnProperty.call(params, 'fields') || !Object.prototype.hasOwnProperty.call(params, 'items')) {
        return
      }
      Api.post(`/${this.type}/`, params)
        .then(() => {
          this.getData()
          this.$refs[`import-table-${this.type}`].hide()
        })
        .catch((error) => {
          this.$emit('print-errors', error)
        })
    },
    updateMyDataTables: function () {
      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }

      Api.get(`/${this.type}`, params)
        .then((response) => {
          if (!response.data.length) {
            this.getData()
            return
          }
          const responseData = JSON.parse(JSON.stringify(response.data[0]))
          const charId = responseData.id

          if (responseData.items.length) {
            const items = this.processItems(responseData.items)
            let params = {
              items: items
            }
            Api.patch(`/${this.type}/${charId}`, params)
              .then(() => {
                this.getData()
              })
          }
        })
    },
    processItems: function (dataItems) {
      let items = JSON.parse(JSON.stringify(dataItems))
      let references = []
      let newItems = []
      for (const item of items) {
        references.push(item.ref_id)
      }
      for (const reference of this.references) {
        if (!references.includes(reference.id)) {
          console.log('this.processItems')
          newItems.push({
            ref_id: reference.id,
            authors: this.parseReference(reference, true, false)
          })
        }
      }
      items.push(...newItems)
      return items
    },
    parseReference: (reference, onlyAuthors = false, hasSemicolon = true) => {
      return Commmons.parseReference(reference, onlyAuthors, hasSemicolon)
    },
    deleteFieldFromCharsSudiesEdit: function (index) {
      let params = {}
      const _fields = JSON.parse(JSON.stringify(this.dataTableFieldsModalEdit.fields))
      const _items = JSON.parse(JSON.stringify(this.dataTable.items))
      const dataTableId = this.dataTable.id

      let removedField = _fields.splice(index, 1)[0]

      _fields.splice(0, 0, { 'key': 'ref_id', 'label': this.$t('table_headers.reference_id') })
      _fields.splice(1, 0, { 'key': 'authors', 'label': this.$t('table_headers.author_year') })

      for (let item of _items) {
        if (Object.prototype.hasOwnProperty.call(item, removedField.key)) {
          delete item[removedField.key]
        }
      }

      params.fields = _fields
      params.items = _items

      Api.patch(`/${this.type}/${dataTableId}`, params)
        .then((response) => {
          let _fields = JSON.parse(JSON.stringify(response.data['$set'].fields))
          const excluded = ['ref_id', 'authors', 'actions']
          let editFields = []
          for (let field of _fields) {
            if (!excluded.includes(field.key)) {
              editFields.push(field)
            }
          }

          this.dataTableFieldsModalEdit.fields = editFields
          this.dataTableFieldsModalEdit.nroColumns = editFields.length
          this.$emit('get-project')
        })
        .catch((error) => {
          this.$emit('print-errors', error)
        })
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
        return this.$t('references.author_not_found')
      }
    }
  }
}

</script>

<styles lang="scss" scoped>
</styles>
