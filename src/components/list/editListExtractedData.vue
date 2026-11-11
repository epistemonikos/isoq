<template>
  <div
    class="mt-3"
    v-if="!hideable || show.selected.includes('ed')">
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
        <!-- The row is edited where it is, as the Adequacy panel did (Megan: one design for
             every extracted data table). The banners say what the row's lock or version
             says, in the row, while the editor is open. -->
        <template v-slot:cell(column_0)="data">
          <template v-if="isEditingRow(data.item.ref_id)">
            <b-alert v-if="rowVersionConflict" show variant="warning" class="mb-2"
              data-testid="row-version-conflict">
              <p class="mb-2">{{ $t('version_conflict.reload_needed') }}</p>
              <b-button size="sm" variant="outline-primary" @click="reloadAfterRowVersionConflict">
                {{ $t('version_conflict.reload') }}
              </b-button>
            </b-alert>
            <b-alert v-else-if="isRowReadOnly" show variant="warning" class="mb-2"
              data-testid="row-readonly-notice">
              {{ $t(rowLockMessageKey, { user: rowLockedBy }) }}
            </b-alert>
            <b-form-textarea
              :data-testid="`ed-inline-text-${data.item.ref_id}`"
              :aria-label="$t('worksheet.add_extracted_data_label')"
              v-model="buffer_extracted_data_items.column_0"
              rows="6"
              max-rows="100"
              :disabled="isRowReadOnly"></b-form-textarea>
          </template>
          <template v-else>{{ data.item.column_0 }}</template>
        </template>
        <template
          v-if="mode==='edit' && permission"
          v-slot:cell(actions)="data">
          <template v-if="isEditingRow(data.item.ref_id)">
            <b-button
              block
              class="d-print-none"
              :data-testid="`ed-save-${data.item.ref_id}`"
              :disabled="rowWriteBlocked"
              variant="success"
              @click="saveRowEdit">
              {{ $t('common.save') }}
            </b-button>
            <b-button
              block
              class="d-print-none"
              :data-testid="`ed-cancel-${data.item.ref_id}`"
              variant="outline-secondary"
              @click="cancelRowEdit">
              {{ $t('common.cancel') }}
            </b-button>
          </template>
          <!-- El tooltip va en un span y no en el botón: un botón deshabilitado no emite
               eventos de mouse, así que su propio `title` no se mostraría nunca. -->
          <span
            v-else-if="rowTakenBy(data.item.ref_id)"
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
          <!-- One row at a time: while one is open the others wait, so a draft is never
               dropped by clicking another row. -->
          <template v-else>
            <b-button
              class="d-print-none"
              :data-testid="`ed-edit-${data.item.ref_id}`"
              :disabled="editingRef !== null"
              @click="startRowEdit(data.item.ref_id)"
              variant="outline-success">
              <font-awesome-icon
                icon="edit"
                :title="$t('common.edit')" />
            </b-button>
            <b-button
              class="d-print-none"
              :data-testid="`ed-remove-${data.item.ref_id}`"
              :disabled="editingRef !== null"
              @click="openModalExtractedDataRemoveDataItem(data.item.ref_id)"
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
        @ok="onRemoveRowOk"
        @hide="onRowEditorHide"
        @hidden="onRowEditorHidden"
        :ok-disabled="rowWriteBlocked"
        ok-variant="outline-success"
        cancel-variant="outline-secondary">
        <b-alert v-if="isRowReadOnly" show variant="warning">
          {{ $t(rowLockMessageKey, { user: rowLockedBy }) }}
        </b-alert>
        <p>{{ $t('characteristics.confirm_delete_row') }}</p>
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
import referenceDeletedMixin from '@/mixins/referenceDeletedMixin'
import { REFERENCE_DELETED } from '@/utils/referenceDeleted'
import { lockLostMessageKey, lockDeniedMessageKey } from '@/utils/lockLostMessage'
import { isLockRejection, isVersionRejection } from '@/utils/lockErrors'
import { writeErrorMessageKey } from '@/utils/writeErrors'
const videoHelp = () => import(/* webpackChunkName: "videohelp" */'../videoHelp')
const backToTop = () => import(/* webpackChunkName: "backtotop" */'../backToTop')
const bCardFilters = () => import(/* webpackChunkName: "backtotop" */'../tableActions/Filters')

export default {
  name: 'editListExtractedData',
  // `foreignRefLocks`: el sondeo de la worksheet sin los locks de esta pestaña.
  mixins: [refLockStateMixin, referenceDeletedMixin],
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
    // The worksheet page lets the reader hide this section (`show.selected`). That choice is
    // about the page: a panel that shows the table to assess with passes `false`.
    hideable: {
      type: Boolean,
      default: true
    },
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
      // The row lock is still being asked for, or the row's PATCH is on its way:
      // Save waits for both (#404).
      rowLockPending: false,
      rowSaving: false,
      rowLockedBy: null,
      // El motivo del latido (`ref-lock-lost`) o del acquire, para que el cartel diga si
      // se destraba solo. Ver `lockLostMessage.js`.
      rowLockLostReason: null,
      rowLockDeniedReason: null,
      lockedRowRef: null,
      rowEditorOpen: false,
      // El estudio de la fila abierta. Aparte de `lockedRowRef` porque ése queda en null
      // cuando el acquire se negó, y un estudio borrado se niega justamente así.
      rowEditorStudy: null,
      // True when a `hidden` from a previous editor session is still on its way.
      staleHiddenPending: false,
      // Un cierre empezado (`hide` no cancelado) cuyo `hidden` todavía no llegó. Es lo
      // único que anuncia un `hidden` en camino; ver `onRowEditorHide`.
      closingInFlight: false,
      // The study of the row open in the in-place editor, or null; and what it holds.
      editingRef: null,
      buffer_extracted_data_items: {},
      // The server refused the open row for its version: a banner in the row until reload.
      rowVersionConflict: false,
      // The study of the row the clear-row confirmation is about.
      removeRef: null,
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
  computed: {
    // Save is off while read-only, while the lock is being asked for and while saving.
    rowWriteBlocked: function () {
      return this.isRowReadOnly || this.rowLockPending || this.rowSaving
    },
    // Mismo criterio que crudTables: un lock perdido gana sobre uno negado, porque es lo
    // último que pasó. El cartel es el único aviso; no hay toast encima.
    rowLockMessageKey () {
      if (this.rowLockLostReason) return lockLostMessageKey(this.rowLockLostReason, this.rowLockedBy)
      if (this.rowLockDeniedReason) return lockDeniedMessageKey(this.rowLockDeniedReason, this.rowLockedBy)
      return lockLostMessageKey(null, this.rowLockedBy)
    }
  },
  methods: {
    isEditingRow: function (refId) {
      return this.editingRef !== null && this.editingRef === refId
    },
    startRowEdit: function (refId) {
      const item = this.rowOf(refId)
      if (!item) return
      this.buffer_extracted_data_items = JSON.parse(JSON.stringify(item))
      this.rowVersionConflict = false
      this.editingRef = refId
      this.beginRowEditor(refId)
    },
    cancelRowEdit: function () {
      if (this.editingRef === null) return
      this.resetRowEditor()
    },
    /**
     * Save keeps the editor open, and the row lock held, until the PATCH answers (#404).
     * Releasing first made the server answer 409 lock_not_held with the text gone with
     * the editor. A failed save leaves the text in the open editor.
     */
    saveRowEdit: function () {
      if (this.rowWriteBlocked) return Promise.resolve(false)
      this.rowSaving = true
      return this.saveDataExtractedData().then((saved) => {
        this.rowSaving = false
        if (saved) this.resetRowEditor()
        return saved
      })
    },
    reloadAfterRowVersionConflict: function () {
      this.resetRowEditor()
      this.$emit('getExtractedData', true)
    },
    onRemoveRowOk: function (bvEvent) {
      this.confirmRowWrite(bvEvent, this.extractedDataRemoveDataItem, 'modal-extracted-data-remove-data-item')
    },
    // `modalId` is also the modal's ref; closing by id survives re-renders.
    confirmRowWrite: function (bvEvent, write, modalId) {
      if (bvEvent) bvEvent.preventDefault()
      if (this.rowWriteBlocked) return
      this.rowSaving = true
      write().then((saved) => {
        this.rowSaving = false
        if (saved) this.$bvModal.hide(modalId)
      })
    },
    getReferenceInfo: function (refId) {
      for (let ref of this.refsWithTitle) {
        if (ref.id === refId) {
          return ref.content
        }
      }
    },
    // The row is found by its study, never by the slot's `data.index`: that is the position
    // on screen, and with the table filtered it points at another row.
    openModalExtractedDataRemoveDataItem: function (refId) {
      this.removeRef = refId
      // Clearing a row is a write through endpoint C too, so it needs the same lock.
      this.beginRowEditor(refId)
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
      this.rowEditorStudy = refId
      this.rowLockPending = true
      this.acquireRowLock(this.rowLockKeyOf(refId)).finally(() => { this.rowLockPending = false })
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
    rowOf: function (refId) {
      return (this.localExtractedData.items || []).find(item => item.ref_id === refId) || null
    },
    // Mirrors StepFour.vue's ensureStudyLock: ask on open so the rejection lands
    // before the user types. The project id comes from the list prop — the route
    // param of this view is the list id.
    async acquireRowLock (lockKey) {
      if (!lockKey) return
      // Abrir otra fila sin que la anterior llegara a `hidden` no puede heredar su motivo.
      this.rowLockLostReason = null
      this.rowLockDeniedReason = null
      if (!this.permission) {
        this.isRowReadOnly = true
        this.rowLockedBy = null
        return
      }
      const result = await LockService.acquireRef(this.list.project_id, lockKey)
      // The editor closed (or moved to another row) while the answer was on its way.
      if (!this.rowEditorOpen || this.rowLockKeyOf(this.rowEditorStudy) !== lockKey) {
        if (result.success) LockService.releaseRef(lockKey)
        return
      }
      if (result.success) {
        this.lockedRowRef = lockKey
        this.isRowReadOnly = false
        this.rowLockedBy = null
      } else if (result.permissionDenied) {
        // Sin toast: el cartel del modal lo dice y se queda (un evento, un canal).
        this.isRowReadOnly = true
        this.rowLockedBy = null
        this.$emit('lock-denied')
      } else {
        this.isRowReadOnly = true
        this.rowLockedBy = result.lockedBy || null
        this.rowLockDeniedReason = result.reason || null
        // Estudio borrado: no hay titular que nombrar; el editor se cierra por su canal.
        if (result.reason === REFERENCE_DELETED) return
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
      this.rowLockLostReason = detail.reason || null
    },
    // BootstrapVue emits `hide` synchronously when a close starts, and every `hidden`
    // follows a `hide` that was not cancelled. A cancelled one never gets its `hidden`.
    onRowEditorHide: function (bvEvent) {
      if (!bvEvent || !bvEvent.defaultPrevented) this.closingInFlight = true
    },
    referenceDeletedOpenStudy: function () {
      return this.rowEditorOpen ? this.rowEditorStudy : null
    },
    closeForDeletedReference: function () {
      if (this.editingRef !== null) {
        this.resetRowEditor()
        return
      }
      this.isRowReadOnly = true
      this.$refs['modal-extracted-data-remove-data-item'].hide()
      if (this.hiddenWontArrive()) this.onRowEditorHidden()
    },
    onRowEditorHidden: function () {
      this.closingInFlight = false
      // BootstrapVue emits `hidden` asynchronously: a late one belongs to the previous
      // session, and releasing now would leave the open editor without its lock.
      if (this.staleHiddenPending) {
        this.staleHiddenPending = false
        return
      }
      this.resetRowEditor()
    },
    // Closes whichever editor is open (the row in place or the clear-row confirmation) and
    // gives its lock back.
    resetRowEditor: function () {
      this.editingRef = null
      this.buffer_extracted_data_items = {}
      this.rowVersionConflict = false
      this.removeRef = null
      this.rowEditorOpen = false
      this.rowEditorStudy = null
      this.releaseRowLock()
      this.isRowReadOnly = false
      this.rowLockedBy = null
      this.rowLockLostReason = null
      this.rowLockDeniedReason = null
    },
    extractedDataRemoveDataItem: function () {
      // Granular reset: blank this row's data columns (keep ref_id + authors) via the
      // /item/<ref_id> sub-resource. No $pull, no whole-array rewrite (endpoint C).
      const item = this.rowOf(this.removeRef)
      // Writing without this row's lock is a guaranteed 409.
      if (this.isRowReadOnly || !item) return Promise.resolve(false)
      // La fila se arma con las claves que el reset escribe, no con un spread del ítem: lo
      // que se borra son las columnas de datos. Pero el `_v` no es una columna de datos —
      // es la metadata con la que el servidor comprueba que nadie escribió mientras tanto—,
      // así que se copia aparte. Sin él este PATCH pasa por el camino tolerado: entra igual
      // y la comprobación se pierde en silencio.
      const row = copyItemMetadata({ ref_id: item.ref_id, authors: item.authors, column_0: '' }, item)

      return Api.patch(`/isoqf_extracted_data/${this.localExtractedData.id}/item/${item.ref_id}`, row)
        .then(() => {
          this.$emit('getExtractedData', true)
          return true
        })
        .catch((error) => this.onRowWriteError(error))
    },
    saveDataExtractedData: function () {
      // Granular save: PATCH only the edited row via the /item/<ref_id> sub-resource,
      // so concurrent edits to other rows are not overwritten (endpoint C).
      const _item = JSON.parse(JSON.stringify(this.buffer_extracted_data_items))
      // Writing without this row's lock is a guaranteed 409.
      if (this.isRowReadOnly) return Promise.resolve(false)
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
          return true
        })
        .catch((error) => this.onRowWriteError(error, { inPlace: true }))
    },
    /**
     * The editor stays open with the text when a write fails (see saveRowEdit and
     * confirmRowWrite); the failure is still announced by toast. Always resolves to `false`.
     * A lock rejection is already toasted by the Api interceptor (OfflineIndicator):
     * here the editor only turns read-only, so the text can be copied but a retry
     * does not repeat the same 409.
     */
    onRowWriteError: function (error, { inPlace = false } = {}) {
      this.$emit('printErrors', error)
      if (isLockRejection(error)) {
        const data = (error.response && error.response.data) || {}
        this.isRowReadOnly = true
        this.rowLockedBy = data.locked_by || null
        this.rowLockLostReason = data.reason || null
        return false
      }
      // La fila cambió desde que se leyó. Con el editor en la fila, es un estado de esa
      // fila: cartel ahí, y el texto se queda hasta que la persona elija recargar.
      if (inPlace && isVersionRejection(error)) {
        this.rowVersionConflict = true
        return false
      }
      if (!this.$notify) return false
      // Al borrar: se trae al día para que la persona, al reabrir, parta de lo que guardó la otra.
      if (isVersionRejection(error)) {
        this.$emit('getExtractedData', true)
        this.$notify.warning(this.$t('version_conflict.reloaded'))
        return false
      }
      const key = writeErrorMessageKey(error, 'notifications.save_error')
      if (key) this.$notify.error(this.$t(key))
      return false
    }
  },
  mounted () {
    this.localExtractedData = this.extractedData
    window.addEventListener('ref-lock-lost', this.onRefLockLost)
  },
  beforeDestroy () {
    window.removeEventListener('ref-lock-lost', this.onRefLockLost)
    // An editor left open, or a modal whose `hidden` never came (see onRowEditorHidden).
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
