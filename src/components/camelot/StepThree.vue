<template>
  <div>
    <b-alert show variant="info" v-if="isLoading">
      {{ $t('camelot.step_three.loading') }}
    </b-alert>
    <b-alert show variant="info" v-else-if="references.length === 0 && (!charsData.items || charsData.items.length === 0)">
      {{ $t('camelot.step_three.no_records') }}
    </b-alert>
    <div v-else>
      <!-- Action buttons toolbar -->
      <div class="mb-3 d-flex gap-2">
        <b-button
          variant="outline-primary"
          size="sm"
          @click="exportToCSV">
          <i class="fas fa-file-csv mr-1"></i>
          {{ $t('camelot.step_three.export_csv') }}
        </b-button>
        <b-button
          variant="outline-primary"
          size="sm"
          @click="openColumnsModal">
          <i class="fas fa-columns mr-1"></i>
          {{ $t('camelot.step_three.add_edit_columns') }}
        </b-button>
        <b-button
          variant="outline-primary"
          size="sm"
          @click="toggleConcerns"
          :disabled="!hasVisibleCamelotFields">
          <i :class="showConcerns ? 'fas fa-eye-slash' : 'fas fa-eye'" class="mr-1"></i>
          {{ $t('camelot.step_three.show_hide_concerns') }}
        </b-button>
        <TableColumnFilter
          :all-columns="filterableColumns"
          v-model="visibleColumnKeys"
        />
      </div>

      <b-table
        :items="tableItems"
        :fields="tableFields"
        striped
        hover
        responsive>
        <template v-slot:cell(authors)="data">
          {{ formatAuthors(data.item) }}
          <b-button
            size="sm"
            variant="primary"
            class="mr-1"
            @click="editReference(data.item)">
            {{ $t('camelot.step_three.edit_button') }}
          </b-button>
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

      </b-table>

      <!-- Modal para editar referencias -->
      <b-modal
        id="modal-edit-reference"
        :title="modalTitle"
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
                    {{ field.label || 'Sin título' }}
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
              <!-- Campos personalizados -->
              <div class="mb-4">
                <CustomFieldsManager
                  v-model="customFields"
                  :with-values="true"
                  :title="$t('camelot.step_three.modal.custom_fields_title')"
                  :add-button-text="$t('camelot.step_three.modal.add_field_button')"
                  :empty-text="$t('camelot.step_three.modal.no_custom_fields')"
                  :move-instruction-text="$t('camelot.step_three.modal.move_instruction')"
                  :move-button-text="$t('camelot.step_three.modal.move_button')"
                  :delete-button-text="$t('camelot.step_three.delete_button')"
                  :label-text="$t('camelot.step_three.modal.title_label')"
                  :content-label-text="$t('camelot.step_three.modal.content_label')"
                  :placeholder-label="$t('camelot.step_three.modal.field_title_placeholder')"
                  :placeholder-value="$t('camelot.step_three.modal.field_content_placeholder')"
                  id-prefix="custom-field-"
                />
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

      <!-- Modal para gestionar columnas personalizadas -->
      <b-modal
        id="modal-manage-columns"
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
  </div>
</template>

<script>
import { camelotMixin } from '@/mixins/camelotMixin'
import draggable from 'vuedraggable'
import Api from '@/utils/Api'
import Commons from '@/utils/commons'
import { isCustomField, extractCustomFields, processCustomFields, cleanOrphanedCustomFieldKeys } from '@/utils/customFieldsHelper'

export default {
  name: 'StepThree',
  components: {
    draggable,
    CustomFieldsManager: () => import('./CustomFieldsManager.vue'),
    TableColumnFilter: () => import('@/components/common/TableColumnFilter.vue')
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
  watch: {
    filterableColumns: {
      immediate: true,
      handler (newCols, oldCols) {
        // Initial load
        if (!oldCols) {
           this.visibleColumnKeys = newCols.map(c => c.key)
           return
        }
        
        // Calculate new columns that weren't present before
        const oldKeys = oldCols.map(c => c.key)
        const addedCols = newCols.filter(c => !oldKeys.includes(c.key))
        
        if (addedCols.length > 0) {
          // Add newly appeared columns to visible list
          const newKeysToAdd = addedCols.map(c => c.key)
          // Avoid duplicates
          const uniqueNewKeys = newKeysToAdd.filter(key => !this.visibleColumnKeys.includes(key))
          
          if (uniqueNewKeys.length > 0) {
            this.visibleColumnKeys = [...this.visibleColumnKeys, ...uniqueNewKeys]
          }
        }
      }
    },
    // Watch showConcerns to ensure new columns are visible
    showConcerns (newVal) {
      if (newVal) {
        // Validation logic is now handled in toggleConcerns to ensure immediate update
        this.$nextTick(() => {
          this.$forceUpdate()
        })
      }
    },
    visibleColumnKeys: {
      handler (newVal, oldVal) {
        // If showConcerns is active, we should ensure concern columns follow their parents
        if (this.showConcerns && oldVal) {
          const added = newVal.filter(k => !oldVal.includes(k))
          const removed = oldVal.filter(k => !newVal.includes(k))
          
          let changed = false
          let updatedKeys = [...newVal]
          
          added.forEach(k => {
            if (k.endsWith('_extractedData')) {
              const concernKey = k.replace('_extractedData', '_concerns')
              if (!updatedKeys.includes(concernKey)) {
                updatedKeys.push(concernKey)
                changed = true
              }
            }
          })
          
          removed.forEach(k => {
            if (k.endsWith('_extractedData')) {
              const concernKey = k.replace('_extractedData', '_concerns')
              const idx = updatedKeys.indexOf(concernKey)
              if (idx !== -1) {
                updatedKeys.splice(idx, 1)
                changed = true
              }
            }
          })
          
          if (changed) {
            this.visibleColumnKeys = updatedKeys
          }
        }
      },
      deep: false
    }
  },
  data () {
    return {
      fields: [
        {
          key: 'authors',
          label: this.$t('camelot.step_three.authors_label')
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
      showConcerns: false,
      columnDefinitions: [], // Global column definitions
      isSavingColumns: false, // Flag to track save state
      visibleColumnKeys: [] // Keys of currently visible columns
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
    availableTableFields () {
      // Base fields (authors)
      let baseFields = this.fields
      const categoryFields = []

      // Get custom fields and add customField=true property
      const customFields = this.getCustomFields().map(field => ({
        ...field,
        customField: true
      }))

      // Add category fields (CAMELOT) with new structure
      if (this.camelot && Array.isArray(this.camelot.categories)) {
        this.camelot.categories.forEach(category => {
          if (category.options && Array.isArray(category.options)) {
            // Find the "extracted data" and "concerns" options for this category
            const extractedDataOption = category.options.find(opt => !opt.key.endsWith('_concerns'))
            const concernsOption = category.options.find(opt => opt.key.endsWith('_concerns'))
            
            // Add the domain column (extracted data) with the category label as header
            if (extractedDataOption) {
              categoryFields.push({
                key: extractedDataOption.key,
                label: category.label // Use category label instead of option label
              })
            }
            
            // If showConcerns is true, add the concerns column right after the domain
            if (this.showConcerns && concernsOption) {
              categoryFields.push({
                key: concernsOption.key,
                label: concernsOption.label // Keep "Preocupaciones" label
              })
            }
          }
        })
      }

      // Remove 'actions' field from base fields to avoid duplicates
      const baseFieldsWithoutActions = baseFields.filter(field => field.key !== 'actions')
      baseFields = baseFieldsWithoutActions

      // Return the combination of base fields, custom fields, and category fields
      return [...baseFields, ...customFields, ...categoryFields]
    },
    filterableColumns () {
      // Return columns that can be filtered (everything except authors, actions and concerns)
      return this.availableTableFields.filter(f => 
        f.key !== 'authors' && 
        f.key !== 'actions' && 
        !f.key.endsWith('_concerns')
      )
    },
    tableFields () {
      // Return columns that should be displayed
      return this.availableTableFields.filter(f => {
        if (f.key === 'authors' || f.key === 'actions') return true
        
        // Ensure concern columns only show if their parent extracted data column is visible
        if (f.key.endsWith('_concerns')) {
          const parentKey = f.key.replace('_concerns', '_extractedData')
          return this.visibleColumnKeys.includes(f.key) && this.visibleColumnKeys.includes(parentKey)
        }
        
        return this.visibleColumnKeys.includes(f.key)
      })
    },
    hasVisibleCamelotFields () {
      if (!this.camelot || !this.camelot.categories) return false
      return this.camelot.categories.some(cat => {
        const extractedOpt = cat.options.find(opt => !opt.key.endsWith('_concerns'))
        return extractedOpt && this.visibleColumnKeys.includes(extractedOpt.key)
      })
    },
    tableFieldsForEdit () {
      // Use table fields without the actions column for editing
      return this.availableTableFields.filter(field => field.key !== 'actions')
    },
    modalTitle () {
      // Generate dynamic modal title with author information
      if (this.currentItem) {
        const authorInfo = this.formatAuthors(this.currentItem)
        return `${this.$t('camelot.step_three.modal.title')}: ${authorInfo}`
      }
      return this.$t('camelot.step_three.modal.title')
    }
  },
  methods: {
    formatAuthors(item) {
      return Commons.parseReference(item, true, false)
    },
    editReference (item) {
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
          if (field.label && field.label.trim() !== '') {
            // Look if the field already exists
            const existingField = existingCustomFields.find(ef => ef.label === field.label)
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

          // Clean orphaned custom field keys from all items
          updatedCharsData.items = cleanOrphanedCustomFieldKeys(updatedCharsData.items, customFieldsArray)

          // If ID exists, update
          Api.patch(`/isoqf_characteristics/${this.charsData.id}/`, updatedCharsData)
            .then(response => {
              // Update local data
              this.charsData = response.data
              
              // Ensure new columns are visible immediately using the keys we just sent
              const newKeys = customFieldsArray
                  .filter(f => f.key !== 'authors' && f.key !== 'ref_id' && f.key !== 'actions' && !this.visibleColumnKeys.includes(f.key))
                  .map(f => f.key)
              
              if (newKeys.length > 0) {
                  this.visibleColumnKeys = [...this.visibleColumnKeys, ...newKeys]
              }
              
              // Reload characteristics data to reflect changes
              this.loadCharacteristicsData()
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

          Api.post('/isoqf_characteristics/', newCharacteristics)
            .then(response => {
              // Update local data
              this.charsData = response.data
              
              // Ensure new columns are visible immediately using the keys we just sent
              const newKeys = customFieldsArray
                  .filter(f => f.key !== 'authors' && f.key !== 'ref_id' && f.key !== 'actions' && !this.visibleColumnKeys.includes(f.key))
                  .map(f => f.key)
              
              if (newKeys.length > 0) {
                  this.visibleColumnKeys = [...this.visibleColumnKeys, ...newKeys]
              }
              
              // Reload characteristics data to reflect changes
              this.loadCharacteristicsData()
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
    // addCustomField and removeCustomField are now handled by CustomFieldsManager
    // removeCustomField (index) {
    //   this.customFields.splice(index, 1)
    // },
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
    // onDragStart and onDragEnd are now handled by CustomFieldsManager or not needed in parent
    onDragStart (evt) {
      // this.drag = true
    },
    onDragEnd (evt) {
      // this.drag = false
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
        .filter(field => field.label && field.label.trim() !== '')
        .map((field, index) => {
          // If the field already exists, keep its original key
          const existingField = existingCustomFields.find(ef => ef.label === field.label)
          if (existingField) {
            return {
              key: existingField.key,
              label: field.label
            }
          }
          // If it's a new field, generate a new correlative key
          const lastIndex = existingCustomFields.length > 0
            ? Math.max(...existingCustomFields.map(ef => parseInt(ef.key.split('_')[1])))
            : -1
          return {
            key: `column_${lastIndex + 1 + index}`,
            label: field.label
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
            // Safeguard: Ensure visible columns are populated if seemingly empty
            if (this.visibleColumnKeys.length === 0 && this.filterableColumns.length > 0) {
                 this.visibleColumnKeys = this.filterableColumns.map(c => c.key)
            }
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
      // Safety check: ensure charsData.fields exists and is an array
      if (!this.charsData || !Array.isArray(this.charsData.fields)) {
        console.warn('charsData.fields no está disponible o no es un array')
        this.customFields = []
        return
      }

      // Get existing custom fields
      const customFields = this.charsData.fields
        .filter(field => isCustomField(field.key))
        .map(field => {
          return {
            label: field.label || '',
            value: (itemValues && itemValues[field.key]) || '',
            key: field.key
          }
        })

      // If there are specific values for this item, add them
      if (itemValues) {
        Object.keys(itemValues).forEach(key => {
          if (isCustomField(key) && !customFields.find(cf => cf.key === key)) {
            customFields.push({
              label: key,
              value: itemValues[key] || '',
              key: key
            })
          }
        })
      }

      this.customFields = customFields
    },
    toggleConcerns () {
      // Toggle the state of showing/hiding "Concerns" fields
      this.showConcerns = !this.showConcerns
      
      if (this.showConcerns) {
          // Add concern keys only for CAMELOT fields that are currently visible
          const concernKeys = []
          if (this.camelot && this.camelot.categories) {
              this.camelot.categories.forEach(cat => {
                  if (cat.options) {
                      const extractedOpt = cat.options.find(opt => !opt.key.endsWith('_concerns'))
                      const concernOpt = cat.options.find(opt => opt.key && opt.key.endsWith('_concerns'))
                      
                      if (extractedOpt && concernOpt && this.visibleColumnKeys.includes(extractedOpt.key)) {
                          concernKeys.push(concernOpt.key)
                      }
                  }
              })
          }
          
          // Merge unique keys
          const newKeys = [...this.visibleColumnKeys]
          let changed = false
          concernKeys.forEach(k => {
              if (!newKeys.includes(k)) {
                  newKeys.push(k)
                  changed = true
              }
          })
          
          if (changed) {
              this.visibleColumnKeys = newKeys
          }
      } else {
          // Remove all concern keys when hiding
          this.visibleColumnKeys = this.visibleColumnKeys.filter(k => !k.endsWith('_concerns'))
      }
      
      this.$nextTick(() => {
          this.$forceUpdate()
      })
    },
    exportToCSV () {
      const { exportTableToCSV } = require('@/utils/csvExporter')
      // Pre-process items: format authors and replace undefined/null with empty strings
      const fields = this.tableFields
      const processedItems = this.tableItems.map(item => {
        const processed = {}
        fields.forEach(field => {
          if (field.key === 'authors') {
            processed[field.key] = this.formatAuthors(item)
          } else {
            const val = item[field.key]
            processed[field.key] = (val !== undefined && val !== null) ? val : ''
          }
        })
        return processed
      })
      exportTableToCSV({
        fields,
        items: processedItems,
        filename: 'characteristics_of_studies',
        excludeKeys: ['ref_id', 'id', 'actions']
      })
    },
    openColumnsModal () {
      // Load current column definitions from charsData.fields
      const customFields = this.getCustomFields()
      
      this.columnDefinitions = customFields.map(field => ({
        key: field.key,
        label: field.label
      }))
      
      this.$bvModal.show('modal-manage-columns')
    },
    // openFilterModal removed - replaced by component
    // addColumnDefinition and removeColumnDefinition are now handled by CustomFieldsManager
    // addColumnDefinition () {
    //   this.columnDefinitions.push({
    //     key: `column_${Date.now()}`,
    //     label: ''
    //   })
    // },
    // removeColumnDefinition (index) {
    //   this.columnDefinitions.splice(index, 1)
    // },
    handleSaveColumns (bvModalEvt) {
      // Prevent modal from closing automatically if called from @ok event
      if (bvModalEvt) {
        bvModalEvt.preventDefault()
      }
      
      // Prevent double-save
      if (this.isSavingColumns) {
        return
      }
      
      this.isSavingColumns = true
      
      // Update charsData.fields with the new column definitions
      // Remove old custom fields
      const nonCustomFields = this.charsData.fields.filter(field => !isCustomField(field.key))
      
      // Add new custom fields from columnDefinitions
      const newCustomFields = this.columnDefinitions
        .filter(col => col.label && col.label.trim() !== '')
        .map(col => ({
          key: col.key || `column_${Date.now()}_${Math.random()}`,
          label: col.label.trim()
        }))
      
      // Update charsData.fields
      this.charsData.fields = [...nonCustomFields, ...newCustomFields]
      
      // Clean orphaned custom field keys from items
      const cleanedItems = cleanOrphanedCustomFieldKeys(this.charsData.items || [], this.charsData.fields)
      
      // Save to API
      const dataToSave = {
        fields: this.charsData.fields,
        items: cleanedItems,
        organization: this.$route.params.org_id,
        project_id: this.$route.params.id
      }
      
      if (this.charsData.id || this.charsData._id) {
        // Update existing
        const id = this.charsData.id || this.charsData._id
        Api.patch(`/isoqf_characteristics/${id}`, dataToSave)
          .then(response => {
            // The API returns data in $set property
            const responseData = response.data.$set || response.data
            
            // Ensure we have the id
            const updatedData = {
              ...responseData,
              id: response.data.id || this.charsData.id,
              _id: response.data._id || this.charsData._id
            }
            
            // Update charsData using $set to ensure reactivity
            this.$set(this, 'charsData', updatedData)
            
            // Ensure new columns are visible
            this.$nextTick(() => {
                if (this.charsData && this.charsData.fields) {
                    const newIds = this.charsData.fields
                        .filter(f => f.key !== 'authors' && f.key !== 'actions' && !this.visibleColumnKeys.includes(f.key))
                        .map(f => f.key)
                    
                    if (newIds.length > 0) {
                        this.visibleColumnKeys = [...this.visibleColumnKeys, ...newIds]
                    }
                }
            })
            
            this.isSavingColumns = false
            
            // Close modal first
            this.$bvModal.hide('modal-manage-columns')
            
            // Wait for next tick to ensure modal is closed and reactivity is triggered
            this.$nextTick(() => {
              // Show toast after a small delay to avoid interference
              setTimeout(() => {
                this.$bvToast.toast(this.$t('camelot.step_three.columns_modal.success_update'), {
                  title: this.$t('camelot.step_three.columns_modal.toast_success_title'),
                  variant: 'success',
                  solid: true,
                  autoHideDelay: 3000
                })
              }, 100)
            })
          })
          .catch(error => {
            this.isSavingColumns = false
            this.$bvToast.toast(this.$t('camelot.step_three.columns_modal.error_update'), {
              title: this.$t('camelot.step_three.columns_modal.toast_error_title'),
              variant: 'danger',
              solid: true
            })
          })
      } else {
        // Create new
        Api.post('/isoqf_characteristics/', dataToSave)
          .then(response => {
            // The API returns data in $set property
            const responseData = response.data.$set || response.data
            
            // Ensure we have the id
            const createdData = {
              ...responseData,
              id: response.data.id || this.charsData.id,
              _id: response.data._id || this.charsData._id
            }
            
            // Update charsData using $set to ensure reactivity
            this.$set(this, 'charsData', createdData)
            
            // Ensure new columns are visible
            this.$nextTick(() => {
                if (this.charsData && this.charsData.fields) {
                    const newIds = this.charsData.fields
                        .filter(f => f.key !== 'authors' && f.key !== 'actions' && !this.visibleColumnKeys.includes(f.key))
                        .map(f => f.key)
                    
                    if (newIds.length > 0) {
                        this.visibleColumnKeys = [...this.visibleColumnKeys, ...newIds]
                    }
                }
            })

            this.isSavingColumns = false
            
            // Close modal first
            this.$bvModal.hide('modal-manage-columns')
            
            // Wait for next tick to ensure modal is closed and reactivity is triggered
            this.$nextTick(() => {
              // Show toast after a small delay to avoid interference
              setTimeout(() => {
                this.$bvToast.toast(this.$t('camelot.step_three.columns_modal.success_create'), {
                  title: this.$t('camelot.step_three.columns_modal.toast_success_title'),
                  variant: 'success',
                  solid: true,
                  autoHideDelay: 3000
                })
              }, 100)
            })
          })
          .catch(error => {
            this.isSavingColumns = false
            this.$bvToast.toast(this.$t('camelot.step_three.columns_modal.error_create'), {
              title: this.$t('camelot.step_three.columns_modal.toast_error_title'),
              variant: 'danger',
              solid: true
            })
          })
      }
    },
    closeColumnsModal () {
      // Close the modal
      this.$bvModal.hide('modal-manage-columns')
    },
    resetColumnsModal () {
      // Reset column definitions when modal is closed
      this.columnDefinitions = []
      this.isSavingColumns = false
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