<template>
  <div class="d-inline-block">
    <b-button
      variant="outline-primary"
      size="sm"
      @click="openColumnsModal">
      <i class="fas fa-columns mr-1"></i>
      {{ $t('camelot.step_three.add_edit_columns') }}
    </b-button>

    <!-- Modal para gestionar columnas personalizadas -->
    <b-modal
      id="modal-manage-columns"
      ref="modal-manage-columns"
      :title="$t('camelot.step_three.columns_modal.title')"
      size="lg"
      @ok="handleSaveColumns"
      @hide="resetColumnsModal">
      <p class="text-muted mb-3">{{ $t('camelot.step_three.columns_modal.description') }}</p>
      
      <CustomFieldsManager
        v-model="columnDefinitions"
        :with-values="false"
        :show-header="false"
        :add-button-text="$t('camelot.step_three.columns_modal.add_column')"
        :empty-text="$t('camelot.step_three.columns_modal.no_columns')"
        :move-instruction-text="$t('camelot.step_three.modal.move_instruction')"
        :move-button-text="$t('camelot.step_three.modal.move_button')"
        :delete-button-text="$t('camelot.step_three.delete_button')"
        :label-text="$t('camelot.step_three.columns_modal.column_name')"
        :placeholder-label="$t('camelot.step_three.columns_modal.column_name_placeholder')"
        id-prefix="column-def-"
      />

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
import { isCustomField, extractCustomFields, cleanOrphanedCustomFieldKeys } from '@/utils/customFieldsHelper'

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
    visibleColumnKeys: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      columnDefinitions: [],
      isSavingColumns: false
    }
  },
  methods: {
    getCustomFields () {
      return extractCustomFields(this.charsData.fields)
    },
    openColumnsModal () {
      const customFields = this.getCustomFields()
      this.columnDefinitions = customFields.map(field => ({
        key: field.key,
        label: field.label
      }))
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
      if (bvModalEvt) {
        bvModalEvt.preventDefault()
      }
      
      if (this.isSavingColumns) {
        return
      }
      
      this.isSavingColumns = true
      
      const nonCustomFields = this.charsData.fields.filter(field => !isCustomField(field.key))
      
      const newCustomFields = this.columnDefinitions
        .filter(col => col.label && col.label.trim() !== '')
        .map(col => ({
          key: col.key || `column_${Date.now()}_${Math.random()}`,
          label: col.label.trim()
        }))
      
      const updatedFields = [...nonCustomFields, ...newCustomFields]
      const cleanedItems = cleanOrphanedCustomFieldKeys(this.charsData.items || [], updatedFields)
      
      const dataToSave = {
        fields: updatedFields,
        items: cleanedItems,
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
          
          // Logic for updating visible columns
          const newVisibleKeys = [...this.visibleColumnKeys]
          if (updatedData.fields) {
            const newIds = updatedData.fields
              .filter(f => f.key !== 'authors' && f.key !== 'actions' && !newVisibleKeys.includes(f.key))
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
