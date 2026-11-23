<template>
    <div>
        <div class="d-flex justify-content-end mb-3 d-print-none" data-testid="chars-toolbar">
            <table-column-filter :all-columns="filterableColumns" v-model="visibleColumnKeys" />
            <b-button
                class="ml-2"
                size="sm"
                variant="outline-info"
                data-testid="toggle-comments"
                :disabled="!hasVisibleCamelotFields"
                @click="showComments = !showComments">
                <template v-if="showComments">
                    {{ $t('worksheet.actions.hide_concerns') }}
                </template>
                <template v-else>
                    {{ $t('worksheet.actions.show_concerns') }}
                </template>
            </b-button>
        </div>
        <!-- #416: sin d-print-none: el PDF también tiene que decir que la tabla está filtrada. -->
        <p v-if="filteredNote" class="small font-italic mb-2" data-testid="filtered-view-note">{{ filteredNote }}</p>
        <table class="table table-bordered table-striped table-responsive">
            <!-- Primera fila de cabecera -->
            <thead>
                <tr>
                    <th rowspan="2">{{ $t('camelot.step_three.authors_label') }}</th>
                    <th
                        v-for="header in unifiedHeaders"
                        :key="header.key"
                        :colspan="header.colspan">
                        {{ header.label }}
                    </th>
                </tr>
                <!-- Second header row: CAMELOT options, and "Extracted data" under each custom column -->
                <tr v-if="subHeaders.length > 0">
                    <th v-for="subHeader in subHeaders" :key="subHeader.key" class="text-nowrap">{{ subHeader.label }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="item in charsOfStudies.items" :key="item.ref_id">
                    <!-- Authors, Year -->
                    <td>{{ formatAuthorsYear(item) }}</td>

                    <!-- Unified Cells -->
                    <td v-for="(cell, cellIndex) in dataCells(item)" :key="cellIndex">
                        <truncated-cell :text="cell.value" />
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import { camelotMixin } from '@/mixins/camelotMixin'
import TableColumnFilter from '@/components/common/TableColumnFilter.vue'
import { characteristicsColumns } from '@/utils/characteristicsColumns'
import { filteredViewNote } from '@/utils/filteredViewNote'
import TruncatedCell from '@/components/common/TruncatedCell.vue'

export default {
  name: 'CharacteristicsTable',
  mixins: [camelotMixin],
  components: {
    'truncated-cell': TruncatedCell,
    'table-column-filter': TableColumnFilter
  },
  props: {
    charsOfStudies: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      showComments: false,
      // Se guardan las ocultas y no las visibles: una columna que aparece después entra visible sola.
      hiddenColumnKeys: []
    }
  },
  computed: {
    // Una sola regla para la pantalla y los exportables (utils/characteristicsColumns).
    columns () {
      return characteristicsColumns({
        fields: this.charsOfStudies.fields,
        categories: this.camelot && this.camelot.categories,
        view: { hiddenColumnKeys: this.hiddenColumnKeys, showComments: this.showComments },
        labels: {
          extractedData: this.$t('camelot.step_four.camelot_mixin.extracted_data'),
          comments: this.$t('camelot.step_three.concerns_label') || 'Comments'
        }
      })
    },
    unifiedHeaders () {
      return this.columns.headers
    },
    filterableColumns () {
      return this.columns.filterable
    },
    visibleColumnKeys: {
      get () {
        return this.unifiedHeaders.map(h => h.key)
      },
      set (visibleKeys) {
        this.hiddenColumnKeys = this.columns.filterable.map(h => h.key).filter(k => !visibleKeys.includes(k))
      }
    },
    subHeaders () {
      return this.columns.subHeaders
    },
    /** Lo que la tabla está mostrando, para quien exporta. */
    view () {
      return { hiddenColumnKeys: [...this.hiddenColumnKeys], showComments: this.showComments }
    },
    hasVisibleCamelotFields () {
      return this.columns.hasVisibleCamelot
    },
    filteredNote () {
      return filteredViewNote({ hiddenLabels: this.columns.hiddenLabels }, (k, p) => this.$t(k, p))
    }
  },
  watch: {
    // #416: el Word de la worksheet sigue este filtro (el PDF ya lo sigue: imprime la pantalla).
    view: {
      handler (view) { this.$emit('view-change', view) },
      immediate: true
    }
  },
  methods: {
    formatAuthorsYear (item) {
      // `authors` already embeds the publication year (Commons.parseReference appends it),
      // so appending item.year here would duplicate it, e.g. "Chen 2021; 2021".
      return (item.authors || '').trim()
    },
    dataCells (item) {
      return this.columns.cellKeys.map(key => ({ key, value: item[key] || '' }))
    }
  }
}
</script>

<style scoped>
.table {
    width: 100%;
    margin-bottom: 1rem;
    background-color: transparent;
}

.table th,
.table td {
    padding: 0.75rem;
    vertical-align: top;
    border-top: 1px solid #dee2e6;
}

.table thead th {
    vertical-align: bottom;
    border-bottom: 2px solid #dee2e6;
    background-color: #f8f9fa;
    font-weight: bold;
}

.table-bordered {
    border: 1px solid #dee2e6;
}

.table-bordered th,
.table-bordered td {
    border: 1px solid #dee2e6;
}

.table-striped tbody tr:nth-of-type(odd) {
    background-color: rgba(0, 0, 0, 0.05);
}
</style>
