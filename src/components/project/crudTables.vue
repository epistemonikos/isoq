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
        <!-- El conflicto de versión va primero y aparte del de lock: acá la persona sí
             tiene permiso de escribir, y lo que necesita para decidir es ver el valor que
             quedó guardado al lado del que intentó guardar. -->
        <b-alert v-if="versionConflict" show variant="warning" class="mb-2">
          <p class="mb-2">{{ $t('version_conflict.message') }}</p>
          <div v-for="(value, key) in conflictComparison" :key="key" class="mb-2">
            <strong class="text-muted small text-uppercase">{{ key }}</strong>
            <b-form-textarea :value="value.theirs" readonly rows="2" class="bg-light mb-1"
              :placeholder="$t('version_conflict.theirs')"></b-form-textarea>
            <b-form-textarea :value="value.mine" readonly rows="2" class="bg-light"
              :placeholder="$t('version_conflict.mine')"></b-form-textarea>
          </div>
          <b-button size="sm" variant="outline-primary" @click="reloadAfterVersionConflict">
            {{ $t('version_conflict.reload') }}
          </b-button>
        </b-alert>
        <b-alert v-else-if="isRowReadOnly" show variant="warning" class="mb-2">
          {{ $t(rowLockMessageKey, { user: rowLockedBy }) }}
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
        cancel-variant="outline-success" @cancel="cleanRemoveContentCharsOfStudies"
        @ok="removeDataFromLists" @hidden="onRemoveModalHidden" :ok-disabled="removeReadOnly">
        <b-alert v-if="removeReadOnly" show variant="warning" class="mb-2">
          {{ removeLockedBy ? $t('lock.ref_locked_by', { user: removeLockedBy }) : $t('lock.permissions_revoked') }}
        </b-alert>
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
        <b-alert variant="warning" :show="Boolean(importLockNotice)">
          <font-awesome-icon icon="lock" /> {{ importLockNotice }}
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
import { copyItemMetadata, itemsFingerprint, isItemMetadata, withoutItemMetadata } from '@/utils/itemMetadata'
import { cleanOrphanedCustomFieldKeys } from '@/utils/customFieldsHelper'
import { isLockRejection } from '@/utils/lockErrors'
import { fieldsLockKey } from '@/utils/refLockUrls'
import { lockLostMessageKey, lockDeniedMessageKey } from '@/utils/lockLostMessage'
import projectFreshnessMixin from '@/mixins/projectFreshnessMixin'
import preserveScrollMixin from '@/mixins/preserveScrollMixin'
import refLockStateMixin from '@/mixins/refLockStateMixin'
import { summarizeImportLocks } from '@/utils/importLockWarning'

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
  mixins: [projectFreshnessMixin, preserveScrollMixin, refLockStateMixin],
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
    window.addEventListener('item-version-conflict', this.onVersionConflict)
    this.startFreshnessPolling()
  },
  beforeDestroy () {
    window.removeEventListener('ref-lock-lost', this.onRefLockLost)
    window.removeEventListener('item-version-conflict', this.onVersionConflict)
    // SPA navigation destroys this view with the editor still open: without this the
    // row stays locked for everybody else until the server TTL expires it.
    this.releaseRowLock()
    this.stopFreshnessPolling()
    // Same for the columns lock: leaving the project with the modal open used to leave it
    // held until the TTL, measured in the browser.
    this.releaseColumnsLock()
    // Y el de la confirmación de «quitar los datos», por la misma razón y una más: si el
    // modal se cierra antes de terminar de abrirse —la animación dura ~300 ms—
    // BootstrapVue no emite `hidden`, así que su handler no corre. Medido en el navegador:
    // la fila quedaba bloqueada para todos hasta que el TTL la barriera.
    this.releaseRemoveLock()
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
      // Por qué se perdió el lock, cuando el latido lo dice. Decide si el cartel promete
      // que se destraba solo o no; `null` para un servidor sin ese despliegue.
      rowLockLostReason: null,
      // Y por qué el acquire lo negó, que tiene su propio motivo y su propio texto.
      rowLockDeniedReason: null,
      // El lock de la confirmación de «quitar los datos» va aparte del del editor de fila,
      // aunque los dos pidan lo mismo al mismo servicio. Compartirlos hacía que cerrar la
      // confirmación soltara el lock del editor abierto y lo devolviera a escribible: la
      // persona seguía tecleando mientras cada guardado recibía 409, y el canal de
      // conflicto lo tapaba por ser de lock. Dos features, dos estados.
      removeLockRef: null,
      removeLockedBy: null,
      removeReadOnly: false,
      // El rechazo por versión de la fila que se está editando: `{ item, failedData }`,
      // el valor que quedó guardado y el que se intentó escribir. Nulo mientras no haya
      // conflicto. No se resuelve solo —reintentar pisaría lo ajeno— así que sostiene el
      // cartel hasta que la persona decida.
      versionConflict: null,
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
      // Un flag por modal. Se probó atarlos por `v-model` al `b-modal` para que Vue los
      // bajara solo, y se descartó: compartir uno abría los dos modales superpuestos, y con
      // uno por modal el `b-modal` dejaba de abrirse (el `v-model` y el `show()` del ref se
      // pisan). Lo que sí resuelve el estado pegado es el orden dentro de los handlers de
      // `hidden`, que bajan el flag antes de cualquier `await`.
      // Van aparte de `columnsLockHeld` porque un modal puede estar abierto antes de tomar
      // el lock, y un refresco en esa ventana descartaría igual lo que se escribió.
      columnsCreateModalOpen: false,
      columnsEditModalOpen: false,
      freshnessTimer: null,
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
      // Quién está editando estudios cuando se abre el diálogo de import. `enabled:false`
      // por defecto para que, hasta que el probe conteste, no se afirme nada.
      importLockProbe: { locks: [], reachable: true, enabled: false },
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
    // `refLockStateMixin` lee el listado de acá para descontar lo que sostiene esta misma
    // pestaña. Reusar el mixin en vez de repetir el filtro es deliberado: la regla de qué
    // lock es ajeno ya estuvo en dos copias en este mismo tramo y dieron resultados
    // distintos.
    activeRefLocks () {
      return this.importLockProbe.locks
    },
    importLockSummary () {
      return summarizeImportLocks(this.foreignRefLocks, this.dataTable.id)
    },
    /**
     * El aviso de que el import va a pisar trabajo ajeno. Cadena vacía = no hay nada que
     * avisar, y así lo consumen el `b-alert` del modal y la confirmación del guardado.
     *
     * Dice «de este proyecto» y no «de esta tabla» porque no podemos saber la tabla: la
     * clave del ref lock no codifica la colección (`refLockUrls.js`), así que una fila del
     * Paso 3 y una del Paso 4 para el mismo estudio son la misma clave. Prometer una
     * precisión que no tenemos produce un aviso que grita de más, y ésos se aprenden a
     * ignorar. Las claves `<doc_id>::fields` son la excepción y por eso van aparte.
     *
     * La incertidumbre (`reachable:false`) NO entra acá a propósito: al abrir el modal
     * todavía no pasa nada destructivo, y un «no pudimos comprobar» por cada hipo de red
     * sería ruido. Esa rama aparece sólo en el momento de decidir.
     */
    importLockNotice () {
      if (!this.importLockProbe.enabled) return ''
      const summary = this.importLockSummary
      const parts = []
      if (summary.studyCount) {
        parts.push(this.$t('import_modal.ref_locks_confirm', {
          names: summary.names.join(', '),
          count: summary.studyCount
        }))
      }
      if (summary.columnsLockedBy) {
        parts.push(this.$t('import_modal.ref_locks_columns', { name: summary.columnsLockedBy }))
      }
      return parts.join(' ')
    },
    /**
     * Qué cartel corresponde. La regla vive en `lockLostMessage`, compartida con el resto.
     *
     * Un lock perdido gana sobre uno negado: si las dos cosas pasaron, la última es la que
     * describe el estado actual del editor.
     */
    rowLockMessageKey () {
      if (this.rowLockLostReason) return lockLostMessageKey(this.rowLockLostReason, this.rowLockedBy)
      if (this.rowLockDeniedReason) return lockDeniedMessageKey(this.rowLockDeniedReason, this.rowLockedBy)
      return lockLostMessageKey(null, this.rowLockedBy)
    },
    /**
     * Los campos donde el valor guardado y el que se intentó guardar no coinciden.
     *
     * Sólo esos: mostrar la fila entera obligaría a la persona a buscar la diferencia, que
     * es precisamente lo que tiene que ver para decidir. La metadata queda afuera —el
     * contador de versión no es algo que nadie escribió— y también las claves que sólo
     * existen en uno de los dos lados sin contenido.
     */
    conflictComparison () {
      if (!this.versionConflict) return {}
      const theirs = this.versionConflict.item || {}
      const mine = this.versionConflict.failedData || {}
      const keys = new Set([...Object.keys(theirs), ...Object.keys(mine)])
      const diff = {}
      keys.forEach(key => {
        if (isItemMetadata(key) || key === 'ref_id' || key === 'authors') return
        const a = theirs[key] === undefined ? '' : theirs[key]
        const b = mine[key] === undefined ? '' : mine[key]
        if (a !== b) diff[key] = { theirs: a, mine: b }
      })
      return diff
    },
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
    /** Devuelve la promesa a propósito: abrir un modal espera la recarga antes de copiar. */
    getData: function (prefetchedData = null) {
      // El slot `table-busy` reemplaza el `tbody` entero: el documento se acorta y
      // el navegador clampea la posición del usuario. Congelarla acá cubre las tres
      // rutas que recargan la tabla — guardar una fila, guardar columnas y el
      // refresco de 15s. Desde `mounted` es no-op, `scrollY` vale 0.
      this.holdScrollPosition()
      this.dataTableSettings.isBusy = true

      if (prefetchedData) {
        this.handleResponseData(prefetchedData)
      } else {
        const params = {
          organization: this.$route.params.org_id,
          project_id: this.$route.params.id
        }
        return Api.get(`/${this.type}`, params)
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

      await this.getData()

      const docId = await this.resolveTableDocument()
      if (!docId) return
      if (!(await this.ensureColumnsLock())) return

      this.dataTableFieldsModal.fields = editFields
      this.dataTableFieldsModal.touched = new Array(editFields.length).fill(false)
      // Claves de las columnas ya creadas, por índice: hace que un segundo guardado renombre
      // en vez de duplicar si el primero falló a mitad de camino.
      this.dataTableFieldsModal.keys = new Array(editFields.length).fill(null)
      this.columnsCreateModalOpen = true
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
      this.columnsCreateModalOpen = false
      await this.releaseColumnsLock()
      this.getData()
      this.flushPendingRefresh()
    },
    openModalDataTableEdit: async function () {
      // Primero el estado fresco: si otra persona agregó una columna, el modal tiene que
      // armarse con ella y no con la copia vieja.
      await this.getData()

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
      this.columnsEditModalOpen = true
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
    /** Lo que significa recargar acá: releer la tabla. */
    applyProjectRefresh: function () {
      this.getData()
    },
    /** Repintar la tabla debajo de alguien que escribe le descarta el borrador. */
    hasOpenEditor: function () {
      return this.rowEditorOpen || this.columnsCreateModalOpen || this.columnsEditModalOpen
    },
    startFreshnessPolling: function () {
      this.checkProjectFreshness()
      this.freshnessTimer = setInterval(() => this.checkProjectFreshness(), 15000)
    },
    stopFreshnessPolling: function () {
      if (this.freshnessTimer) clearInterval(this.freshnessTimer)
      this.freshnessTimer = null
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

      const lockRef = fieldsLockKey(docId)
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
      // El estado local se baja PRIMERO, antes de cualquier await: si uno falla, dejar el
      // flag en true hace que `hasOpenEditor()` mienta para siempre y el refresco periódico
      // no vuelva a aplicarse nunca. Es lo que pasaba cuando `releaseRef` rechazaba porque la
      // app había quedado sin conexión — medido en el navegador.
      this.columnsEditModalOpen = false
      this.committedColumnLabels = {}

      const pendiente = this.pendingColumnsOrder
      this.pendingColumnsOrder = false

      try {
        if (pendiente && this.dataTable.id) {
          const order = this.dataTableFieldsModalEdit.fields
            .filter(field => field.key)
            .map(field => field.key)

          if (order.length && await this.ensureColumnsLock()) {
            await columnService.reorderColumns(this.type, this.dataTable.id, order)
            this.getData()
          }
        }
      } catch (error) {
        this.$emit('print-errors', error)
      }

      await this.releaseColumnsLock()
      // Nada más abierto: aplicar la recarga que se postergó mientras se editaba.
      this.flushPendingRefresh()
    },
    /**
     * Suelta el lock de columnas. Un fallo al soltarlo no puede dejarlo marcado como
     * tomado: el servidor lo expira por TTL, y creerlo vigente sólo bloquearía las
     * operaciones siguientes de este mismo usuario.
     */
    releaseColumnsLock: async function () {
      if (!this.columnsLockHeld) return

      const ref = this.columnsLockRef
      this.columnsLockHeld = false
      this.columnsLockRef = null
      try {
        await LockService.releaseRef(ref)
      } catch (error) {
        console.warn('No se pudo liberar el lock de columnas:', error)
      }
    },
    notifyColumnsError: function (message) {
      this.$bvToast.toast(message, {
        title: this.$t('notifications.error'),
        variant: 'danger',
        solid: true
      })
    },
    /**
     * Quita de cada fila las claves de columnas que ya no existen, y completa con vacío
     * las que `fields` declara y la fila no trae.
     *
     * Antes reconstruía la fila desde cero con las claves de `fields`, y eso borraba todo
     * lo que el servidor guarda DENTRO del ítem sin ser una columna: el contador de
     * versión `_v` y el árbol `stages` de las 10 evaluaciones de ajuste. Como el resultado
     * se compara con lo que vino del servidor para decidir si hay que reescribir el
     * documento (`updateMyDataTables`), la comparación difería SIEMPRE y salía un PATCH de
     * documento completo —sin lock y sin versión— en cada montaje de la vista.
     *
     * La regla de qué es huérfano vive en `cleanOrphanedCustomFieldKeys`: sólo las claves
     * `column_*` se descartan, y sólo si no están en `fields`. Se usa esa y no una copia
     * local porque la copia local es justamente lo que causó el problema.
     */
    getCleanedItems: function (items, fields) {
      if (!items) return []
      if (!fields || !fields.length) return items

      const declaredKeys = fields.map(f => f.key)
      const withoutOrphans = cleanOrphanedCustomFieldKeys(
        items.filter(item => item.ref_id && item.authors),
        fields
      )

      return withoutOrphans.map(item => {
        declaredKeys.forEach(key => {
          if (!Object.prototype.hasOwnProperty.call(item, key)) item[key] = ''
        })
        return item
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
      this.rowLockLostReason = detail.reason || null
    },
    /**
     * La fila cambió entre que se leyó y que se intentó guardar.
     *
     * No se puede resolver reintentando —el guardado pisaría lo que la otra persona
     * escribió— ni absorbiendo la versión nueva a la callada, que es lo mismo con un paso
     * de más. Y no se puede dejar pasar: el `_v` local quedó viejo, así que cada tecleo
     * siguiente vuelve a chocar y la persona escribiría contra un guardado imposible.
     *
     * Así que se corta la escritura y se retiene el valor ajeno junto al propio, para que
     * la decisión de qué conservar la tome quien escribió.
     */
    onVersionConflict: function (event) {
      const detail = (event && event.detail) || {}
      if (detail.refId !== this.dataTableFieldsModal.editingRefId) return
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.autoSaveStatus = null
      this.isRowReadOnly = true
      this.versionConflict = {
        item: detail.item || {},
        failedData: detail.failedData || {},
        currentVersion: detail.currentVersion
      }
    },
    /** Trae la fila al día y devuelve el editor a un estado escribible. */
    reloadAfterVersionConflict: function () {
      this.versionConflict = null
      this.isRowReadOnly = false
      this.getData()
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
      this.rowLockLostReason = null
      this.rowLockDeniedReason = null
      // Ya no hay nada abierto: aplicar la recarga postergada mientras se escribía.
      this.flushPendingRefresh()
    },
    addContentDataTable: function (index = 0) {
      // El auto-guardado lee la fila seleccionada cuando le toca correr, no cuando se
      // programó. Si el índice ya cambió, escribiría una fila que nadie editó, y con el
      // lock de la anterior recién liberado más abajo.
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.autoSaveStatus = null
      this.versionConflict = null

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
        // El motivo del acquire, no el del latido: acá no perdió nada, nunca lo tuvo.
        this.rowLockDeniedReason = result.reason || null
        if (this.$notify) {
          this.$notify.warning(this.$t(this.rowLockMessageKey, { user: this.rowLockedBy }))
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
    /**
     * Trae al ítem local la versión que el servidor acaba de estampar.
     *
     * El guardado granular responde con el DOCUMENTO completo recargado, no con la fila,
     * así que hay que buscarla por `ref_id`. Sin esto el ítem del modal —que es el mismo
     * objeto que se vuelve a enviar en el próximo guardado— conserva la versión anterior
     * y el segundo PATCH recibe `409 version_conflict`. Con el auto-guardado por tecleo
     * eso no es un caso raro: es el segundo tecleo.
     *
     * Se copia sólo la metadata, nunca los valores: lo que el usuario está escribiendo en
     * ese momento no puede ser pisado por la respuesta de su propio guardado anterior.
     */
    absorbItemVersion: function (response, localItem) {
      const items = (response && response.data && response.data.items) || []
      const saved = items.find(item => item && item.ref_id === localItem.ref_id)
      if (!saved) return
      // `$set` y no asignación directa: la primera vez la clave no existe en el objeto
      // local, y Vue 2 no observa propiedades agregadas después.
      const fresh = copyItemMetadata({}, saved)
      Object.keys(fresh).forEach(key => this.$set(localItem, key, fresh[key]))
    },
    performAutoSave: function () {
      const id = this.dataTable.id
      if (!id || this.isRowReadOnly) return
      const editedItem = this.dataTableFieldsModal.items[this.dataTableFieldsModal.selected_item_index]
      if (!editedItem) return
      this.autoSaveStatus = 'saving'
      return this._patchContentItem(id, editedItem)
        .then((response) => {
          this.absorbItemVersion(response, editedItem)
          this.autoSaveStatus = 'saved'
          setTimeout(() => { this.autoSaveStatus = null }, 2000)
        })
        .catch(() => {
          // Salvo que el conflicto de versión ya haya puesto su cartel: ahí este ícono
          // sería un segundo indicador del mismo evento, y el que menos dice de los dos —
          // «no se pudo guardar» sugiere reintentar, y reintentar es justo lo que no
          // corresponde mientras la fila esté desactualizada.
          if (!this.versionConflict) this.autoSaveStatus = 'error'
        })
    },
    saveContentDataTable: function () {
      const id = this.dataTable.id
      const editedItem = this.dataTableFieldsModal.items[this.dataTableFieldsModal.selected_item_index]
      // Writing without the row's lock is a guaranteed 409 (endpoint B).
      if (!id || this.isRowReadOnly) return Promise.resolve()

      // El guardado explícito manda lo mismo que el auto-guardado pendiente, así que
      // dejarlo correr era un PATCH de más. Con el contador de versión por ítem deja de
      // ser inocuo: este PATCH avanza `_v` en el servidor y el pendiente llegaría con la
      // versión anterior, o sea un 409 en cada guardado con click.
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()

      return this._patchContentItem(id, editedItem)
        .then(() => {
          // Antes se emitía `set-item-data` para que viewProject navegara a un
          // ancla y scrolleara hasta la fila. Esa navegación era justamente lo que
          // tiraba la página al tope: el `scrollBehavior` global la manda a y=0.
          // La posición ahora se sostiene desde `getData`, sin tocar la URL.
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
            this.removeReferenceDataTable.findings.push(list.displayNumber)
          }
        }
      }
      // Mismo criterio que el editor de fila: el lock se pide al abrir, así que el «lo
      // tiene otra persona» llega antes de que alguien confirme un borrado que va a fallar.
      this.acquireRemoveLock(id)
      this.$refs['removeContentModalDataTable'].show()
    },
    /** Toma el lock de la fila que se va a vaciar, en su propio estado. */
    async acquireRemoveLock (refId) {
      if (!refId) return
      // Abrir otra confirmación sin soltar la anterior dejaba esa fila bloqueada para
      // todos hasta que el TTL del servidor la barriera.
      if (this.removeLockRef && this.removeLockRef !== refId) this.releaseRemoveLock()
      if (!this.canEdit) {
        this.removeReadOnly = true
        return
      }
      const result = await LockService.acquireRef(this.$route.params.id, refId)
      if (result.success) {
        this.removeLockRef = refId
        this.removeReadOnly = false
        this.removeLockedBy = null
        return
      }
      this.removeReadOnly = true
      this.removeLockedBy = result.permissionDenied ? null : (result.lockedBy || null)
    },
    releaseRemoveLock: function () {
      if (this.removeLockRef) LockService.releaseRef(this.removeLockRef)
      this.removeLockRef = null
    },
    /**
     * `hidden` y no `cancel`: BootstrapVue sólo emite `cancel` en el botón de cancelar, y
     * no cuando se cierra con ESC, con la X o clickeando el fondo. Colgado de `cancel`, el
     * lock quedaba tomado en esas tres rutas.
     */
    onRemoveModalHidden: function () {
      this.releaseRemoveLock()
      this.removeReadOnly = false
      this.removeLockedBy = null
      this.removeReferenceDataTable = {
        id: null,
        findings: []
      }
    },
    cleanRemoveContentCharsOfStudies: function () {
      this.removeReferenceDataTable = {
        id: null,
        findings: []
      }
    },
    /**
     * Vacía las columnas de una fila, dejando la fila en la tabla.
     *
     * Escribe SÓLO esa fila, por el sub-recurso `/item/<ref_id>`. Antes reescribía el
     * array `items` completo por la ruta genérica, y eso tenía dos problemas: se llevaba
     * por delante lo que otra persona estuviera escribiendo en cualquier otra fila, y no
     * pasaba por ningún lock —la ruta genérica no lo exige—, así que el bloqueo de fila
     * coordinaba la interfaz sin impedir la escritura.
     *
     * Se parte del ítem y se vacían las columnas, en vez de construir la fila desde cero:
     * el `$set` del servidor reemplaza el ítem completo, así que lo que no viaje se pierde
     * —el contador `_v`, el árbol `stages` de las evaluaciones de ajuste— y vaciar las
     * columnas no es motivo para tirar nada de eso.
     */
    removeDataFromLists: function () {
      const removedId = this.removeReferenceDataTable.id
      const original = (this.dataTable.items || []).find(item => item.ref_id === removedId)
      if (!removedId || !original) return Promise.resolve()
      // Escribir sin el lock de la fila es un 409 garantizado (endpoint B).
      if (this.removeReadOnly || this.removeLockRef !== removedId) return Promise.resolve()

      const row = Commmons.deepClone(original)
      this.dataTable.fields.forEach(field => {
        if (field.key === 'ref_id' || field.key === 'authors') return
        row[field.key] = ''
      })

      return this._patchContentItem(this.dataTable.id, row)
        .then(() => {
          this.getData()
        })
        .catch((error) => {
          if (!isLockRejection(error)) this.$emit('print-errors', error)
        })
        .finally(() => {
          // La fila ya está vaciada: retener el lock la dejaría bloqueada para todos hasta
          // que el TTL del servidor lo barriera.
          this.releaseRemoveLock()
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
    openModalImportTable: async function () {
      // El modal se muestra primero: hacerlo esperar el listado convertiría un hipo de red
      // en un botón que no responde.
      this.$refs[`import-table-${this.type}`].show()
      this.importLockProbe = await LockService.probeRefLocks(this.$route.params.id)
    },
    /**
     * Pregunta antes de arrasar, y devuelve si hay que seguir.
     *
     * El import es `DELETE` + `POST` del documento completo. Exige el lock de PROYECTO,
     * así que si otra persona lo tiene el servidor rechaza — pero **no mira los ref
     * locks**: quien esté editando un estudio del Paso 3 o 4 sostiene un lock por `ref_id`
     * y el import le pasa por encima sin conflicto, sin aviso y con las filas ya borradas.
     * Backend decidió no cerrarlo del lado servidor (un import destructivo que falla
     * porque alguien tiene una fila abierta convierte una operación legítima en una
     * lotería); la mitad nuestra es que la persona lo sepa antes de decidir.
     *
     * Consulta de nuevo en vez de reusar lo del `openModalImportTable`: entre abrir el
     * modal y apretar Guardar se elige el archivo y se revisan las columnas, y un listado
     * de hace cinco minutos avisaría de quien ya salió y callaría a quien acaba de entrar.
     */
    confirmImportOverRefLocks: async function () {
      this.importLockProbe = await LockService.probeRefLocks(this.$route.params.id)

      // Sin concurrencia no hay locks posibles: nada que avisar, y un clic extra donde la
      // pregunta no aplica es lo que hace que se dejen de leer los carteles.
      if (!this.importLockProbe.enabled) return true

      // `reachable:false` es la razón de ser de `probeRefLocks`. Sin ese campo un error de
      // red se leería igual que «nadie está editando», y le diríamos lo contrario de la
      // verdad justo antes de una operación que no se deshace.
      const message = this.importLockProbe.reachable
        ? this.importLockNotice
        : this.$t('import_modal.ref_locks_unknown')
      if (!message) return true

      return this.$bvModal.msgBoxConfirm(message, {
        title: this.$t('import_modal.ref_locks_title'),
        okVariant: 'danger',
        okTitle: this.$t('import_modal.ref_locks_ok'),
        cancelTitle: this.$t('common.cancel'),
        centered: true
      })
    },
    exportTableToXLSX: async function () {
      await exportTableToXLSX({
        fields: this.dataTable.fields,
        items: this.dataTable.items,
        filename: 'exportable_table'
      })
    },
    saveImportedData: async function () {
      if (!this.importDataTable.fields.length || !this.importDataTable.items.length) return

      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id,
        fields: this.importDataTable.fields,
        items: this.importDataTable.items
      }

      // El limpiado se movió DEBAJO de la confirmación a propósito: antes corría siempre,
      // así que cancelar le costaba volver a elegir el archivo y revisar las columnas de
      // nuevo — un castigo por haber dudado.
      if (!(await this.confirmImportOverRefLocks())) return

      if (this.dataTable.items.length) {
        this.cleanImportedData(this.dataTable.id, params)
      } else {
        this.insertImportedData(params)
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
    /**
     * Muestra la tabla con una fila por estudio, derivando las que el documento no tiene.
     *
     * Antes las escribía: un PATCH del documento completo por la ruta genérica, sin lock y
     * sin comprobación de versión, que se llevaba por delante lo que otra persona estuviera
     * editando en cualquier otra fila. La rama de sólo lectura ya hacía lo correcto
     * —derivar y mostrar— y ahora es el único camino.
     *
     * La fila se persiste sola en cuanto alguien escribe en ella: el endpoint por ítem es
     * un upsert, así que nadie necesita que exista antes.
     */
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
          let items = this.processItems(responseData.items || [])
          items = this.getCleanedItems(items, responseData.fields)

          const derivedData = Commmons.deepClone(response.data)
          derivedData[0].items = items
          this.getData(derivedData)
        })
        .catch((error) => {
          this.dataTableSettings.isBusy = false
          this.$emit('print-errors', error)
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
