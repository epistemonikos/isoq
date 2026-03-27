<template>
  <div>
    <b-alert show variant="info" v-if="isLoading">
      {{ $t('camelot.step_three.loading') }}
    </b-alert>
    <b-alert show variant="info"
      v-else-if="references.length === 0 && (!charsData.items || charsData.items.length === 0)">
      {{ $t('camelot.step_three.no_records') }}
    </b-alert>
    <div v-else>
      <!-- Action buttons toolbar -->
      <div class="mb-3 d-flex justify-content-end">
        <ManageColumnsButton :chars-data="charsData" :camelot="camelot" :visible-column-keys.sync="visibleColumnKeys"
          @saved="charsData = $event" />
        <ToggleConcernsButton class="ml-2" v-model="showComments" :has-visible-camelot-fields="hasVisibleCamelotFields"
          :visible-column-keys.sync="visibleColumnKeys" :camelot="camelot" />
        <TableColumnFilter class="ml-2" :all-columns="filterableColumns" v-model="visibleColumnKeys" />
        <ExportCSVButton class="ml-2" :fields="tableFields" :items="tableItems" />
      </div>

      <b-table :items="tableItems" :fields="tableFields" striped hover responsive>
        <template v-slot:cell(authors)="data">
          {{ formatAuthors(data.item) }}
        </template>

        <template v-slot:cell(edit)="data">
          <b-button size="sm" variant="outline-primary" class="mr-1" @click="editReference(data.item)">
            {{ $t('camelot.step_three.edit_button') }}
            <font-awesome-icon icon="edit" class="ml-1" />
          </b-button>
        </template>

        <!-- Cabeceras personalizadas para campos Camelot -->
        <template v-for="field in tableFields" v-slot:[`head(${field.key})`]="data">
          <div :key="field.key" class="d-flex align-items-center">
            <span>{{ data.label }}</span>
            <img v-if="field.isCamelot" :src="camelotLogo" class="ml-1" width="16" height="16"
              v-b-tooltip.hover="$t('camelot.step_three.camelot_field')" />
          </div>
        </template>

        <!-- Plantilla genérica para todos los campos -->
        <template v-slot:cell()="data">
          <!-- Para los campos personalizados, mostramos su contenido -->
          <template v-if="isCustomField(data.field.key)">
            <div v-if="shouldTruncate(data.item[data.field.key]) && !isExpanded(data.item.id, data.field.key)">
              {{ truncate(data.item[data.field.key]) }}...
              <p>
                <b-link @click="toggleExpand(data.item.id, data.field.key)" style="font-size: 12px;">
                  {{ $t('common.read_more') }}
                </b-link>
              </p>
            </div>
            <div v-else-if="shouldTruncate(data.item[data.field.key]) && isExpanded(data.item.id, data.field.key)">
              {{ data.item[data.field.key] }}
              <p>
                <b-link @click="toggleExpand(data.item.id, data.field.key)" style="font-size: 12px;">
                  {{ $t('common.read_less') }}
                </b-link>
              </p>
            </div>
            <div v-else>
              <template v-if="data.item[data.field.key]">
                {{ data.item[data.field.key] }}
              </template>
              <i v-else class="text-muted">{{ $t('common.not_completed') }}</i>
            </div>
          </template>
          <!-- Para campos normales, mostramos el valor predeterminado -->
          <template v-else>
            <div v-if="shouldTruncate(data.value) && !isExpanded(data.item.id, data.field.key)">
              {{ truncate(data.value) }}...
              <p>
                <b-link @click="toggleExpand(data.item.id, data.field.key)" style="font-size: 12px;">
                  {{ $t('common.read_more') }}
                </b-link>
              </p>
            </div>
            <div v-else-if="shouldTruncate(data.value) && isExpanded(data.item.id, data.field.key)">
              {{ data.value }}
              <p>
                <b-link @click="toggleExpand(data.item.id, data.field.key)" style="font-size: 12px;">
                  {{ $t('common.read_less') }}
                </b-link>
              </p>
            </div>
            <div v-else>
              <template v-if="data.value">
                {{ data.value }}
              </template>
              <i v-else class="text-muted">{{ $t('common.not_completed') }}</i>
            </div>
          </template>
        </template>

        <template v-slot:cell(actions)="data">
          <b-button size="sm" variant="outline-primary" class="mr-1" @click="editReference(data.item)">
            {{ $t('camelot.step_three.edit_button') }}
            <font-awesome-icon icon="edit" class="ml-1" />
          </b-button>
          <b-button size="sm" variant="danger" @click="deleteReference(data.item)">
            {{ $t('camelot.step_three.delete_button') }}
          </b-button>
        </template>

      </b-table>

      <!-- Modal para editar referencias -->
      <EditReferenceModal ref="editReferenceModal" :reference="currentItem" :chars-data="charsData" :camelot="camelot"
        :visible-column-keys.sync="visibleColumnKeys" @saved="handleReferenceSaved" @close="currentItem = null" />
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
      handler(newCols, oldCols) {
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
    // Watch showComments to ensure new columns are visible
    showComments(newVal) {
      if (newVal) {
        // Validation logic is now handled in toggleConcerns to ensure immediate update
        this.$nextTick(() => {
          this.$forceUpdate()
        })
      }
    },
    visibleColumnKeys: {
      handler(newVal, oldVal) {
        // If showComments is active, we should ensure concern columns follow their parents
        if (this.showComments && oldVal) {
          const added = newVal.filter(k => !oldVal.includes(k))
          const removed = oldVal.filter(k => !newVal.includes(k))

          let changed = false
          let updatedKeys = [...newVal]

          added.forEach(k => {
            if (k.endsWith('_extractedData')) {
              const concernKey = k.replace('_extractedData', '_comments')
              if (!updatedKeys.includes(concernKey)) {
                updatedKeys.push(concernKey)
                changed = true
              }
            }
          })

          removed.forEach(k => {
            if (k.endsWith('_extractedData')) {
              const concernKey = k.replace('_extractedData', '_comments')
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
    },
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
  data() {
    return {
      fields: [
        {
          key: 'authors',
          label: this.$t('camelot.step_three.authors_label')
        },
        {
          key: 'edit',
          label: ''
        }
      ],
      camelotLogo: require('@/assets/camelot-logo.svg'),
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
      isFirstLoad: true,
      showComments: false,
      visibleColumnKeys: [], // Keys of currently visible columns
      expandedCells: {}
    }
  },
  computed: {
    tableItems() {
      // Always use references as base to ensure all are displayed
      const items = this.references.map(ref => {
        // Look for saved data for this reference
        let charItem = null
        if (this.charsData && this.charsData.items) {
          charItem = this.charsData.items.find(item => item.ref_id === ref.id)
        }

        // If there is data, merge it with the reference, but preserve the authors array
        // to ensure formatAuthors can always re-format correctly with the new logic
        if (charItem) {
          return { ...ref, ...charItem, authors: ref.authors }
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
    availableTableFields() {
      // Base fields (authors)
      const baseFields = this.fields.filter(f => f.key === 'authors')
      const orderedFields = []

      if (this.charsData && Array.isArray(this.charsData.fields)) {
        this.charsData.fields.forEach(field => {
          if (['authors', 'ref_id', 'actions', 'edit'].includes(field.key)) return

          if (field.key.endsWith('_comments')) {
            if (this.showComments) {
              let label = field.label
              if (this.camelot && Array.isArray(this.camelot.categories)) {
                for (const cat of this.camelot.categories) {
                  const opt = cat.options && cat.options.find(o => o.key === field.key)
                  if (opt) { label = opt.label; break }
                }
              }
              orderedFields.push({ key: field.key, label: label, isCamelot: true })
            }
            return
          }

          if (field.key.endsWith('_extractedData')) {
            let label = field.label
            if (this.camelot && Array.isArray(this.camelot.categories)) {
              const catMatch = this.camelot.categories.find(c => c.options && c.options.some(o => o.key === field.key))
              if (catMatch) label = catMatch.label
            }
            orderedFields.push({ key: field.key, label: label, isCamelot: true })
            return
          }

          if (isCustomField(field.key)) {
            orderedFields.push({ key: field.key, label: field.label, customField: true })
          }
        })
      }

      const editFields = this.fields.filter(f => f.key === 'edit')
      const actionFields = this.fields.filter(f => f.key === 'actions')

      // Return the combination maintaining the custom order
      return [...baseFields, ...editFields, ...orderedFields, ...actionFields]
    },
    filterableColumns() {
      // Return columns that can be filtered (everything except authors, actions and concerns)
      return this.availableTableFields.filter(f =>
        f.key !== 'authors' &&
        f.key !== 'actions' &&
        f.key !== 'edit' &&
        !f.key.endsWith('_comments')
      )
    },
    tableFields() {
      // Return columns that should be displayed
      return this.availableTableFields.filter(f => {
        if (f.key === 'authors' || f.key === 'actions' || f.key === 'edit') return true

        // Ensure concern columns only show if their parent extracted data column is visible
        if (f.key.endsWith('_comments')) {
          const parentKey = f.key.replace('_comments', '_extractedData')
          return this.visibleColumnKeys.includes(f.key) && this.visibleColumnKeys.includes(parentKey)
        }

        return this.visibleColumnKeys.includes(f.key)
      })
    },
    hasVisibleCamelotFields() {
      if (!this.camelot || !this.camelot.categories) return false
      return this.camelot.categories.some(cat => {
        const extractedOpt = cat.options.find(opt => !opt.key.endsWith('_comments'))
        return extractedOpt && this.visibleColumnKeys.includes(extractedOpt.key)
      })
    }
  },
  methods: {
    formatAuthors(item) {
      return Commons.parseReference(item, true, false)
    },
    shouldTruncate(text) {
      return Commons.shouldTruncate(text)
    },
    truncate(text) {
      return Commons.truncate(text)
    },
    toggleExpand(refId, fieldKey) {
      const key = `${refId}-${fieldKey}`
      this.$set(this.expandedCells, key, !this.expandedCells[key])
    },
    isExpanded(refId, fieldKey) {
      return !!this.expandedCells[`${refId}-${fieldKey}`]
    },
    editReference(item) {
      this.currentItem = { ...item }
      this.$nextTick(() => {
        if (this.$refs.editReferenceModal) {
          this.$refs.editReferenceModal.show()
        }
      })
    },
    handleReferenceSaved(updatedData) {
      this.$set(this, 'charsData', updatedData)
      this.$forceUpdate()
    },
    deleteReference(item) {
      this.$emit('delete-reference', item)
    },

    /**
     * Gets custom fields from loaded data
     * @returns {Array} Array of objects with key and label for custom fields
     */
    getCustomFields() {
      // Use helper to extract custom fields
      return extractCustomFields(this.charsData.fields)
    },

    // Helper method to check if a field is custom
    isCustomField(fieldKey) {
      return isCustomField(fieldKey)
    },

    /**
     * Loads characteristics data from API
     */
    loadCharacteristicsData() {
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
            // If there's no data, initialize with empty structure and default Camelot fields if available
            this.charsData = {
              fields: this.camelot && this.camelot.fields ? [...this.camelot.fields] : [],
              items: [],
              organization: this.$route.params.org_id,
              project_id: this.$route.params.id
            }
          }

          this.isLoading = false

          // Ensure final update after loading state change
          this.$nextTick(() => {
            // Safeguard: Ensure visible columns are populated on first load if they appear empty
            if (this.isFirstLoad && this.visibleColumnKeys.length === 0 && this.filterableColumns.length > 0) {
              this.visibleColumnKeys = this.filterableColumns.map(c => c.key)
            }
            this.isFirstLoad = false
            this.$forceUpdate()
          })
        })
        .catch(error => {
          console.error('Error al cargar los datos de características:', error)
          this.isLoading = false
        })
    }
  },
  mounted() {
    // Cargamos los datos de características al montar el componente
    this.loadCharacteristicsData()

    // Escuchar actualizaciones globales para sincronizar datos entre pestañas
    this.$root.$on('characteristics-updated', (updatedData) => {
      if (updatedData) {
        this.charsData = updatedData
        this.$forceUpdate()
      }
    })
  },
  beforeDestroy() {
    this.$root.$off('characteristics-updated')
  }
}
</script>

<style scoped>
.table th {
  vertical-align: middle;
  background-color: #f8f9fa;
}
</style>
