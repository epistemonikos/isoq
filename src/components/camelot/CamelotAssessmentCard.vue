<template>
  <b-card :id="`field-${metaIndex}-${itemIndex}`" class="mb-3 item-card" header-tag="header">
    <template #header>
      <div class="d-flex justify-content-between align-items-end">
        <h4 class="mb-0 font-weight-bold">
          {{ itemIndex + 1 }} - {{ label }}
          <font-awesome-icon v-if="isExclamationActive" icon="exclamation-circle" class="text-danger ml-1" />
        </h4>
      </div>
    </template>

    <!-- Extracted Data section -->
    <div class="field-section mb-3">
      <div class="d-flex justify-content-between align-items-end mb-1">
        <h5 class="small text-muted mb-0">{{ $t('camelot.step_four.common.extracted_data') }}</h5>
        <b-button v-if="!isEditing('extractedData')"
          size="sm" variant="outline-primary" class="edit-btn-thin" @click="startEditing('extractedData')">
          {{ $t('common.edit') }} <font-awesome-icon icon="edit" class="ml-1" />
        </b-button>
      </div>
      
      <template v-if="isEditing('extractedData')">
        <b-form-textarea v-model="editValue" size="sm" rows="3" class="mb-2"></b-form-textarea>
        <b-alert show variant="danger" class="mb-2 small not-completed-alert">
          <div class="alert-strip"></div>
          <div class="alert-content">{{ $t('camelot.step_four.inline_edit.warning') }}</div>
        </b-alert>
        <div class="d-flex justify-content-end gap-2 mb-2">
          <b-button size="sm" variant="danger" @click="cancelEditing" class="mr-2">{{ $t('common.cancel') }}</b-button>
          <b-button size="sm" variant="primary" :disabled="isSaving" @click="saveField">
            <b-spinner small v-if="isSaving"></b-spinner>
            {{ $t('common.save') }}
          </b-button>
        </div>
      </template>
      <template v-else>
        <p v-if="extractedData" class="mb-0 text-wrap-pre">{{ extractedData }}</p>
        <b-alert v-else show variant="warning" class="mb-0 small not-completed-alert">
          <div class="alert-strip"></div>
          <div class="alert-content">{{ $t('common.not_completed') }}</div>
        </b-alert>
      </template>
    </div>

    <!-- Concerns section -->
    <div class="field-section">
      <div class="d-flex justify-content-between align-items-end mb-1">
        <h5 class="small text-muted mb-0">{{ $t('camelot.step_four.common.concerns') }}</h5>
        <b-button v-if="!isEditing('concerns')"
          size="sm" variant="outline-primary" class="edit-btn-thin" @click="startEditing('concerns')">
          {{ $t('common.edit') }} <font-awesome-icon icon="edit" class="ml-1" />
        </b-button>
      </div>

      <template v-if="isEditing('concerns')">
        <b-form-textarea v-model="editValue" size="sm" rows="3" class="mb-2"></b-form-textarea>
        <b-alert show variant="danger" class="mb-2 small not-completed-alert">
          <div class="alert-strip"></div>
          <div class="alert-content">{{ $t('camelot.step_four.inline_edit.warning') }}</div>
        </b-alert>
        <div class="d-flex justify-content-end gap-2 mb-2">
          <b-button size="sm" variant="danger" @click="cancelEditing" class="mr-2">{{ $t('common.cancel') }}</b-button>
          <b-button size="sm" variant="primary" :disabled="isSaving" @click="saveField">
            <b-spinner small v-if="isSaving"></b-spinner>
            {{ $t('common.save') }}
          </b-button>
        </div>
      </template>
      <template v-else>
        <p v-if="concerns" class="mb-0 text-wrap-pre">{{ concerns }}</p>
        <b-alert v-else show variant="warning" class="mb-0 small not-completed-alert">
          <div class="alert-strip"></div>
          <div class="alert-content">{{ $t('common.not_completed') }}</div>
        </b-alert>
      </template>
    </div>
  </b-card>
</template>

<script>
export default {
  name: 'CamelotAssessmentCard',
  props: {
    metaIndex: { type: Number, required: true },
    itemIndex: { type: Number, required: true },
    label: { type: String, required: true },
    extractedData: { type: String, default: '' },
    concerns: { type: String, default: '' },
    isExclamationActive: { type: Boolean, default: false },
    editingField: { type: Object, default: () => ({ metaIndex: null, itemIndex: null, type: null }) },
    isSaving: { type: Boolean, default: false }
  },
  data() {
    return {
      editValue: ''
    }
  },
  watch: {
    editingField: {
      handler(newVal) {
        if (newVal.metaIndex === this.metaIndex && newVal.itemIndex === this.itemIndex && newVal.type) {
          this.editValue = newVal.type === 'extractedData' ? this.extractedData : this.concerns
        }
      },
      deep: true
    }
  },
  methods: {
    isEditing(type) {
      return this.editingField.metaIndex === this.metaIndex && 
             this.editingField.itemIndex === this.itemIndex && 
             this.editingField.type === type
    },
    startEditing(type) {
      this.editValue = type === 'extractedData' ? this.extractedData : this.concerns
      this.$emit('start-editing', { metaIndex: this.metaIndex, itemIndex: this.itemIndex, type })
    },
    cancelEditing() {
      this.$emit('cancel-editing')
    },
    saveField() {
      this.$emit('save-field', this.editValue)
    }
  }
}
</script>
