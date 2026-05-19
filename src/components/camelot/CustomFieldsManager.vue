<template>
  <div class="custom-fields-manager">
    <div class="d-flex justify-content-between align-items-center mb-2" v-if="showHeader">
      <h5 class="mb-0">{{ title }}</h5>
      <b-button
        v-if="showAddButton"
        size="sm"
        variant="success"
        @click="addField">
        <i class="fas fa-plus"></i> {{ addButtonText }}
      </b-button>
    </div>

    <div class="mb-3" v-else-if="showAddButton">
      <b-button
        size="sm"
        variant="success"
        @click="addField">
        <font-awesome-icon icon="plus"></font-awesome-icon> {{ addButtonText }}
      </b-button>
    </div>

    <b-card v-if="localFields.length === 0" body-class="text-center py-3">
      <p class="mb-0 text-muted">{{ emptyText }}</p>
    </b-card>

    <div v-else class="custom-fields-container">
      <p class="text-muted small mb-2" v-if="showMoveInstruction">
        <i class="fas fa-arrows-alt mr-1"></i>{{ moveInstructionText }}
      </p>
      
      <draggable
        v-model="localFields"
        handle=".drag-handle"
        ghost-class="ghost"
        animation="300"
        @start="onDragStart"
        @end="onDragEnd">
        <div
          v-for="(field, index) in localFields"
          :key="field.id || 'field-' + index"
          class="mb-3">
          <div :id="idPrefix + index">
            <b-card>
              <!-- Header with drag handle and remove button -->
              <div class="d-flex justify-content-between mb-2">
                <div class="d-flex align-items-center">
                  <label v-if="!field.isCamelot" :for="idPrefix + 'label-' + index" class="mb-0">{{ labelText }}</label>
                  <strong v-else class="mb-0" style="font-size: 1.1em; color: var(--camelot-label-color, #333);">
                    {{ field.categoryLabel || field.label }}
                    <font-awesome-icon 
                      icon="info-circle" 
                      class="ml-1 text-info" 
                      style="cursor: pointer; font-size: 0.8em;"
                      @click="showGuidance(field)"
                    />
                  </strong>
                </div>
                <div>
                  <b-button
                    size="sm"
                    variant="outline-secondary"
                    class="drag-handle mr-1 py-0"
                    style="cursor: move;">
                    <font-awesome-icon icon="grip-vertical" class="mr-1"></font-awesome-icon> {{ moveButtonText }}
                  </b-button>
                  <b-button
                    v-if="!field.locked"
                    size="sm"
                    variant="danger"
                    @click="removeField(index)"
                    class="py-0">
                    <font-awesome-icon icon="trash" class="mr-1"></font-awesome-icon> {{ deleteButtonText }}
                  </b-button>
                </div>
              </div>

              <!-- Title/Label Input -->
              <b-form-group
                v-if="!field.isCamelot"
                :label-for="idPrefix + 'label-' + index"
                :state="getLabelState(field)"
                class="mb-2">
                <b-form-input
                  :id="idPrefix + 'label-' + index"
                  v-model="field.label"
                  :placeholder="placeholderLabel"
                  :disabled="field.locked"
                  :state="getLabelState(field)"
                  @input="emitChange"
                  @blur="markLabelTouched(field.id)">
                </b-form-input>
                <b-form-invalid-feedback>{{ $t('common.field_required') }}</b-form-invalid-feedback>
              </b-form-group>

              <!-- Value Input (Optional) -->
              <template v-if="withValues">
                <label :for="idPrefix + 'value-' + index" :class="{'mt-2': field.isCamelot}">{{ field.isCamelot ? (field.extractedDataLabel || contentLabelText) : contentLabelText }}</label>
                <b-form-textarea
                  :id="idPrefix + 'value-' + index"
                  v-model="field.value"
                  :placeholder="placeholderValue"
                  rows="3"
                  @input="emitChange">
                </b-form-textarea>
                
                <!-- Comments Input (Optional for Camelot pairs) -->
                <template v-if="field.hasComments">
                  <label :for="idPrefix + 'comments-' + index" class="mt-2">{{ field.commentsLabel || $t('camelot.step_three.concerns_label') || 'Comments' }}</label>
                  <b-form-textarea
                    :id="idPrefix + 'comments-' + index"
                    v-model="field.commentsValue"
                    :placeholder="$t('camelot.step_three.modal.field_content_placeholder')"
                    rows="2"
                    @input="emitChange">
                  </b-form-textarea>
                </template>
              </template>
            </b-card>
          </div>
        </div>
      </draggable>
    </div>

    <!-- CAMELOT Guidance Sidebar -->
    <b-sidebar
      v-model="isSidebarOpen"
      id="camelot-guidance-sidebar"
      :title="guidanceContent.title"
      right
      shadow
      width="400px"
      backdrop
      no-header-close
    >
      <div class="px-3 py-2" v-if="selectedGuidanceField">
        <section class="mb-4">
          <h6 class="text-primary font-weight-bold">{{ $t('camelot.guidance_labels.definition') }}</h6>
          <div v-html="guidanceContent.definition"></div>
        </section>

        <section class="mb-4">
          <h6 class="text-primary font-weight-bold">{{ $t('camelot.guidance_labels.what_to_do') }}</h6>
          <div v-html="guidanceContent.what_to_do"></div>
        </section>

        <section class="mb-4">
          <h6 class="text-primary font-weight-bold">{{ $t('camelot.guidance_labels.tips') }}</h6>
          <div v-html="guidanceContent.tips"></div>
        </section>

        <section class="mb-4">
          <h6 class="text-primary font-weight-bold">{{ $t('camelot.guidance_labels.examples') }}</h6>
          <div v-html="guidanceContent.examples"></div>
        </section>
      </div>
    </b-sidebar>
  </div>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'CustomFieldsManager',
  components: {
    draggable
  },
  model: {
    prop: 'fields',
    event: 'input'
  },
  props: {
    fields: {
      type: Array,
      default: () => []
    },
    withValues: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    addButtonText: {
      type: String,
      default: 'Add Field'
    },
    emptyText: {
      type: String,
      default: 'No fields added'
    },
    moveInstructionText: {
      type: String,
      default: 'Drag and drop to reorder'
    },
    moveButtonText: {
      type: String,
      default: 'Move'
    },
    deleteButtonText: {
      type: String,
      default: 'Delete'
    },
    labelText: {
      type: String,
      default: 'Title'
    },
    contentLabelText: {
      type: String,
      default: 'Content'
    },
    placeholderLabel: {
      type: String,
      default: 'Enter title'
    },
    placeholderValue: {
      type: String,
      default: 'Enter content'
    },
    showAddButton: {
      type: Boolean,
      default: true
    },
    showMoveInstruction: {
      type: Boolean,
      default: true
    },
    idPrefix: {
      type: String,
      default: 'field-'
    }
  },
  data() {
    return {
      localFields: [],
      drag: false,
      isSidebarOpen: false,
      selectedGuidanceField: null,
      touchedLabelIds: []
    }
  },
  computed: {
    guidanceContent() {
      if (!this.selectedGuidanceField) return {}
      return {
        title: this.$t(`camelot.guidance.${this.selectedGuidanceField}.title`),
        definition: this.$t(`camelot.guidance.${this.selectedGuidanceField}.definition`),
        what_to_do: this.$t(`camelot.guidance.${this.selectedGuidanceField}.what_to_do`),
        tips: this.$t(`camelot.guidance.${this.selectedGuidanceField}.tips`),
        examples: this.$t(`camelot.guidance.${this.selectedGuidanceField}.examples`)
      }
    }
  },
  watch: {
    fields: {
      handler(newFields) {
        // Deep copy to avoid mutating prop directly
        // Ensure each field has an ID for :key binding in v-for to prevent rendering issues
        this.localFields = JSON.parse(JSON.stringify(newFields)).map((field, index) => {
          if (!field.id) {
            field.id = `field_${Date.now()}_${index}`
          }
          return field
        })
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    addField() {
      const newField = {
        id: `field_${Date.now()}`,
        label: '',
        value: ''
      }
      this.localFields.unshift(newField)
      this.emitChange()
      
      // Scroll to new field and focus
      this.$nextTick(() => {
        const index = 0
        const element = document.getElementById(this.idPrefix + index)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Highlight animation
          element.classList.add('highlight-new-field')
          setTimeout(() => {
            element.classList.remove('highlight-new-field')
          }, 2000)
          
          // Focus input
          const input = document.getElementById(this.idPrefix + 'label-' + index)
          if (input) input.focus()
        }
      })
    },
    removeField(index) {
      const removed = this.localFields[index]
      if (removed && removed.id) {
        const i = this.touchedLabelIds.indexOf(removed.id)
        if (i !== -1) this.touchedLabelIds.splice(i, 1)
      }
      this.localFields.splice(index, 1)
      this.emitChange()
    },
    markLabelTouched(id) {
      if (id && !this.touchedLabelIds.includes(id)) {
        this.touchedLabelIds.push(id)
      }
    },
    getLabelState(field) {
      if (!this.touchedLabelIds.includes(field.id)) return null
      return field.label && field.label.trim().length > 0 ? null : false
    },
    onDragStart() {
      this.drag = true
      document.body.classList.add('dragging-active')
    },
    onDragEnd() {
      this.drag = false
      document.body.classList.remove('dragging-active')
      this.emitChange()
    },
    showGuidance(field) {
      if (!field || !field.key) return

      // Map field keys like "research_extractedData" or "research_comments" to "research"
      const domainMap = {
        'research': 'research',
        'stakeholders': 'stakeholders',
        'researchers': 'researchers',
        'context': 'context',
        'strategy': 'strategy',
        'theory': 'theory',
        'ethical': 'ethical',
        'equity': 'equity',
        'participant': 'participant',
        'data': 'data',
        'analysis': 'analysis',
        'presentation': 'presentation'
      }

      const keyPrefix = field.key.split('_')[0]
      if (domainMap[keyPrefix]) {
        this.selectedGuidanceField = domainMap[keyPrefix]
        this.isSidebarOpen = true
      }
    },
    emitChange() {
      this.$emit('change', this.localFields)
      this.$emit('input', this.localFields) // Support v-model
    }
  }
}
</script>

<style scoped>
.drag-handle {
  cursor: move;
}

.ghost {
  opacity: 0.6;
  background: #c8ebfb;
  border: 2px dashed #2196F3;
}

.sortable-chosen {
  background-color: #f5f5f5;
  box-shadow: 0 0 8px rgba(0,0,0,0.1);
}

.highlight-new-field {
  animation: highlightBackground 2s ease-out;
}

@keyframes highlightBackground {
  0% { background-color: rgba(40, 167, 69, 0.2); }
  50% { background-color: rgba(40, 167, 69, 0.1); }
  100% { background-color: transparent; }
}

#camelot-guidance-sidebar >>> ul {
  padding-left: 1.2rem;
}
</style>
