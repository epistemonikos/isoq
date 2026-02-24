<template>
  <div class="custom-fields-manager">
    <div class="d-flex justify-content-between align-items-center mb-2" v-if="showHeader">
      <h5 class="mb-0">{{ title }}</h5>
      <b-button
        size="sm"
        variant="success"
        @click="addField">
        <i class="fas fa-plus"></i> {{ addButtonText }}
      </b-button>
    </div>

    <div class="mb-3" v-else>
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
                  <label :for="idPrefix + 'label-' + index" class="mb-0">{{ labelText }}</label>
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
                :label-for="idPrefix + 'label-' + index"
                class="mb-2">
                <b-form-input
                  :id="idPrefix + 'label-' + index"
                  v-model="field.label"
                  :placeholder="placeholderLabel"
                  @input="emitChange">
                </b-form-input>
              </b-form-group>

              <!-- Value Input (Optional) -->
              <template v-if="withValues">
                <label :for="idPrefix + 'value-' + index">{{ contentLabelText }}</label>
                <b-form-textarea
                  :id="idPrefix + 'value-' + index"
                  v-model="field.value"
                  :placeholder="placeholderValue"
                  rows="3"
                  @input="emitChange">
                </b-form-textarea>
              </template>
            </b-card>
          </div>
        </div>
      </draggable>
    </div>
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
      drag: false
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
      this.localFields.push(newField)
      this.emitChange()
      
      // Scroll to new field and focus
      this.$nextTick(() => {
        const index = this.localFields.length - 1
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
      this.localFields.splice(index, 1)
      this.emitChange()
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
</style>
