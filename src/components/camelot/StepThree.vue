<template>
  <div>
    <b-alert show variant="info" v-if="isLoading">
      {{ $t('camelot.step_three.loading') }}
    </b-alert>
    <b-alert show variant="info" v-else-if="references.length === 0 && (!charsData.items || charsData.items.length === 0)">
      {{ $t('camelot.step_three.no_records') }}
    </b-alert>
    <div v-else>
      <!-- Checkbox para mostrar/ocultar Concerns -->
      <div class="mb-3">
        <b-form-checkbox
          v-model="showConcerns"
          @change="toggleConcerns">
          {{ $t('camelot.step_three.show_concerns') }}
        </b-form-checkbox>
      </div>

      <b-table
        :items="tableItems"
        :fields="tableFields"
        striped
        hover
        responsive>
        <template v-slot:cell(authors)="data">
          {{ formatAuthors(data.item) }}
        </template>

        <!-- Plantilla genérica para todos los campos -->
        <template v-slot:cell()="data">
          <!-- Para los campos personalizados, mostramos su contenido -->
          <span v-if="isCustomField(data.field.key)">
            {{ data.item[data.field.key] || '' }}
          </span>
          <!-- Para campos normales, mostramos el valor predeterminado -->
          <span v-else>{{ data.value }}</span>
        </template>

        <template v-slot:cell(actions)="data">
          <b-button
            size="sm"
            variant="primary"
            class="mr-1"
            @click="editReference(data.item)">
            {{ $t('camelot.step_three.edit_button') }}
          </b-button>
          <b-button
            size="sm"
            variant="danger"
            @click="deleteReference(data.item)">
            {{ $t('camelot.step_three.delete_button') }}
          </b-button>
        </template>
        <template v-slot:thead-top>
          <tr>
            <th colspan="1">{{ $t('camelot.step_three.references_header') }}</th>
            <th v-if="getCustomFields().length > 0"
              :colspan="getCustomFields().length"
              class="text-center">
              &nbsp;
            </th>
            <th v-for="category in camelot.categories"
              :key="category.key"
              :colspan="getVisibleCategoryOptions(category).length"
              class="text-center">
              {{ category.label }}
            </th>
            <th colspan="1">{{ $t('camelot.step_three.actions_header') }}</th>
          </tr>
        </template>
      </b-table>

      <!-- Modal para editar referencias -->
      <b-modal
        id="modal-edit-reference"
        :title="$t('camelot.step_three.modal.title')"
        size="xl"
        @ok="handleModalOk"
        @hide="resetModal">
        <template v-if="currentItem">
          <b-row>
            <!-- Menú flotante a la izquierda -->
            <b-col cols="3" class="menu-sidebar">
              <div class="sticky-menu p-2">
                <div class="menu-section mb-3" v-if="customFields.length > 0">
                  <div
                    v-for="(field, index) in customFields"
                    :key="'menu-custom-' + index"
                    class="menu-item"
                    @click="scrollToSection('custom-field-' + index)">
                    {{ field.title || 'Sin título' }}
                  </div>
                </div>

                <div class="menu-section">
                  <div class="menu-section-title mb-1">{{ $t('camelot.step_three.camelot_fields') }}</div>
                  <div
                    v-for="(category, catIndex) in camelot.categories"
                    :key="'menu-category-' + catIndex"
                    class="menu-item"
                    @click="scrollToSection('category-' + catIndex)">
                    {{ category.label }}
                  </div>
                </div>
              </div>
            </b-col>

            <!-- Contenido del formulario -->
            <b-col cols="9">
              <div id="authors-section" class="mb-3">
                <label for="authors">{{ $t('camelot.step_three.modal.reference_id_label') }}</label>
                <b-form-input
                  id="authors"
                  v-model="editForm.id"
                  :placeholder="$t('camelot.step_three.modal.authors_placeholder')">
                </b-form-input>
              </div>

              <!-- Campos personalizados -->
              <div class="mb-4">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h5 class="mb-0">{{ $t('camelot.step_three.modal.custom_fields_title') }}</h5>
                  <b-button
                    size="sm"
                    variant="success"
                    @click="addCustomField">
                    <i class="fas fa-plus"></i> {{ $t('camelot.step_three.modal.add_field_button') }}
                  </b-button>
                </div>
                <b-card v-if="customFields.length === 0" body-class="text-center py-3">
                  <p class="mb-0 text-muted">{{ $t('camelot.step_three.modal.no_custom_fields') }}</p>
                </b-card>
                <div v-else class="custom-fields-container">
                  <p class="text-muted small mb-2">
                    <i class="fas fa-arrows-alt mr-1"></i>{{ $t('camelot.step_three.modal.move_instruction') }}
                  </p>
                  <draggable
                    v-model="customFields"
                    :options="{handle:'.drag-handle'}"
                    ghost-class="ghost"
                    animation="300"
                    group="customFields"
                    drag-class="sortable-drag"
                    chosen-class="sortable-chosen"
                    @start="onDragStart"
                    @end="onDragEnd">
                    <div
                      v-for="(field, index) in customFields"
                      :key="'column_' + index"
                      class="mb-3">
                      <div :id="'column-field-' + index">
                        <b-card>
                          <div class="d-flex justify-content-between mb-2">
                            <div class="d-flex align-items-center">
                              <label :for="'column_' + index">{{ $t('camelot.step_three.modal.title_label') }}</label>
                            </div>
                            <div>
                              <b-button
                                size="sm"
                                variant="outline-secondary"
                                class="drag-handle mr-1 py-0">
                                <i class="fas fa-grip-vertical"></i> {{ $t('camelot.step_three.modal.move_button') }}
                              </b-button>
                              <b-button
                                size="sm"
                                variant="danger"
                                @click="removeCustomField(index)"
                                class="py-0">
                                <i class="fas fa-trash"></i> {{ $t('camelot.step_three.delete_button') }}
                              </b-button>
                            </div>
                          </div>
                          <b-form-input
                            :id="'label_' + index"
                            v-model="field.title"
                            :placeholder="$t('camelot.step_three.modal.field_title_placeholder')"
                            class="mb-2">
                          </b-form-input>
                          <label :for="'column_' + index">{{ $t('camelot.step_three.modal.content_label') }}</label>
                          <b-form-textarea
                            :id="'column_' + index"
                            v-model="field.value"
                            :placeholder="$t('camelot.step_three.modal.field_content_placeholder')"
                            rows="3">
                          </b-form-textarea>
                        </b-card>
                      </div>
                    </div>
                  </draggable>
                </div>
              </div>

              <h5 class="mt-4">{{ $t('camelot.step_three.modal.camelot_fields_title') }}</h5>
              <b-row>
                <b-col v-for="(category, catIndex) in camelot.categories"
                  :key="'category-' + catIndex"
                  :id="'category-' + catIndex"
                  cols="12"
                  class="mb-3">
                  <h6>{{ category.label }}</h6>
                  <b-card no-body class="mb-3">
                    <b-card-body>
                      <b-row>
                        <b-col v-for="(option, optIndex) in category.options"
                          :key="'option-' + catIndex + '-' + optIndex"
                          cols="12"
                          md="6"
                          class="mb-3">
                          <label :for="option.key">{{ option.label }}</label>
                          <b-form-textarea
                            :id="option.key"
                            v-model="editForm[option.key]"
                            :placeholder="option.label">
                          </b-form-textarea>
                        </b-col>
                      </b-row>
                    </b-card-body>
                  </b-card>
                </b-col>
              </b-row>
            </b-col>
          </b-row>
        </template>
        <template v-else>
          <b-alert show variant="info">{{ $t('camelot.step_three.modal.no_selection') }}</b-alert>
        </template>
      </b-modal>
    </div>
  </div>
</template>

<script>
import { camelotMixin } from '@/mixins/camelotMixin'
import draggable from 'vuedraggable'
import Api from '@/utils/Api'
import Commons from '@/utils/commons'
import { isCustomField, extractCustomFields, processCustomFields } from '@/utils/customFieldsHelper'

export default {
  name: 'StepThree',
  components: {
    draggable
  },
  mixins: [camelotMixin],
  props: {
    references: {
      type: Array,
      default: () => []
    },
    type: {
      type: String,
      default: 'isoqf_characteristics'
    }
  },
  data () {
    return {
      fields: [
        {
          key: 'authors',
          label: this.$t('camelot.step_three.authors_label')
        },
        {
          key: 'actions',
          label: this.$t('camelot.step_three.actions_header')
        }
      ],
      currentItem: null,
      editForm: {},
      customFields: [],
      drag: false,
      charsData: {
        fields: [],
        items: [],
        id: null,
        _id: null,
        organization: '',
        project_id: ''
      },
      isLoading: true,
      showConcerns: false
    }
  },
  computed: {
    tableItems () {
      // Always use references as base to ensure all are displayed
      const items = this.references.map(ref => {
        // Look for saved data for this reference
        let charItem = null
        if (this.charsData && this.charsData.items) {
          charItem = this.charsData.items.find(item => item.ref_id === ref.id)
        }

        // If there is data, merge it with the reference
        if (charItem) {
          return { ...ref, ...charItem }
        }

        // If not, return the reference as is
        return ref
      })

      // Sort alphabetically by authors field using format helper for consistency
      return items.sort((a, b) => {
        // Try to use processed format if possible, or raw if not
        const authorsA = this.formatAuthors(a).toLowerCase()
        const authorsB = this.formatAuthors(b).toLowerCase()
        return authorsA.localeCompare(authorsB)
      })
    },
    tableFields () {
      // Base fields (authors)
      let baseFields = this.fields
      const categoryFields = []

      // Get custom fields and add customField=true property
      const customFields = this.getCustomFields().map(field => ({
        ...field,
        customField: true
      }))

      // Add category fields (CAMELOT)
      if (this.camelot && Array.isArray(this.camelot.categories)) {
        this.camelot.categories.forEach(category => {
          if (category.options && Array.isArray(category.options)) {
            category.options.forEach(option => {
              // Only add "Concerns" fields if showConcerns is true
              if (!option.key.endsWith('_concerns') || this.showConcerns) {
                categoryFields.push({
                  key: option.key,
                  label: option.label
                })
              }
            })
          }
        })
      }

      // Remove 'actions' field from base fields to avoid duplicates
      const baseFieldsWithoutActions = baseFields.filter(field => field.key !== 'actions')
      baseFields = baseFieldsWithoutActions

      // Add the actions field at the end
      categoryFields.push({
        key: 'actions',
        label: this.$t('camelot.step_three.actions_header')
      })

      // Return the combination of base fields, custom fields, and category fields
      return [...baseFields, ...customFields, ...categoryFields]
    },
    tableFieldsForEdit () {
      // Use table fields without the actions column for editing
      return this.tableFields.filter(field => field.key !== 'actions')
    }
  },
  methods: {
    formatAuthors(item) {
      return Commons.parseReference(item, true, false)
    },
    editReference (item) {
      console.log('Editando referencia:', item)
      // Save the current reference for editing
      this.currentItem = {...item}
      // Initialize the edit form with the reference values
      this.editForm = {...item}

      // Initialize custom fields with item values
      this.initializeCustomFields(item)

      // Ensure charsData has the necessary data
      if (!this.charsData || !this.charsData.fields) {
        this.loadCharacteristicsData()
      }

      // Open the modal
      this.$bvModal.show('modal-edit-reference')
    },
    deleteReference (item) {
      console.log('Eliminando referencia:', item)
      this.$emit('delete-reference', item)
    },
    handleModalOk (bvModalEvent) {
      bvModalEvent.preventDefault()
      if (this.validateForm()) {
        // Process custom fields for fields (structure with key and label)
        const customFieldsArray = this.processCustomFields()

        // Create the item object containing ref_id, authors and custom fields
        const item = {
          ref_id: this.editForm.id || '',
          authors: this.editForm.authors || []
        }

        // Get existing custom fields
        const existingFields = this.charsData.fields || []
        const existingCustomFields = existingFields.filter(field => isCustomField(field.key))

        // Add custom fields to the item object
        this.customFields.forEach((field, index) => {
          if (field.title && field.title.trim() !== '') {
            // Look if the field already exists
            const existingField = existingCustomFields.find(ef => ef.label === field.title)
            if (existingField) {
              // If it exists, use its original key
              item[existingField.key] = field.value || ''
            } else {
              // If it's new, calculate the new correlative key
              const lastIndex = existingCustomFields.length > 0
                ? Math.max(...existingCustomFields.map(ef => parseInt(ef.key.split('_')[1])))
                : -1
              item[`column_${lastIndex + 1 + index}`] = field.value || ''
            }
          }
        })

        // Add CAMELOT fields to the item object
        if (this.camelot && Array.isArray(this.camelot.categories)) {
          this.camelot.categories.forEach(category => {
            if (category.options && Array.isArray(category.options)) {
              category.options.forEach(option => {
                if (this.editForm[option.key]) {
                  item[option.key] = this.editForm[option.key]
                }
              })
            }
          })
        }

        console.log('Item a actualizar:', item)

        // Check if there is an ID in charsData to determine if it's an update or insert
        if (this.charsData && this.charsData.id) {
          // For update: update only the specific item in existing items
          const updatedCharsData = { ...this.charsData }

          // Find the index of the item being edited
          const itemIndex = updatedCharsData.items.findIndex(existingItem =>
            existingItem.ref_id === item.ref_id
          )

          if (itemIndex !== -1) {
            // Update the existing item
            updatedCharsData.items[itemIndex] = { ...updatedCharsData.items[itemIndex], ...item }
          } else {
            // If it doesn't exist, add it
            updatedCharsData.items.push(item)
          }

          // Update fields if they have changed
          updatedCharsData.fields = customFieldsArray

          console.log('Datos completos a enviar para actualización:', updatedCharsData)

          // If ID exists, update
          Api.patch(`/isoqf_characteristics/${this.charsData.id}/`, updatedCharsData)
            .then(response => {
              console.log('Referencia actualizada:', response.data)
              // Update local data
              this.charsData = response.data
              // Reload characteristics data to reflect changes
              this.loadCharacteristicsData()
              // Force table update
              this.$forceUpdate()
            })
            .catch(error => {
              console.error('Error al actualizar la referencia:', error)
            })
        } else {
          // If ID doesn't exist, insert - build complete object for API
          const newCharacteristics = {
            organization: this.$route.params.org_id || '',
            project_id: this.$route.params.id || '',
            fields: customFieldsArray,
            items: [item]
          }

          console.log('Datos completos a enviar para inserción:', newCharacteristics)

          Api.post('/isoqf_characteristics/', newCharacteristics)
            .then(response => {
              console.log('Referencia creada:', response.data)
              // Update local data
              this.charsData = response.data
              // Reload characteristics data to reflect changes
              this.loadCharacteristicsData()
              // Force table update
              this.$forceUpdate()
            })
            .catch(error => {
              console.error('Error al crear la referencia:', error)
            })
        }

        this.$emit('update-reference', item)
        this.$nextTick(() => {
          this.$bvModal.hide('modal-edit-reference')
        })
      }
    },
    resetModal () {
      this.currentItem = null
      this.editForm = {}
      this.customFields = []
    },
    validateForm () {
      return true
    },
    addCustomField () {
      this.customFields.push({
        title: '',
        value: ''
      })
      // Wait for next cycle to ensure DOM has been updated
      this.$nextTick(() => {
        // Scroll to the last added field
        const newIndex = this.customFields.length - 1
        this.scrollToSection('column-field-' + newIndex)
        // Focus the first input of the new field (the title input)
        setTimeout(() => {
          const inputElement = document.getElementById('label_' + newIndex)
          if (inputElement) {
            inputElement.focus()
          }
        }, 500) // Wait for scroll to finish
      })
    },
    removeCustomField (index) {
      this.customFields.splice(index, 1)
    },
    scrollToSection (id) {
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // If it's a custom field, add animation to highlight it
        if (id.includes('custom-field-')) {
          // Add class for animation
          element.classList.add('highlight-new-field')
          // Remove class after animation
          setTimeout(() => {
            element.classList.remove('highlight-new-field')
          }, 2000)
        }
      }
    },
    onDragStart (evt) {
      console.log('Drag started', evt)
      this.drag = true
      // Add visual class to highlight drag mode
      document.body.classList.add('dragging-active')
    },
    onDragEnd (evt) {
      console.log('Drag ended', evt)
      console.log('New customFields order:', this.customFields)
      this.drag = false
      // Remove visual class
      document.body.classList.remove('dragging-active')
      // Notify that there was a change in custom fields
      this.$emit('custom-fields-reordered', this.customFields)
    },
    /**
     * Processes custom fields and converts them to required format
     * Also includes CAMELOT fields from mixin
     * @returns {Array} Array of objects with key and label
     */
    processCustomFields () {
      // Get existing custom fields
      const existingFields = this.charsData.fields || []
      const existingCustomFields = existingFields.filter(field => isCustomField(field.key))

      // Process new custom fields
      const newCustomFields = this.customFields
        .filter(field => field.title && field.title.trim() !== '')
        .map((field, index) => {
          // If the field already exists, keep its original key
          const existingField = existingCustomFields.find(ef => ef.label === field.title)
          if (existingField) {
            return {
              key: existingField.key,
              label: field.title
            }
          }
          // If it's a new field, generate a new correlative key
          const lastIndex = existingCustomFields.length > 0
            ? Math.max(...existingCustomFields.map(ef => parseInt(ef.key.split('_')[1])))
            : -1
          return {
            key: `column_${lastIndex + 1 + index}`,
            label: field.title
          }
        })

      // Add CAMELOT fields from mixin
      const camelotFields = this.camelot && this.camelot.fields
        ? [...this.camelot.fields]
        : []

      // Combine all fields into a single array
      const base = [{key: 'ref_id', label: this.$t('camelot.step_three.reference_id')}, {key: 'authors', label: this.$t('camelot.step_three.author_year')}]
      return [...base, ...newCustomFields, ...camelotFields]
    },

    /**
     * Gets custom fields from loaded data
     * @returns {Array} Array of objects with key and label for custom fields
     */
    getCustomFields () {
      // Use helper to extract custom fields
      return extractCustomFields(this.charsData.fields)
    },

    // Helper method to check if a field is custom
    isCustomField (fieldKey) {
      return isCustomField(fieldKey)
    },

    /**
     * Loads characteristics data from API
     */
    loadCharacteristicsData () {
      this.isLoading = true

      const params = {
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }

      Api.get('/isoqf_characteristics', params)
        .then(response => {
          if (response.data && response.data.length > 0) {
            // Save received data
            this.charsData = response.data[0] || { fields: [], items: [] }

            // Process data for required format
            this.processCharacteristicsData()

            // Force table update
            this.$forceUpdate()
          } else {
            // If there's no data, initialize with empty structure
            this.charsData = {
              fields: [],
              items: [],
              organization: this.$route.params.org_id,
              project_id: this.$route.params.id
            }
          }

          this.isLoading = false

          // Ensure final update after loading state change
          this.$nextTick(() => {
            this.$forceUpdate()
          })
        })
        .catch(error => {
          console.error('Error al cargar los datos de características:', error)
          this.isLoading = false
        })
    },

    /**
     * Processes data received from API
     */
    processCharacteristicsData () {
      // Here we would process characteristics data as needed
      // For example, transform field format or add additional fields

      if (this.charsData && this.charsData.items && this.charsData.items.length) {
        // Process each item if necessary but don't perform transformations for now
        // Leave code commented as reference for future implementations
        /*
        const processedItems = this.charsData.items.map(item => {
          // Necessary transformations
          return item
        })
        */

        // If we need to update references with this data, we could do it here
        // this.references = [...this.references, ...items]
      }

      // Initialize custom fields for edit form if necessary
      if (this.charsData && this.charsData.fields) {
        this.initializeCustomFields()
      }
    },

    /**
     * Initializes custom fields based on existing fields
     * @param {Object} [itemValues=null] - Object with values for custom fields
     */
    initializeCustomFields (itemValues = null) {
      console.log('Inicializando campos personalizados con valores:', itemValues)
      console.log('Fields actuales:', this.charsData.fields)

      // Get existing custom fields
      const customFields = this.charsData.fields
        .filter(field => isCustomField(field.key))
        .map(field => {
          return {
            title: field.label || '',
            value: (itemValues && itemValues[field.key]) || '',
            key: field.key
          }
        })

      // If there are specific values for this item, add them
      if (itemValues) {
        Object.keys(itemValues).forEach(key => {
          if (isCustomField(key) && !customFields.find(cf => cf.key === key)) {
            customFields.push({
              title: key,
              value: itemValues[key] || '',
              key: key
            })
          }
        })
      }

      this.customFields = customFields
      console.log('Campos personalizados inicializados:', this.customFields)
    },
    toggleConcerns () {
      // Implementa la lógica para mostrar/ocultar los campos "Concerns"
      console.log('Mostrar/ocultar campos "Concerns":', this.showConcerns)
    },
    getVisibleCategoryOptions (category) {
      if (!this.showConcerns) {
        return category.options.filter(option => !option.key.endsWith('_concerns'))
      }
      return category.options
    }
  },
  watch: {
    references: {
      handler(newReferences, oldReferences) {
        // Only reload if there are actual changes in references
        if (newReferences && newReferences.length !== (oldReferences?.length || 0)) {
          console.log('Referencias cambiaron, recargando datos de características')
          this.loadCharacteristicsData()
        }
      },
      immediate: false
    },
    charsData: {
      handler(newVal) {
        if (newVal && newVal.fields) {
          // Force table update when data changes
          this.$nextTick(() => {
            this.$forceUpdate()
          })
        }
      },
      deep: true
    }
  },
  mounted () {
    console.log('StepThree mounted')
    // Cargamos los datos de características al montar el componente
    this.loadCharacteristicsData()
  }
}
</script>

<style scoped>
.table th {
  vertical-align: middle;
  background-color: #f8f9fa;
}

.sticky-menu {
  position: sticky;
  top: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.menu-title {
  font-weight: bold;
  color: #495057;
  padding-bottom: 5px;
  border-bottom: 1px solid #dee2e6;
}

.menu-section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: #6c757d;
}

.menu-item {
  padding: 5px 10px;
  margin: 2px 0;
  border-radius: 3px;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-item:hover {
  background-color: #e9ecef;
  color: #007bff;
}

.menu-sidebar {
  max-height: 100%;
}

.drag-handle {
  cursor: move;
  padding: 5px;
  border-radius: 3px;
}

.drag-handle:hover {
  background-color: #e9ecef;
  color: #007bff;
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

.sortable-drag {
  opacity: 0.8;
  background-color: #e6f7ff !important;
  box-shadow: 0 0 10px rgba(33, 150, 243, 0.3);
}

.dragging-active .custom-fields-container {
  background-color: rgba(0, 123, 255, 0.03);
  border-radius: 4px;
  padding: 8px;
  border: 1px dashed #b8daff;
}

@keyframes highlightBackground {
  0% { background-color: rgba(40, 167, 69, 0.2); }
  50% { background-color: rgba(40, 167, 69, 0.1); }
  100% { background-color: transparent; }
}

.highlight-new-field {
  animation: highlightBackground 2s ease-out;
}

.highlight-new-field .card {
  border-color: #28a745;
  box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}
</style>