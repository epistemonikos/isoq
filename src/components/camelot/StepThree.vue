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
        <ExportCSVButton
          :fields="tableFields"
          :items="tableItems"
        />
        <ManageColumnsButton
          :chars-data="charsData"
          :visible-column-keys.sync="visibleColumnKeys"
          @saved="charsData = $event"
        />
        <ToggleConcernsButton
          v-model="showConcerns"
          :has-visible-camelot-fields="hasVisibleCamelotFields"
          :visible-column-keys.sync="visibleColumnKeys"
          :camelot="camelot"
        />
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
      <EditReferenceModal
        ref="editReferenceModal"
        :reference="currentItem"
        :chars-data="charsData"
        :camelot="camelot"
        :visible-column-keys.sync="visibleColumnKeys"
        @saved="handleReferenceSaved"
        @close="currentItem = null"
      />
    </div>
  </div>
</template>

<script>
import { camelotMixin } from '@/mixins/camelotMixin'
import Api from '@/utils/Api'
import Commons from '@/utils/commons'
import { isCustomField, extractCustomFields } from '@/utils/customFieldsHelper'

export default {
  name: 'StepThree',
  components: {
    ExportCSVButton: () => import('./ExportCSVButton.vue'),
    ManageColumnsButton: () => import('./ManageColumnsButton.vue'),
    ToggleConcernsButton: () => import('./ToggleConcernsButton.vue'),
    EditReferenceModal: () => import('./EditReferenceModal.vue'),
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
    }
  },
  methods: {
    formatAuthors(item) {
      return Commons.parseReference(item, true, false)
    },
    editReference (item) {
      this.currentItem = { ...item }
      this.$nextTick(() => {
        if (this.$refs.editReferenceModal) {
          this.$refs.editReferenceModal.show()
        }
      })
    },
    handleReferenceSaved (updatedData) {
      this.charsData = updatedData
      this.loadCharacteristicsData()
      this.$forceUpdate()
    },
    deleteReference (item) {
      this.$emit('delete-reference', item)
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
</style>