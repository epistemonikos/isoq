<template>
  <div>
    <b-row v-if="canEdit">
      <b-col sm="4">
        <b-button block variant="outline-primary" v-b-tooltip.hover
          :title="isOnline ? '' : $t('offline.action_disabled')"
          :disabled="(references.length > 0 && isOnline) ? false : true"
          v-if="dataTable.fields && dataTable.fields.length <= 2" @click="openModalDataTable()">
          {{ $t('characteristics.create_table') }}
        </b-button>
        <b-button block variant="outline-primary" v-if="dataTable.fields && dataTable.fields.length > 2"
          @click="openModalDataTableEdit">
          {{ $t('characteristics.edit_columns') }}
        </b-button>
      </b-col>
      <b-col sm="1">
        <p class="text-center pt-1">{{ $t('common.or') }}</p>
      </b-col>
      <b-col sm="4">
        <b-button block variant="outline-info" v-b-tooltip.hover :title="isOnline ? '' : $t('offline.action_disabled')"
          :disabled="!references.length || !isOnline" @click="openModalImportTable()">
          {{ $t('characteristics.import_table') }}
        </b-button>
      </b-col>
      <b-col sm="3" v-if="dataTable.fields && dataTable.fields.length > 2">
        <b-button variant="outline-secondary" block @click="exportTableToXLSX()">
          {{ $t('characteristics.export_xls') }}
        </b-button>
      </b-col>
    </b-row>
    <b-row>
      <b-col cols="12">
        <b-table sort-by="authors" :id="`${prefix}-table`" class="table-content-refs mt-3"
          v-if="dataTable.fieldsObj && dataTable.fieldsObj.length > (canEdit ? 2 : 1)" :fields="dataTable.fieldsObj"
          :items="dataTable.items" :current-page="dataTableSettings.currentPage" :per-page="dataTableSettings.perPage"
          :busy="dataTableSettings.isBusy" :responsive="true">
          <template v-slot:cell(authors)="data">
            <a :id="`${prefix}-${data.item.ref_id}`"></a>
            <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{ data.item.authors }}</span>
          </template>
          <template v-slot:cell()="data">
            <div v-if="shouldTruncate(data.value) && !isExpanded(data.item.ref_id, data.field.key)">
              {{ truncate(data.value) }}...
              <p>
                <b-link @click="toggleExpand(data.item.ref_id, data.field.key)" style="font-size: 12px;">
                  {{ $t('common.read_more') }}
                </b-link>
              </p>
            </div>
            <div v-else-if="shouldTruncate(data.value) && isExpanded(data.item.ref_id, data.field.key)">
              {{ data.value }}
              <p>
                <b-link @click="toggleExpand(data.item.ref_id, data.field.key)" style="font-size: 12px;">
                  {{ $t('common.read_less') }}
                </b-link>
              </p>
            </div>
            <div v-else>
              {{ data.value }}
            </div>
          </template>
          <template v-slot:cell(actions)="data" v-if="dataTable.fields && dataTable.fields.length > 2 && canEdit">
            <b-row>
              <b-col>
                <b-button v-if="canEdit" block variant="outline-success"
                  @click="addContentDataTable((dataTableSettings.currentPage > 1) ? (dataTableSettings.perPage * (dataTableSettings.currentPage - 1)) + data.index : data.index)">
                  <font-awesome-icon icon="edit"></font-awesome-icon>
                </b-button>
              </b-col>
              <b-col>
                <b-button v-if="canEdit" block variant="outline-danger"
                  @click="openModalRemoveContentDataTable(data.item.ref_id)">
                  <font-awesome-icon icon="trash"></font-awesome-icon>
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

      <b-col cols="12">
        <b-pagination
          v-if="dataTable.items && dataTable.items.length && dataTable.items.length > dataTableSettings.perPage && dataTable.fieldsObj && dataTable.fieldsObj.length > (canEdit ? 2 : 1)"
          align="center" v-model="dataTableSettings.currentPage" :total-rows="dataTable.items && dataTable.items.length"
          :per-page="dataTableSettings.perPage" :aria-controls="`${prefix}-table`">
        </b-pagination>
      </b-col>

      <b-col cols="12">
        <BackToTop />
      </b-col>

      <b-modal size="xl" id="open-dataTable-modal" ref="open-dataTable-modal" scrollable
        :ok-disabled="isDataTableFieldsModalInvalid" @ok.prevent="saveDataTableFields" :ok-title="$t('common.save')"
        ok-variant="outline-success" cancel-variant="outline-secondary" @hidden="onColumnsCreateModalHidden">
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
        <b-form-group :label="$t('characteristics.num_columns')">
          <b-form-input id="nro-columns" v-model="dataTableFieldsModal.nroColumns" type="number" min="1"></b-form-input>
        </b-form-group>
        <b-form-group v-for="cnt in parseInt(dataTableFieldsModal.nroColumns)" :key="cnt"
          :label="$t('characteristics.column_n', { n: cnt })" :state="fieldState('create', cnt - 1)"
          :invalid-feedback="$t('common.field_required')">
          <b-input-group>
            <b-form-input :id="`column_${cnt}`" v-model="dataTableFieldsModal.fields[cnt - 1]" type="text"
              :state="fieldState('create', cnt - 1)"
              @blur="$set(dataTableFieldsModal.touched, cnt - 1, true)"></b-form-input>
            <b-input-group-append v-if="dataTable.id">
              <b-button variant="outline-danger" @click="confirmDeleteColumnCreate(cnt - 1)">
                <font-awesome-icon icon="trash"></font-awesome-icon>
              </b-button>
            </b-input-group-append>
          </b-input-group>
        </b-form-group>
      </b-modal>

      <b-modal size="xl" id="open-dataTable-modal-edit" ref="open-dataTable-modal-edit" scrollable
        ok-only :ok-title="$t('common.close')" ok-variant="secondary" @hidden="onColumnsEditModalHidden">
        <template v-slot:modal-title>
          <videoHelp :txt="$t('characteristics.edit_columns')" tag="none" urlId="449742512"></videoHelp>
        </template>
        <p class="font-weight-light">
          {{ $t('characteristics.column_help') }}
        </p>
        <!-- Sin botón de guardar: cada cambio se aplica solo, así que hay que decirlo o el
             usuario no sabe cuándo quedó guardado lo que hizo. -->
        <p class="text-muted small">
          <font-awesome-icon icon="info-circle" class="mr-1"></font-awesome-icon>
          {{ $t('characteristics.columns_autosave_hint') }}
          <b-spinner small v-if="dataTableSettings.isBusy" class="ml-1"></b-spinner>
        </p>
        <draggable v-model="dataTableFieldsModalEdit.fields" group="columns" @start="drag = true"
          @end="onColumnsOrderChanged">
          <b-form-group v-for="(field, index) in dataTableFieldsModalEdit.fields" :key="index"
            :label="$t('characteristics.column_n', { n: index })" :state="fieldState('edit', index)"
            :invalid-feedback="$t('common.field_required')">
            <b-input-group>
              <b-form-input :id="`column_${index}`" v-model="field.label" type="text" :state="fieldState('edit', index)"
                @blur="onEditFieldBlur(index)"></b-form-input>
              <b-input-group-append>
                <b-button v-if="dataTableFieldsModalEdit.fields.length > 1" :id="`drag-button-chars-${index}`"
                  variant="outline-secondary" v-b-tooltip :title="$t('characteristics.drag_sort')">
                  <font-awesome-icon icon="arrows-alt"></font-awesome-icon>
                </b-button>
                <b-button variant="outline-danger" @click="confirmDeleteColumnEdit(index)">
                  <font-awesome-icon icon="trash"></font-awesome-icon>
                </b-button>
              </b-input-group-append>
            </b-input-group>
          </b-form-group>
        </draggable>
        <b-button class="mb-2" @click="dataTableNewColumn" variant="outline-success">
          {{ $t('characteristics.add_new_column') }}
        </b-button>
      </b-modal>

      <b-modal size="xl" ref="edit-content-dataTable" :title="$t('characteristics.edit_data')" scrollable
        @ok="saveContentDataTable" @hidden="onEditModalHidden" :ok-title="$t('common.save')" ok-variant="outline-success"
        cancel-variant="outline-secondary" :ok-disabled="isRowReadOnly">
        <b-alert v-if="isRowReadOnly" show variant="warning" class="mb-2">
          {{ rowLockedBy ? $t('lock.ref_locked_by', { user: rowLockedBy }) : $t('lock.permissions_revoked') }}
        </b-alert>
        <div v-if="autoSaveStatus" class="mb-2 small">
          <span v-if="autoSaveStatus === 'saving'" class="text-muted">
            <b-spinner small></b-spinner> {{ $t('common.auto_saving') }}
          </span>
          <span v-else-if="autoSaveStatus === 'saved'" class="text-success">
            <font-awesome-icon icon="check"></font-awesome-icon> {{ $t('common.auto_saved') }}
          </span>
        </div>
        <template v-if="dataTableFieldsModal.items.length">
          <template v-for="field of dataTable.fields">
            <b-form-group v-if="field.key !== 'ref_id'" :key="field.id" :label="field.label"
              label-class="font-weight-bold">
              <template v-if="['ref_id', 'authors'].includes(field.key)">
                <p>{{ dataTableFieldsModal.items[dataTableFieldsModal.selected_item_index][field.key] }}</p>
              </template>
              <template v-else>
                <b-form-textarea v-if="!['ref_id', 'authors'].includes(field.key)"
                  v-model="dataTableFieldsModal.items[dataTableFieldsModal.selected_item_index][field.key]"
                  :placeholder="(type === 'isoqf_assessments') ? $t('meth_assessments.enter_assessment') : ''" rows="2"
                  max-rows="100" :disabled="isRowReadOnly" @input="onFieldInput"></b-form-textarea>
              </template>
            </b-form-group>
          </template>
        </template>
      </b-modal>

      <b-modal size="xl" id="removeContentModalDataTable" ref="removeContentModalDataTable"
        :title="$t('characteristics.remove_content')" :ok-title="$t('common.confirm')" ok-variant="outline-danger"
        cancel-variant="outline-success" @cancel="cleanRemoveContentCharsOfStudies" @ok="removeDataFromLists">
        <p>{{ $t('characteristics.confirm_delete_row') }}</p>
        <p v-if="removeReferenceDataTable.findings.length === 0">
          <b>{{ $t('characteristics.no_findings_affected') }}</b>
        </p>
        <p v-if="removeReferenceDataTable.findings.length">
          <b>{{ $t('characteristics.findings_affected') }}</b>
        <ul>
          <li v-for="(finding, index) in removeReferenceDataTable.findings" :key="index">
            {{ $t('characteristics.finding_n', { n: finding }) }}
          </li>
        </ul>
        </p>
      </b-modal>

      <b-modal :no-close-on-backdrop="true" :no-close-on-esc="true" :ok-title="$t('common.save')"
        :cancel-title="$t('common.close')" size="xl" id="`import-table-${this.type}`"
        :ref="`import-table-${this.type}`">
        <template v-slot:modal-title>
          <videoHelp :txt="$t('characteristics.import_table')" tag="none" urlId="450046545"></videoHelp>
        </template>
        <b-alert show variant="danger">
          <b>{{ $t('import_modal.beware') }}</b> {{ $t('import_modal.overwrite_warning') }}
        </b-alert>
        <p class="font-weight-light">
          {{ $t('import_modal.steps_title') }}
        </p>
        <h4>{{ $t('import_modal.step1') }}</h4>
        <p class="text-danger">
          <b>{{ $t('import_modal.columns_warning') }}</b>
        </p>
        <b-button variant="info" @click="generateTemplate">
          {{ $t('import_modal.download_template') }}
        </b-button>
        <h4 class="mt-5">{{ $t('import_modal.step2') }}</h4>
        <b-form-file ref="import-file" id="input-template-chars-file" plain
          accept=".xlsx,.csv"
          @change="loadTableImportData($event)"></b-form-file>
        <h4 class="mt-5">{{ $t('import_modal.step3') }}</h4>
        <p>{{ $t('import_modal.accept_info') }}</p>
        <p>{{ $t('import_modal.reject_info') }} <a href="#" v-b-modal='`videoHelp-450046545`'>{{
          $t('import_modal.see_help')
            }}</a></p>
        <b-alert variant="info" :show="importDataTable.error !== null">
          {{ importDataTable.error }}
        </b-alert>
        <b-table v-if="importDataTable.items.length" sticky-header responsive :fields="importDataTable.fieldsObj"
          :items="importDataTable.items"></b-table>
        <template v-slot:modal-footer>
          <b-button variant="outline-secondary" @click="cleanVars(true)">{{ $t('common.close') }}</b-button>
          <b-button variant="outline-info" :disabled="!importDataTable.items.length" @click="cleanVars()">{{
            $t('common.reject') }}</b-button>
          <b-button variant="outline-success" :disabled="!importDataTable.items.length" @click="saveImportedData()">{{
            $t('common.save') }}</b-button>
        </template>
      </b-modal>

    </b-row>
  </div>
</template>

<script>
/* eslint-disable no-unused-vars */
import Api from '@/utils/Api'
import Commmons from '@/utils/commons.js'
import LockService from '@/services/lockService'
import columnService from '@/services/columnService'
import { parseCSVData } from '@/utils/csvImporter'
import _debounce from 'lodash.debounce'

import { exportTableToXLSX, exportAOAToXLSX } from '@/utils/xlsxExporter'
import { parseXLSXData } from '@/utils/xlsxImporter'
import { sortByAuthors, filterDisplayFields, loadFileAsText } from '@/utils/tableDataUtils'

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
    canEdit: {
      type: Boolean,
      default: false
    },
    project: {
      type: Object,
      default: () => { }
    },
    ui: {
      type: Object,
      default: () => { }
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
    this.updateMyDataTables()
    this.autoSaveDebounced = _debounce(function () { this.performAutoSave() }.bind(this), 1500)
    window.addEventListener('ref-lock-lost', this.onRefLockLost)
  },
  beforeDestroy () {
    window.removeEventListener('ref-lock-lost', this.onRefLockLost)
    // SPA navigation destroys this view with the editor still open: without this the
    // row stays locked for everybody else until the server TTL expires it.
    this.releaseRowLock()
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
      // Ref-lock state of the row open in the content modal. Endpoint B demands
      // the caller holds the lock, so a row we could not lock must stay read-only.
      isRowReadOnly: false,
      rowLockedBy: null,
      // The lock we actually hold, tracked apart from editingRefId: the modal's
      // events cannot be trusted to tell us when it is safe to let it go.
      lockedRowRef: null,
      rowEditorOpen: false,
      // True when a `hidden` from a previous editor session is still on its way.
      staleHiddenPending: false,
      dataTableFieldsModal: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0,
        editingRefId: null,
        touched: []
      },
      // Lock del documento de la tabla mientras se editan columnas, y orden acumulado
      // hasta el cierre. `committedColumnLabels` evita reenviar un título que no cambió
      // cuando el usuario sólo pasa por el campo.
      columnsLockHeld: false,
      // Ref exacto que se bloqueó. No se recalcula al liberar: `getData()` reasigna
      // `dataTable`, así que al cerrar el id puede no estar y el lock quedaría colgado
      // hasta expirar.
      columnsLockRef: null,
      // Id del documento resuelto al abrir el modal de creación. Se guarda aparte porque
      // `getData()` reasigna `dataTable`, y un reintento del guardado necesita el id para
      // renombrar lo ya creado en vez de duplicarlo.
      resolvedTableId: null,
      pendingColumnsOrder: false,
      committedColumnLabels: {},
      dataTableFieldsModalEdit: {
        nroColumns: 1,
        fields: [],
        items: [],
        selected_item_index: 0,
        touched: []
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
      importDataTable: {
        error: null,
        fields: [],
        items: [],
        fieldsObj: [
          { key: 'authors', label: 'Author(s), Year' }
        ]
      },
      expandedCells: {},
      autoSaveStatus: null
    }
  },
  watch: {
    references () {
      this.updateMyDataTables()
    }
  },
  computed: {
    isDataTableFieldsModalInvalid () {
      const nro = parseInt(this.dataTableFieldsModal.nroColumns)
      if (!nro || nro === 0) return true
      for (let i = 0; i < nro; i++) {
        const field = this.dataTableFieldsModal.fields[i]
        const label = typeof field === 'object' ? field.label : field
        if (!label || (typeof label === 'string' && label.trim().length === 0)) return true
      }
      return false
    },
    isDataTableFieldsModalEditInvalid () {
      if (!this.dataTableFieldsModalEdit.fields || !this.dataTableFieldsModalEdit.fields.length) return false
      return this.dataTableFieldsModalEdit.fields.some(field => !field.label || (typeof field.label === 'string' && field.label.trim().length === 0))
    }
  },
  methods: {
    shouldTruncate (text) {
      return Commmons.shouldTruncate(text)
    },
    truncate (text) {
      return Commmons.truncate(text)
    },
    toggleExpand (refId, fieldKey) {
      const key = `${refId}-${fieldKey}`
      this.$set(this.expandedCells, key, !this.expandedCells[key])
    },
    isExpanded (refId, fieldKey) {
      return !!this.expandedCells[`${refId}-${fieldKey}`]
    },
    getData: function (prefetchedData = null) {
      this.dataTableSettings.isBusy = true

      if (prefetchedData) {
        this.handleResponseData(prefetchedData)
      } else {
        const params = {
          organization: this.$route.params.org_id,
          project_id: this.$route.params.id
        }
        Api.get(`/${this.type}`, params)
          .then((response) => {
            this.handleResponseData(response.data)
          })
          .catch((error) => {
            this.dataTableSettings.isBusy = false
            this.$emit('print-errors', error)
          })
      }
    },
    handleResponseData: function (data) {
      if (data.length) {
        const dataTable = Commmons.deepClone(data[0])
        this.dataTable = dataTable
        if (Object.prototype.hasOwnProperty.call(this.dataTable, 'fields')) {
          this.dataTable.fieldsObj = [{ 'key': 'authors', 'label': this.$t('table_headers.author_year') }]
          if (this.canEdit) {
            this.dataTable.fieldsObj.push({ 'key': 'actions', 'label': '', stickyColumn: true })
          }

          const fields = Commmons.deepClone(this.dataTable.fields)
          const items = Commmons.deepClone(this.dataTable.items)

          const _items = sortByAuthors(items.filter(item => item.ref_id && item.authors))
          this.dataTable.items = _items

          this.dataTableFieldsModal.fields = []
          for (const f of filterDisplayFields(fields)) {
            this.dataTableFieldsModal.fields.push(f.label)
            this.dataTable.fieldsObj.push({ key: f.key, label: f.label })
          }

          this.dataTableFieldsModal.nroColumns = (this.dataTable.fieldsObj.length === 2) ? 1 : this.dataTable.fieldsObj.length - 2

          this.dataTableFieldsModal.items = []
          for (const item of _items) {
            this.dataTableFieldsModal.items.push(item)
          }

          if (this.dataTableFieldsModal.editingRefId) {
            const newIdx = _items.findIndex(it => String(it.ref_id) === String(this.dataTableFieldsModal.editingRefId))
            if (newIdx !== -1) this.dataTableFieldsModal.selected_item_index = newIdx
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
    },
    fieldState: function (domain, index) {
      const d = (domain === 'edit') ? this.dataTableFieldsModalEdit : this.dataTableFieldsModal
      if (!d.touched[index]) return null
      const val = (domain === 'edit') ? (d.fields[index] ? d.fields[index].label : '') : d.fields[index]
      return (typeof val === 'string') && (val.trim().length > 0)
    },
    /**
     * A este modal se entra a CREAR, no a mirar, así que toma el lock al abrirse: si otra
     * persona está creando las columnas, acá no se entra. (El modal de edición es al revés
     * — ahí el lock espera al primer cambio para no bloquear a quien sólo mira.)
     *
     * Y como el lock necesita algo que bloquear, primero se resuelve el documento de la
     * tabla, creándolo si no existe. Así el segundo que abra encuentra la tabla y queda
     * bloqueado, en vez de que los dos creen documentos en paralelo.
     */
    openModalDataTable: async function () {
      let fields = Commmons.deepClone(this.dataTable.fields || [])
      let editFields = []
      const excluded = ['ref_id', 'authors', 'actions']
      for (const field of fields) {
        if (!excluded.includes(field.key)) {
          editFields.push(field.label)
        }
      }

      const docId = await this.resolveTableDocument()
      if (!docId) return
      if (!(await this.ensureColumnsLock())) return

      this.dataTableFieldsModal.fields = editFields
      this.dataTableFieldsModal.touched = new Array(editFields.length).fill(false)
      // Claves de las columnas ya creadas, por índice: hace que un segundo guardado renombre
      // en vez de duplicar si el primero falló a mitad de camino.
      this.dataTableFieldsModal.keys = new Array(editFields.length).fill(null)
      this.$refs['open-dataTable-modal'].show()
    },
    /**
     * Id del documento de la tabla, creándolo si hace falta. En no-CAMELOT las filas viven
     * en la base, así que nace con una fila por referencia o no hay dónde escribir.
     */
    resolveTableDocument: async function () {
      if (this.dataTable.id) return this.dataTable.id
      if (this.resolvedTableId) return this.resolvedTableId

      try {
        const items = this.references.map(ref => ({
          ref_id: ref.id,
          authors: this.getAuthorsFormat(ref.authors, ref.publication_year)
        }))
        const id = await columnService.ensureTableDocument(
          this.type, this.$route.params.org_id, this.$route.params.id, { items }
        )
        if (id) {
          this.$set(this.dataTable, 'id', id)
          this.resolvedTableId = id
        }
        return id
      } catch (error) {
        this.$emit('print-errors', error)
        return null
      }
    },
    onColumnsCreateModalHidden: async function () {
      if (this.columnsLockHeld) {
        await LockService.releaseRef(this.columnsLockRef)
        this.columnsLockHeld = false
        this.columnsLockRef = null
      }
      this.getData()
    },
    openModalDataTableEdit: function () {
      let _fields = Commmons.deepClone(this.dataTable.fields)
      let fields = []
      const excluded = ['ref_id', 'authors', 'actions']
      for (const field of _fields) {
        if (!excluded.includes(field.key)) {
          fields.push(field)
        }
      }

      this.dataTableFieldsModalEdit.fields = fields
      this.dataTableFieldsModalEdit.nroColumns = fields.length
      this.dataTableFieldsModalEdit.touched = new Array(fields.length).fill(false)

      // Títulos con los que se abrió, para no reenviar uno que el usuario no cambió: salir
      // de un campo sin escribir es lo más común.
      this.committedColumnLabels = {}
      for (const field of fields) {
        if (field.key) this.committedColumnLabels[field.key] = field.label
      }
      this.$refs['open-dataTable-modal-edit'].show()
    },
    /**
     * Guarda los títulos escritos en el modal de creación, uno por endpoint.
     *
     * Es reintentable: los índices que ya tienen clave se renombran en vez de crearse otra
     * vez, así que si el guardado falla a mitad de camino, volver a apretar Guardar no
     * duplica lo que ya existe. El documento y el lock ya están resueltos desde que se abrió
     * el modal.
     */
    saveDataTableFields: async function () {
      const docId = this.dataTable.id || this.resolvedTableId
      if (!this.canEdit || !docId) return
      if (!(await this.ensureColumnsLock())) return

      this.dataTableSettings.isBusy = true
      const keys = this.dataTableFieldsModal.keys || []

      try {
        for (let index = 0; index < this.dataTableFieldsModal.fields.length; index++) {
          const raw = this.dataTableFieldsModal.fields[index]
          const label = (typeof raw === 'object' ? raw.label : raw || '').trim()
          if (!label) continue

          if (keys[index]) {
            await columnService.renameColumn(this.type, docId, keys[index], label)
          } else {
            const { key } = await columnService.addColumn(this.type, docId, label)
            this.$set(keys, index, key)
          }
        }
        this.$set(this.dataTableFieldsModal, 'keys', keys)
        this.$emit('get-project')
        this.getData()
        this.$refs['open-dataTable-modal'].hide()
      } catch (error) {
        this.$emit('print-errors', error)
      } finally {
        this.dataTableSettings.isBusy = false
      }
    },
    /**
     * The four column endpoints require the table document's lock when concurrency is on.
     * Taken on the first real change rather than on open: whoever came to look at the
     * columns should not block anybody. (The CREATE modal is the other way round — you go
     * in there to create, so it locks on open.)
     */
    ensureColumnsLock: async function () {
      if (this.columnsLockHeld) return true

      const docId = this.dataTable.id || this.resolvedTableId
      if (!docId) return false

      const lockRef = `${docId}::fields`
      const result = await LockService.acquireRef(this.$route.params.id, lockRef)
      if (!result || !result.success) {
        this.notifyColumnsError(
          result && result.lockedBy
            ? this.$t('characteristics.columns_locked_by', { name: result.lockedBy })
            : this.$t('notifications.error')
        )
        return false
      }

      this.columnsLockHeld = true
      this.columnsLockRef = lockRef
      return true
    },
    /**
     * A column is saved when its input loses focus: that is when the title is written.
     * Doing it as the row appears would bring a column into existence untitled.
     */
    onEditFieldBlur: async function (index) {
      this.$set(this.dataTableFieldsModalEdit.touched, index, true)

      const field = this.dataTableFieldsModalEdit.fields[index]
      if (!field || !this.canEdit) return

      const label = (field.label || '').trim()
      if (!label || label === this.committedColumnLabels[field.key || `idx_${index}`]) return
      if (!(await this.ensureColumnsLock())) return

      this.dataTableSettings.isBusy = true
      try {
        if (field.key) {
          await columnService.renameColumn(this.type, this.dataTable.id, field.key, label)
          this.committedColumnLabels[field.key] = label
        } else {
          const { key } = await columnService.addColumn(this.type, this.dataTable.id, label)
          // The key has to land in local state: without it the reorder cannot name the
          // column and a second blur would create it all over again.
          this.$set(field, 'key', key)
          this.committedColumnLabels[key] = label
        }
        this.getData()
      } catch (error) {
        this.$emit('print-errors', error)
      } finally {
        this.dataTableSettings.isBusy = false
      }
    },
    /**
     * The DELETE clears that column's content in every stored row, and there is no save
     * button in between any more: the click is destructive on the spot.
     */
    confirmDeleteColumnEdit: async function (index) {
      const field = this.dataTableFieldsModalEdit.fields[index]
      if (!field || !this.canEdit) return

      // A column that never reached the server has nothing to delete there.
      if (!field.key) {
        this.dataTableFieldsModalEdit.fields.splice(index, 1)
        this.dataTableFieldsModalEdit.touched.splice(index, 1)
        return
      }

      const confirmed = await this.$bvModal.msgBoxConfirm(
        this.$t('characteristics.confirm_delete_column', { name: field.label }),
        {
          title: this.$t('characteristics.confirm_delete_column_title'),
          okVariant: 'danger',
          okTitle: this.$t('common.delete'),
          cancelTitle: this.$t('common.cancel'),
          centered: true
        }
      )
      if (!confirmed) return
      if (!(await this.ensureColumnsLock())) return

      this.dataTableSettings.isBusy = true
      try {
        await columnService.deleteColumn(this.type, this.dataTable.id, field.key)
        this.dataTableFieldsModalEdit.fields.splice(index, 1)
        this.dataTableFieldsModalEdit.touched.splice(index, 1)
        this.getData()
      } catch (error) {
        this.$emit('print-errors', error)
      } finally {
        this.dataTableSettings.isBusy = false
      }
    },
    onColumnsOrderChanged: function () {
      this.drag = false
      // Only flagged: the reorder is the one commutative operation of the set now that
      // `order` accepts a subset, so sending it once on close matches sending it on every
      // drag and costs one request instead of one per drag.
      this.pendingColumnsOrder = true
    },
    onColumnsEditModalHidden: async function () {
      if (this.pendingColumnsOrder && this.dataTable.id) {
        this.pendingColumnsOrder = false
        const order = this.dataTableFieldsModalEdit.fields
          .filter(field => field.key)
          .map(field => field.key)

        if (order.length && await this.ensureColumnsLock()) {
          try {
            await columnService.reorderColumns(this.type, this.dataTable.id, order)
            this.getData()
          } catch (error) {
            this.$emit('print-errors', error)
          }
        }
      }
      this.pendingColumnsOrder = false

      if (this.columnsLockHeld) {
        await LockService.releaseRef(this.columnsLockRef)
        this.columnsLockHeld = false
        this.columnsLockRef = null
      }
      this.committedColumnLabels = {}
    },
    notifyColumnsError: function (message) {
      this.$bvToast.toast(message, {
        title: this.$t('notifications.error'),
        variant: 'danger',
        solid: true
      })
    },
    getCleanedItems: function (items, fields) {
      if (!items) return []
      if (!fields || !fields.length) return items
      const allowedKeys = fields.map(f => f.key)

      return items
        .filter(item => item.ref_id && item.authors)
        .map(item => {
          const cleanedItem = {}
          for (const key of allowedKeys) {
            cleanedItem[key] = Object.prototype.hasOwnProperty.call(item, key) ? item[key] : ''
          }
          return cleanedItem
        })
    },
    /**
     * Una columna nueva entra sin clave: la genera el alta cuando el usuario escribe el
     * título. Derivarla de la posición (`column_${N+1}`) era lo que hacía colisionar a dos
     * personas agregando a la vez, porque las dos leían el mismo máximo.
     */
    dataTableNewColumn: function () {
      this.dataTableFieldsModalEdit.fields.push({ label: '' })
      this.dataTableFieldsModalEdit.nroColumns = this.dataTableFieldsModalEdit.fields.length
      this.dataTableFieldsModalEdit.touched.push(false)
    },
    getReferenceInfo: function (refId) {
      for (const ref of this.refs) {
        if (ref.id === refId) {
          return ref.content
        }
      }
    },
    // The lock can vanish mid-edit: a failed heartbeat, or an offline grant that lost
    // the race when the network came back. Keeping the row editable would only lead
    // to a 409 on save.
    onRefLockLost: function (event) {
      const detail = event.detail || {}
      if (detail.refId !== this.dataTableFieldsModal.editingRefId) return
      this.isRowReadOnly = true
      this.rowLockedBy = detail.lockedBy || null
    },
    onEditModalHidden: function () {
      // BootstrapVue emits `hidden` asynchronously (~300ms of animation). If the editor
      // was reopened in the meantime, this event belongs to the previous session and
      // releasing now would leave the open editor without a lock — every save would 409.
      if (this.staleHiddenPending) {
        this.staleHiddenPending = false
        return
      }
      this.rowEditorOpen = false
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.autoSaveStatus = null
      // Release only this row: the tab may legitimately hold other ref locks
      // (a finding's evidence profile, another table's row).
      this.releaseRowLock()
      this.dataTableFieldsModal.editingRefId = null
      this.isRowReadOnly = false
      this.rowLockedBy = null
    },
    addContentDataTable: function (index = 0) {
      const items = Commmons.deepClone(this.dataTable.items)

      let fields = Commmons.deepClone(this.dataTable.fields)
      this.dataTableFieldsModal.fields = fields
      this.dataTableFieldsModal.items = items
      this.dataTableFieldsModal.selected_item_index = index
      const nextRef = items[index] ? items[index].ref_id : null

      // A lock the modal never released (its `hidden` never arrived, or it never
      // finished opening) would stay held while we move to another row.
      if (this.lockedRowRef && this.lockedRowRef !== nextRef) this.releaseRowLock()
      // Opening while another session is still closing means its `hidden` is still
      // in flight and must not be mistaken for the closing of this one.
      this.staleHiddenPending = this.rowEditorOpen
      this.rowEditorOpen = true

      this.dataTableFieldsModal.editingRefId = nextRef
      this.acquireRowLock(nextRef)
      this.$refs['edit-content-dataTable'].show()
    },
    releaseRowLock: function () {
      if (this.lockedRowRef) LockService.releaseRef(this.lockedRowRef)
      this.lockedRowRef = null
    },
    // Mirrors StepFour.vue's acquireStudyLock: the lock is asked for when the
    // editor opens, so the rejection reaches the user before they type, not on save.
    async acquireRowLock (refId) {
      if (!refId) return
      if (!this.canEdit) {
        this.isRowReadOnly = true
        this.rowLockedBy = null
        return
      }
      const result = await LockService.acquireRef(this.$route.params.id, refId)
      if (result.success) {
        this.lockedRowRef = refId
        this.isRowReadOnly = false
        this.rowLockedBy = null
      } else if (result.permissionDenied) {
        // Nobody else holds it — this user's own can_write was revoked. There is
        // no "locked by X" to report.
        this.isRowReadOnly = true
        this.rowLockedBy = null
        if (this.$notify) this.$notify.warning(this.$t('lock.permissions_revoked'))
      } else {
        this.isRowReadOnly = true
        this.rowLockedBy = result.lockedBy || null
        if (this.$notify) {
          this.$notify.warning(this.$t('lock.ref_locked_by', { user: this.rowLockedBy }))
        }
      }
    },
    onFieldInput: function () {
      this.autoSaveDebounced()
    },
    _patchContentItem: function (id, editedItem) {
      // Granular save of a single content row: persists ONLY this row via the
      // per-item sub-resource, instead of rewriting the whole `items` array.
      // Pattern reference: EditReferenceModal.vue:466
      //   Api.patch(`/isoqf_characteristics/${id}/item/${ref_id}`, item)
      // Here `this.type` is the collection (isoqf_characteristics | isoqf_assessments)
      // and `editedItem` is the full edited row (it already carries ref_id + columns).
      // Because the backend replaces only the matched row, concurrent edits to other
      // rows are no longer overwritten (no more client-side refetch + merge needed).
      return Api.patch(`/${this.type}/${id}/item/${editedItem.ref_id}`, editedItem)
    },
    performAutoSave: function () {
      const id = this.dataTable.id
      if (!id || this.isRowReadOnly) return
      const editedItem = this.dataTableFieldsModal.items[this.dataTableFieldsModal.selected_item_index]
      if (!editedItem) return
      this.autoSaveStatus = 'saving'
      return this._patchContentItem(id, editedItem)
        .then(() => {
          this.autoSaveStatus = 'saved'
          setTimeout(() => { this.autoSaveStatus = null }, 2000)
        })
        .catch(() => { this.autoSaveStatus = 'error' })
    },
    saveContentDataTable: function () {
      const id = this.dataTable.id
      const editedItem = this.dataTableFieldsModal.items[this.dataTableFieldsModal.selected_item_index]
      // Writing without the row's lock is a guaranteed 409 (endpoint B).
      if (!id || this.isRowReadOnly) return Promise.resolve()

      return this._patchContentItem(id, editedItem)
        .then(() => {
          this.$emit('set-item-data', `${this.prefix}-${editedItem.ref_id}`)
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

      const lists = Commmons.deepClone(this.lists)
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
      const _items = Commmons.deepClone(this.dataTable.items)
      let items = []
      let _keys = Commmons.deepClone(this.dataTable.fields)
      let keys = []
      for (const k of _keys) {
        keys.push(k.key)
      }

      for (const item of _items) {
        if (item.ref_id === removedId) {
          let obj = {}
          for (const k in keys) {
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
    generateTemplate: async function () {
      const _refs = Commmons.deepClone(this.refs)

      const rows = [
        [
          this.$t('table_headers.reference_id'),
          this.$t('table_headers.author_year')
        ],
        ..._refs.map(ref => [
          String(ref.id),
          ref.content.split(';')[0]
        ])
      ]

      await exportAOAToXLSX(rows, 'my_data')
    },
    loadTableImportData: async function (event) {
      const file = event.target.files[0]
      if (!file) return

      let parsed
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        parsed = await parseXLSXData(file, this.$t('import_modal.format_error'))
      } else {
        const text = await loadFileAsText(event)
        if (!text) return
        parsed = parseCSVData(text, this.$t('import_modal.format_error'))
      }

      this.importDataTable.error = parsed.error
      if (parsed.fieldsObj.length > 0) {
        this.importDataTable.fieldsObj = [
          { key: 'authors', label: this.$t('table_headers.author_year') },
          ...parsed.fieldsObj
        ]
      }
      this.importDataTable.fields = parsed.fields
      this.importDataTable.items = parsed.items
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
      this.$refs['import-file'].reset()
      if (isCancel) {
        this.$refs[`import-table-${this.type}`].hide()
      }
    },
    openModalImportTable: function () {
      this.$refs[`import-table-${this.type}`].show()
    },
    exportTableToXLSX: async function () {
      await exportTableToXLSX({
        fields: this.dataTable.fields,
        items: this.dataTable.items,
        filename: 'exportable_table'
      })
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
    },
    cleanImportedData: function (id = '', params = {}) {
      Api.delete(`/${this.type}/${id}`)
        .then(() => {
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
          const responseData = Commmons.deepClone(response.data[0])
          const charId = responseData.id

          const originalItemsCount = (responseData.items || []).length
          let items = this.processItems(responseData.items || [])
          items = this.getCleanedItems(items, responseData.fields)

          // Only patch if items changed (addition or removal)
          if (items.length !== originalItemsCount || JSON.stringify(items) !== JSON.stringify(responseData.items || [])) {
            // Fix: Do not patch (auto-save) if user does not have write permissions (e.g. project locked)
            if (this.canEdit) {
              const params = {
                items: items
              }
              Api.patch(`/${this.type}/${charId}`, params)
                .then(() => {
                  this.getData()
                })
            } else {
              // If read-only, just update the local data without saving to DB
              const optimizedData = Commmons.deepClone(response.data)
              optimizedData[0].items = items
              this.getData(optimizedData)
            }
          } else {
            this.getData(response.data)
          }
        })
    },
    processItems: function (dataItems) {
      const items = Commmons.deepClone(dataItems)
      const currentRefIds = this.references.map(r => r.id)

      // 1. Keep only items whose reference still exists
      const filteredItems = items.filter(item => currentRefIds.includes(item.ref_id))

      // 2. Add new items for references that don't have one yet
      const existingRefIds = filteredItems.map(item => item.ref_id)
      const newItems = []

      for (const reference of this.references) {
        if (!existingRefIds.includes(reference.id)) {
          newItems.push({
            ref_id: reference.id,
            authors: this.parseReference(reference, true, false)
          })
        }
      }

      return [...filteredItems, ...newItems]
    },
    parseReference: (reference, onlyAuthors = false, hasSemicolon = true) => {
      return Commmons.parseReference(reference, onlyAuthors, hasSemicolon)
    },
    /**
     * Borra una columna desde el modal de creación. Los títulos de ese modal son strings,
     * así que la clave sale del array paralelo `keys` que llena el guardado; sin clave, la
     * columna nunca llegó al servidor y sólo se descarta local.
     */
    confirmDeleteColumnCreate: async function (index) {
      if (!this.canEdit) return

      const keys = this.dataTableFieldsModal.keys || []
      const key = keys[index]
      const raw = this.dataTableFieldsModal.fields[index]
      const label = typeof raw === 'object' ? raw.label : raw

      const quitarLocal = () => {
        this.dataTableFieldsModal.fields.splice(index, 1)
        keys.splice(index, 1)
        this.dataTableFieldsModal.touched.splice(index, 1)
        this.dataTableFieldsModal.nroColumns = this.dataTableFieldsModal.fields.length
      }

      if (!key) {
        quitarLocal()
        return
      }

      const confirmed = await this.$bvModal.msgBoxConfirm(
        this.$t('characteristics.confirm_delete_column', { name: label }),
        {
          title: this.$t('characteristics.confirm_delete_column_title'),
          okVariant: 'danger',
          okTitle: this.$t('common.delete'),
          cancelTitle: this.$t('common.cancel'),
          centered: true
        }
      )
      if (!confirmed) return
      if (!(await this.ensureColumnsLock())) return

      this.dataTableSettings.isBusy = true
      try {
        await columnService.deleteColumn(
          this.type, this.dataTable.id || this.resolvedTableId, key
        )
        quitarLocal()
        this.$emit('get-project')
        this.getData()
      } catch (error) {
        this.$emit('print-errors', error)
      } finally {
        this.dataTableSettings.isBusy = false
      }
    },
    getAuthorsFormat: function (authors = [], pubYear = '') {
      return Commmons.getAuthorsFormat(authors, pubYear)
    }
  }
}

</script>

<styles lang="scss" scoped></styles>
