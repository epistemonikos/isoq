<template>
  <div
    class="mt-3"
    v-if="show.selected.includes('ed')">
    <a name="extracted-data"></a>
    <template v-if="showParagraph">
      <videoHelp :txt="$t('worksheet.extracted_data')" tag="h3-extracted-data" urlId="450836795" :warning="ui.adequacy.extracted_data.display_warning"></videoHelp>
    </template>
    <template v-else>
      <h3 v-if="showTitle">{{ $t('worksheet.extracted_data') }}</h3>
    </template>
    <p v-if="showParagraph" class="d-print-none font-weight-light">
      {{ $t('worksheet.extracted_data_intro') }}
    </p>
    <template v-if="localExtractedData.fields.length">
      <bc-filters
        v-if="mode==='edit'"
        :showFilters="showFilters"
        class="d-print-none"
        idname="extracted-data-filter"
        :tableSettings="tableSettings"
        type="extracted_data"
        :fields="modePrintFieldObject"
        :items="localExtractedData.items">
      </bc-filters>
      <b-table
        class="toDoc extracted-data-table"
        :id="(mode==='view') ? 'extracted-view' : 'extracted'"
        responsive
        head-variant="light"
        outlined
        :filter="tableSettings.filter"
        :fields="(mode==='view') ? modePrintFieldObject : localExtractedData.fieldsObj"
        :items="localExtractedData.items"
        :current-page="tableSettings.currentPage">
        <template v-slot:cell(authors)="data">
          <span v-b-tooltip.hover :title="getReferenceInfo(data.item.ref_id)">{{data.item.authors}}</span>
        </template>
        <template
          v-if="mode==='edit' && permission"
          v-slot:cell(actions)="data">
          <!-- El tooltip va en un span y no en el botón: un botón deshabilitado no emite
               eventos de mouse, así que su propio `title` no se mostraría nunca. -->
          <span
            v-if="rowTakenBy(data.item.ref_id)"
            class="d-print-none d-inline-block"
            :data-testid="`ed-locked-${data.item.ref_id}`"
            v-b-tooltip.hover
            :title="$t('lock.ref_locked_by', { user: rowTakenBy(data.item.ref_id).user_name || '' })">
            <b-button
              :data-testid="`ed-edit-${data.item.ref_id}`"
              disabled
              :style="{ pointerEvents: 'none' }"
              variant="outline-success">
              <font-awesome-icon icon="user" />
            </b-button>
            <b-button
              :data-testid="`ed-remove-${data.item.ref_id}`"
              disabled
              :style="{ pointerEvents: 'none' }"
              variant="outline-danger">
              <font-awesome-icon icon="trash" />
            </b-button>
          </span>
          <template v-else>
            <b-button
              class="d-print-none"
              :data-testid="`ed-edit-${data.item.ref_id}`"
              @click="openModalExtractedDataEditDataItem(data)"
              variant="outline-success">
              <font-awesome-icon
                icon="edit"
                :title="$t('common.edit')" />
            </b-button>
            <b-button
              class="d-print-none"
              :data-testid="`ed-remove-${data.item.ref_id}`"
              @click="openModalExtractedDataRemoveDataItem(data)"
              variant="outline-danger">
              <font-awesome-icon
                icon="trash"
                :title="$t('common.remove')" />
            </b-button>
          </template>
        </template>
      </b-table>
      <b-modal
        id="modal-extracted-data-remove-data-item"
        ref="modal-extracted-data-remove-data-item"
        :title="$t('characteristics.remove_content')"
        @ok="extractedDataRemoveDataItem"
        @hide="onRowEditorHide"
        @hidden="onRowEditorHidden"
        :ok-disabled="isRowReadOnly"
        ok-variant="outline-success"
        cancel-variant="outline-secondary">
        <b-alert v-if="isRowReadOnly" show variant="warning">
          {{ rowLockedBy ? $t('lock.ref_locked_by', { user: rowLockedBy }) : $t('lock.permissions_revoked') }}
        </b-alert>
        <p>{{ $t('characteristics.confirm_delete_row') }}</p>
      </b-modal>
      <b-modal
        size="xl"
        :title="$t('characteristics.edit_data')"
        id="modal-extracted-data-data"
        ref="modal-extracted-data-data"
        @ok="saveDataExtractedData"
        @hide="onRowEditorHide"
        @hidden="onRowEditorHidden"
        :ok-disabled="isRowReadOnly"
        cancel-variant="outline-secondary"
        ok-variant="outline-success"
        :ok-title="$t('common.save')">
        <b-alert v-if="isRowReadOnly" show variant="warning">
          {{ rowLockedBy ? $t('lock.ref_locked_by', { user: rowLockedBy }) : $t('lock.permissions_revoked') }}
        </b-alert>
        <b-form-group
          v-for="(field, index) in buffer_extracted_data.fields"
          :key="index"
          :id="`label-field-${index}`"
          :label="(field.key === 'column_0') ? $t('worksheet.add_extracted_data_label') : ''"
          :label-for="`input-field-${index}`">
          <b-form-textarea
            :id="`input-field-${index}`"
            v-if="field.key !== 'ref_id' && field.key !== 'authors'"
            v-model="buffer_extracted_data_items[field.key]"
            rows="6"
            max-rows="100"
            :disabled="isRowReadOnly"></b-form-textarea>
        </b-form-group>
      </b-modal>

      <back-to-top></back-to-top>
    </template>
  </div>
</template>

<script>
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import { copyItemMetadata } from '@/utils/itemMetadata'
import { extractedDataRowLockKey, foreignRowLock } from '@/utils/extractedDataLockKeys'
import refLockStateMixin from '@/mixins/refLockStateMixin'
const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')
const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')
const bCardFilters = () => import(/* webpackChunkName: "backtotop" */'../tableActions/Filters')

export default {
  name: 'editListExtractedData',
  // `foreignRefLocks`: el sondeo de la worksheet sin los locks de esta pestaña.
  mixins: [refLockStateMixin],
  props: {
    ui: Object,
    show: Object,
    mode: String,
    list: Object,
    permission: Boolean,
    extractedData: Object,
    modePrintFieldObject: Array,
    refsWithTitle: Array,
    showParagraph: {
      type: Boolean,
      default: false
    },
    showFilters: Boolean,
    showTitle: {
      type: Boolean,
      default: true
    },
    // El sondeo de `GET /refs` de la worksheet. Con él los botones de una fila que otra
    // persona está editando o borrando se grisan ANTES del clic, en vez de enterarse al
    // abrir el modal.
    activeRefLocks: {
      type: Array,
      default: () => []
    }
  },
  components: {
    'back-to-top': backToTop,
    'bc-filters': bCardFilters,
    videoHelp
  },
  data () {
    return {
      // Ref-lock state of the row being edited/removed. Endpoint C demands the
      // caller holds the lock of that row's ref_id.
      isRowReadOnly: false,
      rowLockedBy: null,
      lockedRowRef: null,
      rowEditorOpen: false,
      // True when a `hidden` from a previous editor session is still on its way.
      staleHiddenPending: false,
      // Un cierre empezado (`hide` no cancelado) cuyo `hidden` todavía no llegó. Es lo
      // único que anuncia un `hidden` en camino; ver `onRowEditorHide`.
      closingInFlight: false,
      buffer_extracted_data_items: {},
      buffer_extracted_data: {
        fields: [],
        items: [],
        id: null
      },
      tableSettings: {
        filter: '',
        totalRows: 1,
        currentPage: 1,
        perPage: 10,
        pageOptions: [10, 50, 100]
      },
      localExtractedData: {
        fields: [],
        items: []
      }
    }
  },
  methods: {
    getReferenceInfo: function (refId) {
      for (let ref of this.refsWithTitle) {
        if (ref.id === refId) {
          return ref.content
        }
      }
    },
    openModalExtractedDataEditDataItem: function (data) {
      this.localExtractedData.edit_index_item = data.index
      this.buffer_extracted_data.fields = JSON.parse(JSON.stringify(this.localExtractedData.fields))
      this.buffer_extracted_data.fields.splice(this.buffer_extracted_data.fields.length - 1, 1)
      this.buffer_extracted_data_items = JSON.parse(JSON.stringify(this.localExtractedData.items[data.index]))
      this.beginRowEditor(this.rowRefAt(data.index))
      this.$refs['modal-extracted-data-data'].show()
    },
    openModalExtractedDataRemoveDataItem: function (data) {
      this.buffer_extracted_data.remove_index_item = data.index
      // Clearing a row is a write through endpoint C too, so it needs the same lock.
      this.beginRowEditor(this.rowRefAt(data.index))
      this.$refs['modal-extracted-data-remove-data-item'].show()
    },
    beginRowEditor: function (refId) {
      // A lock the modal never released (its `hidden` never arrived, or it never
      // finished opening) would stay held while we move to another row.
      if (this.lockedRowRef && this.lockedRowRef !== this.rowLockKeyOf(refId)) this.releaseRowLock()
      // Opening while another session is still closing means its `hidden` is still in
      // flight and must not be mistaken for the closing of this one. «Closing», not
      // «open»: a second click on a modal that is still open or opening is a no-op for
      // BootstrapVue, no `hidden` is coming for it, and arming the guard then made the
      // one real `hidden` look stale — the lock stayed held until leaving the view.
      this.staleHiddenPending = this.closingInFlight
      this.rowEditorOpen = true
      this.acquireRowLock(this.rowLockKeyOf(refId))
    },
    // La fila de ESTE documento, no el estudio: ver `extractedDataLockKeys.js`.
    rowLockKeyOf: function (refId) {
      return extractedDataRowLockKey(this.localExtractedData && this.localExtractedData.id, refId)
    },
    /** El lock de otra persona sobre esa fila, o null. */
    rowTakenBy: function (refId) {
      return foreignRowLock(this.foreignRefLocks, this.localExtractedData && this.localExtractedData.id, refId)
    },
    releaseRowLock: function () {
      if (this.lockedRowRef) LockService.releaseRef(this.lockedRowRef)
      this.lockedRowRef = null
    },
    rowRefAt: function (index) {
      const item = this.localExtractedData.items[index]
      return item ? item.ref_id : null
    },
    // Mirrors StepFour.vue's acquireStudyLock: ask on open so the rejection lands
    // before the user types. The project id comes from the list prop — the route
    // param of this view is the list id.
    async acquireRowLock (lockKey) {
      if (!lockKey) return
      if (!this.permission) {
        this.isRowReadOnly = true
        this.rowLockedBy = null
        return
      }
      const result = await LockService.acquireRef(this.list.project_id, lockKey)
      if (result.success) {
        this.lockedRowRef = lockKey
        this.isRowReadOnly = false
        this.rowLockedBy = null
      } else if (result.permissionDenied) {
        this.isRowReadOnly = true
        this.rowLockedBy = null
        if (this.$notify) this.$notify.warning(this.$t('lock.permissions_revoked'))
        this.$emit('lock-denied')
      } else {
        this.isRowReadOnly = true
        this.rowLockedBy = result.lockedBy || null
        if (this.$notify) {
          this.$notify.warning(this.$t('lock.ref_locked_by', { user: this.rowLockedBy }))
        }
        // Que el padre repida el sondeo ya: `emitRefLocksChanged` sólo se dispara en un
        // acquire exitoso y en el release, así que sin esto los botones de esta fila
        // seguirían invitando al clic hasta el próximo ciclo.
        this.$emit('lock-denied')
      }
    },
    // See crudTables.onRefLockLost: the lock can be lost while the editor is open.
    onRefLockLost: function (event) {
      const detail = event.detail || {}
      if (detail.refId !== this.lockedRowRef) return
      this.isRowReadOnly = true
      this.rowLockedBy = detail.lockedBy || null
    },
    // BootstrapVue emits `hide` synchronously when a close starts, and every `hidden`
    // follows a `hide` that was not cancelled. A cancelled one never gets its `hidden`.
    onRowEditorHide: function (bvEvent) {
      if (!bvEvent || !bvEvent.defaultPrevented) this.closingInFlight = true
    },
    onRowEditorHidden: function () {
      this.closingInFlight = false
      // BootstrapVue emits `hidden` asynchronously: a late one belongs to the previous
      // session, and releasing now would leave the open editor without its lock.
      if (this.staleHiddenPending) {
        this.staleHiddenPending = false
        return
      }
      this.rowEditorOpen = false
      this.releaseRowLock()
      this.isRowReadOnly = false
      this.rowLockedBy = null
    },
    extractedDataRemoveDataItem: function () {
      // Granular reset: blank this row's data columns (keep ref_id + authors) via the
      // /item/<ref_id> sub-resource. No $pull, no whole-array rewrite (endpoint C).
      const item = this.localExtractedData.items[this.buffer_extracted_data.remove_index_item]
      // Writing without this row's lock is a guaranteed 409.
      if (this.isRowReadOnly) return Promise.resolve()
      // La fila se arma con las claves que el reset escribe, no con un spread del ítem: lo
      // que se borra son las columnas de datos. Pero el `_v` no es una columna de datos —
      // es la metadata con la que el servidor comprueba que nadie escribió mientras tanto—,
      // así que se copia aparte. Sin él este PATCH pasa por el camino tolerado: entra igual
      // y la comprobación se pierde en silencio.
      const row = copyItemMetadata({ ref_id: item.ref_id, authors: item.authors, column_0: '' }, item)

      return Api.patch(`/isoqf_extracted_data/${this.localExtractedData.id}/item/${item.ref_id}`, row)
        .then(() => {
          this.$emit('getExtractedData', true)
          delete this.buffer_extracted_data.remove_index_item
        })
        .catch((error) => {
          this.$emit('printErrors', error)
        })
    },
    saveDataExtractedData: function () {
      // Granular save: PATCH only the edited row via the /item/<ref_id> sub-resource,
      // so concurrent edits to other rows are not overwritten (endpoint C).
      const _item = JSON.parse(JSON.stringify(this.buffer_extracted_data_items))
      // Writing without this row's lock is a guaranteed 409.
      if (this.isRowReadOnly) return Promise.resolve()
      // Mismo motivo que en el reset: el `_v` viaja aparte porque no es un campo del
      // usuario. `_item` es el buffer del editor, clonado de la fila del servidor, así que
      // trae el contador que corresponde a lo que la persona abrió.
      const row = copyItemMetadata({
        ref_id: _item.ref_id,
        authors: _item.authors,
        column_0: _item.column_0
      }, _item)

      return Api.patch(`/isoqf_extracted_data/${this.localExtractedData.id}/item/${_item.ref_id}`, row)
        .then(() => {
          this.$emit('getExtractedData', true)
          this.buffer_extracted_data = {fields: [], items: [], id: null}
          this.buffer_extracted_data_items = {}
        })
        .catch((error) => {
          this.$emit('printErrors', error)
        })
    }
  },
  mounted () {
    this.localExtractedData = this.extractedData
    window.addEventListener('ref-lock-lost', this.onRefLockLost)
  },
  beforeDestroy () {
    window.removeEventListener('ref-lock-lost', this.onRefLockLost)
    // The modal events cannot be trusted to have released it (see onRowEditorHidden).
    this.releaseRowLock()
  },
  watch: {
    extractedData: {
      handler: function (val) {
        this.localExtractedData = val
      },
      deep: true
    }
  }
}
</script>

<style>

</style>
