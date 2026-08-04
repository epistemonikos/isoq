<template>
  <div class="d-inline-block">
    <b-button v-if="canEdit" variant="primary" size="sm" @click="openColumnsModal">
      {{ $t('camelot.step_three.add_edit_columns') }}
      <font-awesome-icon icon="plus" class="ml-1" />
    </b-button>

    <!-- Modal para gestionar columnas personalizadas -->
    <b-modal id="modal-manage-columns" ref="modal-manage-columns" :title="$t('camelot.step_three.columns_modal.title')"
      size="lg" @hidden="onModalHidden">
      <p class="text-muted mb-2">{{ $t('camelot.step_three.columns_modal.description') }}</p>
      <!-- Cada cambio se guarda solo, así que conviene decirlo: sin botón de guardar, el
           usuario no tiene forma de saber cuándo se aplicó lo que hizo. -->
      <p class="text-muted small mb-3">
        <font-awesome-icon icon="info-circle" class="mr-1" />
        {{ $t('camelot.step_three.columns_modal.autosave_hint') }}
        <b-spinner small v-if="isSavingColumns" class="ml-1"></b-spinner>
      </p>

      <CustomFieldsManager v-model="columnDefinitions" :with-values="false" :show-header="false"
        confirm-remove
        @field-committed="onFieldCommitted"
        @remove-requested="onRemoveRequested"
        @order-changed="onOrderChanged"
        :add-button-text="$t('camelot.step_three.columns_modal.add_column')"
        :empty-text="$t('camelot.step_three.columns_modal.no_columns')"
        :move-instruction-text="$t('camelot.step_three.modal.move_instruction')"
        :move-button-text="$t('camelot.step_three.modal.move_button')"
        :delete-button-text="$t('camelot.step_three.delete_button')"
        :label-text="$t('camelot.step_three.columns_modal.column_name')"
        :placeholder-label="$t('camelot.step_three.columns_modal.column_name_placeholder')" id-prefix="column-def-" />

      <template #modal-footer>
        <!-- "Cancelar" sería una promesa falsa: lo que se aplicó no se puede deshacer. -->
        <b-button variant="secondary" @click="closeColumnsModal" :disabled="isSavingColumns">
          {{ $t('common.close') }}
        </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script>
import columnService from '@/services/columnService'
import LockService from '@/services/lockService'

const COLLECTION = 'isoqf_characteristics'

export default {
  name: 'ManageColumnsButton',
  components: {
    CustomFieldsManager: () => import('./CustomFieldsManager.vue')
  },
  props: {
    charsData: {
      type: Object,
      required: true
    },
    camelot: {
      type: Object,
      default: () => ({ categories: [] })
    },
    visibleColumnKeys: {
      type: Array,
      required: true
    },
    canEdit: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      columnDefinitions: [],
      isSavingColumns: false,
      // El reorden es lo único que se acumula: es conmutativo (el backend acepta `order`
      // como subconjunto), así que mandarlo una vez al cerrar equivale a mandarlo en cada
      // arrastre y le ahorra un request a cada alta.
      pendingOrder: null,
      columnsLockHeld: false,
      // Id del documento creado en esta sesión del modal, cuando el proyecto no tenía uno.
      resolvedDocumentId: null
    }
  },
  computed: {
    documentId () {
      return this.charsData.id || this.charsData._id || this.resolvedDocumentId || null
    }
  },
  methods: {
    /**
     * En CAMELOT las filas son virtuales, así que un proyecto puede llegar al Paso 3 sin
     * documento de tabla: nada lo crea hasta que alguien escribe. Los endpoints granulares
     * necesitan un `<doc_id>`, así que la primera operación lo resuelve.
     */
    async resolveDocumentId () {
      if (this.documentId) return this.documentId

      const id = await columnService.ensureTableDocument(
        COLLECTION, this.$route.params.org_id, this.$route.params.id
      )
      if (id) this.resolvedDocumentId = id
      return id
    },
    /**
     * Los cuatro endpoints exigen el lock del documento cuando la concurrencia está
     * encendida. Se toma al primer cambio real y no al abrir el modal: quien sólo fue a
     * mirar las columnas no debe bloquear a nadie — el mismo criterio del Paso 4.
     */
    async ensureColumnsLock () {
      if (this.columnsLockHeld) return true

      const docId = await this.resolveDocumentId()
      if (!docId) return false

      const result = await LockService.acquireRef(this.$route.params.id, `${docId}::fields`)
      if (!result || !result.success) {
        this.notifyError('camelot.step_three.columns_modal.error_update')
        return false
      }

      this.columnsLockHeld = true
      return true
    },
    async onFieldCommitted (field) {
      if (!this.canEdit || !(await this.ensureColumnsLock())) return

      const label = (field.label || '').trim()
      this.isSavingColumns = true

      try {
        if (field.key) {
          const response = await columnService.renameColumn(
            COLLECTION, this.documentId, field.key, label
          )
          this.emitSaved(response)
        } else {
          const { key, response } = await columnService.addColumn(
            COLLECTION, this.documentId, label
          )
          // La clave tiene que quedar en el estado local: sin ella el reorden no puede
          // mencionar la columna y un segundo blur la crearía de nuevo.
          const local = this.columnDefinitions.find(col => col.id === field.id)
          if (local) this.$set(local, 'key', key)
          this.$emit('update:visibleColumnKeys', [...this.visibleColumnKeys, key])
          this.emitSaved(response)
        }
      } catch (error) {
        console.error('Error saving column:', error)
        this.notifyError('camelot.step_three.columns_modal.error_update')
      } finally {
        this.isSavingColumns = false
      }
    },
    async onRemoveRequested (field) {
      if (!this.canEdit) return

      // Una columna que nunca llegó al servidor no tiene nada que borrar allá.
      if (!field.key) {
        this.dropLocalColumn(field)
        return
      }

      const confirmed = await this.$bvModal.msgBoxConfirm(
        this.$t('camelot.step_three.columns_modal.confirm_delete', { name: field.label }),
        {
          title: this.$t('camelot.step_three.columns_modal.confirm_delete_title'),
          okVariant: 'danger',
          okTitle: this.$t('camelot.step_three.delete_button'),
          cancelTitle: this.$t('common.cancel'),
          centered: true
        }
      )
      if (!confirmed) return
      if (!(await this.ensureColumnsLock())) return

      this.isSavingColumns = true
      try {
        const response = await columnService.deleteColumn(COLLECTION, this.documentId, field.key)
        this.dropLocalColumn(field)
        this.emitSaved(response)
      } catch (error) {
        console.error('Error deleting column:', error)
        this.notifyError('camelot.step_three.columns_modal.error_update')
      } finally {
        this.isSavingColumns = false
      }
    },
    onOrderChanged (keys) {
      this.pendingOrder = keys
    },
    /**
     * Manda el orden acumulado. Las claves que ya no están en el estado local se
     * descartan: si otra persona borró una columna mientras el modal estaba abierto,
     * mencionarla sería un 400 por clave desconocida.
     */
    async flushPendingOrder () {
      if (!this.pendingOrder || !this.documentId) return

      const known = new Set(this.columnDefinitions.filter(col => col.key).map(col => col.key))
      const order = this.pendingOrder.filter(key => known.has(key))
      this.pendingOrder = null
      if (!order.length) return
      if (!(await this.ensureColumnsLock())) return

      try {
        this.emitSaved(await columnService.reorderColumns(COLLECTION, this.documentId, order))
      } catch (error) {
        console.error('Error reordering columns:', error)
        this.notifyError('camelot.step_three.columns_modal.error_update')
      }
    },
    async onModalHidden () {
      await this.flushPendingOrder()

      if (this.columnsLockHeld) {
        await LockService.releaseRef(`${this.documentId}::fields`)
        this.columnsLockHeld = false
      }
      this.resetColumnsModal()
    },
    dropLocalColumn (field) {
      this.columnDefinitions = this.columnDefinitions.filter(col => col.id !== field.id)
    },
    /** Cada respuesta trae el documento completo recargado, que es lo que el padre pinta. */
    emitSaved (response) {
      const data = response && response.data
      if (!data) return

      const payload = data.$set || data
      this.$emit('saved', {
        ...payload,
        id: data.id || this.charsData.id,
        _id: data._id || this.charsData._id
      })
    },
    notifyError (key) {
      this.$bvToast.toast(this.$t(key), {
        title: this.$t('camelot.step_three.columns_modal.toast_error_title'),
        variant: 'danger',
        solid: true
      })
    },
    openColumnsModal () {
      if (!this.canEdit) {
        return
      }
      this.columnDefinitions = []
      if (this.charsData && this.charsData.fields) {
        for (const field of this.charsData.fields) {
          if (['authors', 'ref_id', 'actions', 'edit'].includes(field.key)) continue
          if (field.key.endsWith('_comments')) continue

          const isCamelot = field.key.endsWith('_extractedData')
          let categoryLabel = ''
          let extractedDataLabel = ''
          let commentsLabel = ''

          if (isCamelot) {
            const commentsKey = field.key.replace('_extractedData', '_comments')
            categoryLabel = field.label
            extractedDataLabel = this.$t('camelot.step_three.modal.content_label')
            commentsLabel = this.$t('camelot.step_three.concerns_label') || 'Comments'

            if (this.camelot && this.camelot.categories) {
              const categoryMatch = this.camelot.categories.find(c => c.options && c.options.some(o => o.key === field.key))
              if (categoryMatch) {
                categoryLabel = categoryMatch.label
                const extOpt = categoryMatch.options.find(o => o.key === field.key)
                if (extOpt) extractedDataLabel = extOpt.label

                const concOpt = categoryMatch.options.find(o => o.key === commentsKey)
                if (concOpt) commentsLabel = concOpt.label
              }
            }
          }

          this.columnDefinitions.push({
            key: field.key,
            label: field.label,
            categoryLabel: categoryLabel,
            extractedDataLabel: extractedDataLabel,
            commentsLabel: commentsLabel,
            locked: isCamelot,
            isCamelot: isCamelot,
            hasComments: false // ManageColumnsButton uses with-values="false" so we don't need the comments textarea here
          })
        }
      }
      this.$bvModal.show('modal-manage-columns')
    },
    closeColumnsModal () {
      this.$bvModal.hide('modal-manage-columns')
    },
    resetColumnsModal () {
      this.columnDefinitions = []
      this.isSavingColumns = false
    }
  }
}
</script>
