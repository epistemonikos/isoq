<template>
  <div class="d-inline-block">
    <b-button v-if="canEdit" variant="primary" size="sm" @click="openColumnsModal">
      {{ $t('camelot.step_three.add_edit_columns') }}
      <font-awesome-icon icon="plus" class="ml-1" />
    </b-button>

    <!-- Modal para gestionar columnas personalizadas -->
    <b-modal id="modal-manage-columns" ref="modal-manage-columns" :title="$t('camelot.step_three.columns_modal.title')"
      size="lg" @ok="handleSaveColumns" @hide="resetColumnsModal">
      <p class="text-muted mb-3">{{ $t('camelot.step_three.columns_modal.description') }}</p>

      <CustomFieldsManager v-model="columnDefinitions" :with-values="false" :show-header="false"
        :add-button-text="$t('camelot.step_three.columns_modal.add_column')"
        :empty-text="$t('camelot.step_three.columns_modal.no_columns')"
        :move-instruction-text="$t('camelot.step_three.modal.move_instruction')"
        :move-button-text="$t('camelot.step_three.modal.move_button')"
        :delete-button-text="$t('camelot.step_three.delete_button')"
        :label-text="$t('camelot.step_three.columns_modal.column_name')"
        :placeholder-label="$t('camelot.step_three.columns_modal.column_name_placeholder')" id-prefix="column-def-" />

      <template #modal-footer>
        <b-button variant="secondary" @click="closeColumnsModal" :disabled="isSavingColumns">
          {{ $t('common.cancel') }}
        </b-button>
        <b-button variant="primary" @click="handleSaveColumns" :disabled="isSavingColumns">
          <b-spinner small v-if="isSavingColumns"></b-spinner>
          <font-awesome-icon v-else icon="save"></font-awesome-icon>
          {{ $t('camelot.step_three.columns_modal.save_changes') }}
        </b-button>
      </template>
    </b-modal>
  </div>
</template>

<script>
import Api from '@/utils/Api'

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
      isSavingColumns: false
    }
  },
  methods: {
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
    },
    handleSaveColumns (bvModalEvt) {
      if (!this.canEdit) {
        if (bvModalEvt) bvModalEvt.preventDefault()
        return
      }
      if (bvModalEvt) {
        bvModalEvt.preventDefault()
      }

      if (this.isSavingColumns) {
        return
      }

      this.isSavingColumns = true

      const systemFields = (this.charsData.fields || []).filter(field =>
        ['authors', 'ref_id', 'actions', 'edit'].includes(field.key)
      )

      const newFields = []
      for (const col of this.columnDefinitions) {
        if (!col.label || col.label.trim() === '') continue

        if (col.isCamelot) {
          const extDataField = this.charsData.fields.find(f => f.key === col.key)
          if (extDataField) newFields.push(extDataField)

          const commentsKey = col.key.replace('_extractedData', '_comments')
          const commentsField = this.charsData.fields.find(f => f.key === commentsKey)
          if (commentsField) newFields.push(commentsField)
        } else {
          newFields.push({
            key: col.key || `column_${Date.now()}_${Math.random().toString().replace('.', '')}`,
            label: col.label.trim()
          })
        }
      }

      const updatedFields = [...systemFields, ...newFields]

      // The rows are deliberately NOT sent. Sending them meant filtering every row
      // against this local copy of `fields`, so a column created by somebody else
      // while this modal was open was missing from the copy and its content was
      // wiped from every row. The generic PATCH is a partial $set of top-level keys,
      // so omitting `items` leaves the stored rows untouched — and what does not
      // travel cannot be lost.
      const dataToSave = {
        fields: updatedFields,
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }

      const savePromise = (this.charsData.id || this.charsData._id)
        ? Api.patch(`/isoqf_characteristics/${this.charsData.id || this.charsData._id}`, dataToSave)
        : Api.post('/isoqf_characteristics/', dataToSave)

      savePromise
        .then(response => {
          const responseData = response.data.$set || response.data
          const updatedData = {
            ...responseData,
            id: response.data.id || this.charsData.id,
            _id: response.data._id || this.charsData._id
          }

          this.$emit('saved', updatedData)

          // Logic for updating visible columns: only add truly NEW columns
          const newVisibleKeys = [...this.visibleColumnKeys]
          const oldFieldKeys = this.charsData.fields ? this.charsData.fields.map(f => f.key) : []

          if (updatedData.fields) {
            const newIds = updatedData.fields
              .filter(f =>
                f.key !== 'authors' &&
                f.key !== 'ref_id' &&
                f.key !== 'actions' &&
                !oldFieldKeys.includes(f.key) // Only if it wasn't there before
              )
              .map(f => f.key)

            if (newIds.length > 0) {
              this.$emit('update:visibleColumnKeys', [...newVisibleKeys, ...newIds])
            }
          }

          this.isSavingColumns = false
          this.$bvModal.hide('modal-manage-columns')

          this.$nextTick(() => {
            setTimeout(() => {
              const successMsg = (this.charsData.id || this.charsData._id)
                ? 'camelot.step_three.columns_modal.success_update'
                : 'camelot.step_three.columns_modal.success_create'

              this.$bvToast.toast(this.$t(successMsg), {
                title: this.$t('camelot.step_three.columns_modal.toast_success_title'),
                variant: 'success',
                solid: true,
                autoHideDelay: 3000
              })
            }, 100)
          })
        })
        .catch(error => {
          console.error('Error saving columns:', error)
          this.isSavingColumns = false
          this.$bvToast.toast(this.$t('camelot.step_three.columns_modal.error_update'), {
            title: this.$t('camelot.step_three.columns_modal.toast_error_title'),
            variant: 'danger',
            solid: true
          })
        })
    }
  }
}
</script>
