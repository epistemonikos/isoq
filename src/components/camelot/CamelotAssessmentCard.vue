<template>
  <b-card :id="`field-${metaIndex}-${itemIndex}`" class="mb-3 item-card" header-tag="header">
    <template #header>
      <div class="d-flex justify-content-between align-items-end">
        <h4 class="mb-0 font-weight-bold">
          {{ label }}
          <b-tooltip :target='`data-missing-${metaIndex}-${itemIndex}`'>
            {{ $t('camelot.step_four.data_missing') }}
          </b-tooltip>
          <font-awesome-icon v-if="isExclamationActive" icon="exclamation-circle" class="text-danger ml-1"
            :id='`data-missing-${metaIndex}-${itemIndex}`' />
        </h4>
      </div>
    </template>

    <!-- Extracted Data section -->
    <div class="field-section mb-3">
      <div class="d-flex justify-content-between align-items-center pb-1 border-bottom">
        <h5 class="small m-0 pb-1">{{ $t('camelot.step_four.common.extracted_data') }}</h5>
        <b-button v-if="!isEditing('extractedData')" size="sm" variant="outline-primary" class="edit-btn-thin"
          @click="startEditing('extractedData')">
          {{ $t('common.edit') }} <font-awesome-icon icon="edit" class="ml-1" />
        </b-button>
      </div>

      <template v-if="isEditing('extractedData')">
        <b-form-textarea v-model="editValue" size="sm" rows="3" class="mb-2" @input="onInput"></b-form-textarea>
        <b-alert show variant="danger" class="mb-2 small not-completed-alert">
          <div class="alert-strip"></div>
          <div class="alert-content">{{ $t('camelot.step_four.inline_edit.warning') }}</div>
        </b-alert>
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span v-if="autoSaveStatus === 'saving'" class="text-muted small">
            <b-spinner small></b-spinner> {{ $t('common.auto_saving') }}
          </span>
          <span v-else-if="autoSaveStatus === 'saved'" class="text-success small">
            <font-awesome-icon icon="check"></font-awesome-icon> {{ $t('common.auto_saved') }}
          </span>
          <span v-else></span>
          <div>
            <b-button size="sm" variant="danger" @click="cancelEditing" class="mr-2">{{ $t('common.cancel') }}</b-button>
            <b-button size="sm" variant="primary" :disabled="isSaving" @click="saveField">
              <b-spinner small v-if="isSaving"></b-spinner>
              {{ $t('common.save') }}
            </b-button>
          </div>
        </div>
      </template>
      <template v-else>
        <p v-if="extractedData" class="mt-2 mb-0 text-wrap-pre">{{ extractedData }}</p>
        <b-alert v-else show variant="warning" class="mt-2 mb-0 small not-completed-alert">
          <div class="alert-strip"></div>
          <div class="alert-content">{{ $t('common.not_completed') }}</div>
        </b-alert>
      </template>
    </div>

    <!-- Concerns section -->
    <div class="field-section">
      <div class="d-flex justify-content-between align-items-center pb-1 border-bottom">
        <h5 class="small m-0">{{ $t('camelot.step_four.common.concerns') }}</h5>
        <b-button v-if="!isEditing('concerns')" size="sm" variant="outline-primary" class="edit-btn-thin"
          @click="startEditing('concerns')">
          {{ $t('common.edit') }} <font-awesome-icon icon="edit" class="ml-1" />
        </b-button>
      </div>

      <template v-if="isEditing('concerns')">
        <b-form-textarea v-model="editValue" size="sm" rows="3" class="mb-2" @input="onInput"></b-form-textarea>
        <b-alert show variant="danger" class="mb-2 small not-completed-alert">
          <div class="alert-strip"></div>
          <div class="alert-content">{{ $t('camelot.step_four.inline_edit.warning') }}</div>
        </b-alert>
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span v-if="autoSaveStatus === 'saving'" class="text-muted small">
            <b-spinner small></b-spinner> {{ $t('common.auto_saving') }}
          </span>
          <span v-else-if="autoSaveStatus === 'saved'" class="text-success small">
            <font-awesome-icon icon="check"></font-awesome-icon> {{ $t('common.auto_saved') }}
          </span>
          <span v-else></span>
          <div>
            <b-button size="sm" variant="danger" @click="cancelEditing" class="mr-2">{{ $t('common.cancel') }}</b-button>
            <b-button size="sm" variant="primary" :disabled="isSaving" @click="saveField">
              <b-spinner small v-if="isSaving"></b-spinner>
              {{ $t('common.save') }}
            </b-button>
          </div>
        </div>
      </template>
      <template v-else>
        <p v-if="concerns" class="mt-2 mb-0 text-wrap-pre">{{ concerns }}</p>
        <b-alert v-else show variant="warning" class="mt-2 mb-0 small not-completed-alert">
          <div class="alert-strip"></div>
          <div class="alert-content">{{ $t('common.not_completed') }}</div>
        </b-alert>
      </template>
    </div>
  </b-card>
</template>

<script>
import _debounce from 'lodash.debounce'

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
      editValue: '',
      autoSaveStatus: null
    }
  },
  created() {
    this.autoSaveDebounced = _debounce(function () {
      this.$emit('auto-save-field', this.editValue)
    }.bind(this), 1500)
  },
  watch: {
    editingField: {
      handler(newVal) {
        if (newVal.metaIndex === this.metaIndex && newVal.itemIndex === this.itemIndex && newVal.type) {
          this.editValue = newVal.type === 'extractedData' ? this.extractedData : this.concerns
        }
      },
      deep: true
    },
    isSaving(newVal, oldVal) {
      if (oldVal === true && newVal === false && this.autoSaveStatus === 'saving') {
        this.autoSaveStatus = 'saved'
        setTimeout(() => { this.autoSaveStatus = null }, 2000)
      }
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
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.autoSaveStatus = null
      this.$emit('cancel-editing')
    },
    saveField() {
      if (this.autoSaveDebounced) this.autoSaveDebounced.cancel()
      this.autoSaveStatus = null
      this.$emit('save-field', this.editValue)
    },
    onInput() {
      this.autoSaveStatus = 'saving'
      this.autoSaveDebounced()
    }
  }
}
</script>
