<template>
  <div>
    <div>
      <b-table :items="tableItems" :fields="tableFields" striped hover responsive
        show-empty :empty-text="$t('camelot.step_three.no_records')">
        <template v-slot:cell(authors)="data">
          <span style="white-space: nowrap; font-weight: bold">{{ formatAuthors(data.item) }}</span>
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
            <truncated-cell :text="data.item[data.field.key]" />
          </template>
          <!-- Para campos normales, mostramos el valor predeterminado -->
          <template v-else>
            <truncated-cell :text="data.value" />
          </template>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import { camelotMixin } from '@/mixins/camelotMixin'
import Commons from '@/utils/commons'
import { isCustomField } from '@/utils/customFieldsHelper'
import TruncatedCell from '@/components/common/TruncatedCell.vue'

export default {
  name: 'CamelotCharacteristicsTablePreview',
  components: {
    'truncated-cell': TruncatedCell
  },
  mixins: [camelotMixin],
  props: {
    charsOfStudies: {
      type: Object,
      required: true
    },
    references: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      camelotLogo: require('@/assets/camelot-logo.svg'),
      charsData: {
        fields: [],
        items: []
      },
      visibleColumnKeys: []
    }
  },
  computed: {
    tableItems () {
      // Base: characteristics items, already scoped to the finding's references by the parent
      const items = (this.charsData && this.charsData.items) ? [...this.charsData.items] : []

      // Ensure every finding reference has a row, even without saved characteristics data
      const existingRefIds = new Set(items.map(item => item.ref_id))
      if (this.references) {
        this.references.forEach(ref => {
          if (!existingRefIds.has(ref.id)) {
            items.push({ ref_id: ref.id })
          }
        })
      }

      // Enrich each row with the raw reference (needed for author/year formatting)
      const enriched = items.map(item => {
        const ref = this.references && this.references.find(r => r.id === item.ref_id)
        if (ref) {
          return { ...ref, ...item, authors: ref.authors }
        }
        return item
      })

      // Sort alphabetically by authors field using format helper for consistency
      return enriched.sort((a, b) => {
        const authorsA = this.formatAuthors(a).toLowerCase()
        const authorsB = this.formatAuthors(b).toLowerCase()
        return authorsA.localeCompare(authorsB)
      })
    },
    availableTableFields () {
      // Base fields (authors)
      const baseFields = [
        { key: 'authors', label: this.$t('camelot.step_three.authors_label') }
      ]
      const orderedFields = []

      if (this.charsData && Array.isArray(this.charsData.fields)) {
        this.charsData.fields.forEach(field => {
          if (['authors', 'ref_id', 'actions', 'edit'].includes(field.key)) return

          if (field.key.endsWith('_comments')) {
            let label = field.label
            if (this.camelot && Array.isArray(this.camelot.categories)) {
              for (const cat of this.camelot.categories) {
                const opt = cat.options && cat.options.find(o => o.key === field.key)
                if (opt) { label = opt.label; break }
              }
            }
            orderedFields.push({ key: field.key, label: label, isCamelot: true })
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

      return [...baseFields, ...orderedFields]
    },
    tableFields () {
      // Return columns that should be displayed
      return this.availableTableFields.filter(f => {
        if (f.key === 'authors') return true

        // Show all fields in preview mode (no filtering)
        return true
      })
    }
  },
  watch: {
    charsOfStudies: {
      handler (newVal) {
        if (newVal && newVal.fields) {
          this.charsData = JSON.parse(JSON.stringify(newVal))
        }
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    formatAuthors (item) {
      return Commons.parseReference(item, true, false)
    },
    isCustomField (fieldKey) {
      return isCustomField(fieldKey)
    }
  }
}
</script>

<style scoped>
.table th {
  vertical-align: middle;
  background-color: #f8f9fa;
}

.table {
  margin-bottom: 0;
}
</style>
