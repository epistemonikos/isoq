<template>
  <div>
    <b-alert show variant="info" v-if="isLoading">
      {{ $t('camelot.step_four.loading') }}
    </b-alert>
    <div v-else>
      <b-table :fields="fields" :items="tableItems" bordered responsive class="camelot-table" thead-tr-class="header-second-row"
        show-empty :empty-text="$t('camelot.step_four.no_records')">
        <template v-slot:thead-top>
          <tr class="header-top-row">
            <th class="border-bottom-0">
              {{ $t('camelot.step_four.table_headers.authors') }}
            </th>
            <th colspan="4" class="text-center group-header border-left">
              {{ $t('camelot.step_four.tabs.fit_meta_design') }}
            </th>
            <th colspan="4" class="text-center group-header border-left">
              {{ $t('camelot.step_four.tabs.fit_meta_conduct') }}
            </th>
            <th colspan="1" class="text-center group-header border-left">
              {{ $t('camelot.step_four.tabs.fit_design_conduct') }}
            </th>
            <th colspan="1" class="text-center group-header border-left header-overall-group">
              {{ $t('camelot.step_four.tabs.overall') }}
            </th>
          </tr>
        </template>

        <template v-slot:cell(authors)="data">
          <span class="font-weight-bold" style="white-space: nowrap">{{ data.item.authors }}</span>
        </template>

        <!-- FA 1-9 + OA. The stage/option pair of each column comes from
             ASSESSMENT_CELLS, the same source endpoint D addresses. -->
        <template v-for="cell in assessmentCells" v-slot:[`cell(${cell.key})`]="data">
          <div class="d-flex justify-content-center" :key="cell.key">
            <div :class="['assessment-circle', getCircleClass(cell.stage, cell.option, data.item)]"
              :style="getCircleStyle(cell.stage, cell.option, data.item)"></div>
          </div>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import camelotCircleMixin from '@/mixins/camelotCircleMixin'
import Commons from '@/utils/commons'
import { ASSESSMENT_CELLS } from '@/utils/camelotAssessmentKeys'

export default {
  name: 'CamelotAssessmentsTablePreview',
  mixins: [camelotCircleMixin],
  props: {
    methodologicalTableRefs: {
      type: Object,
      required: true
    },
    references: {
      type: Array,
      default: () => []
    }
  },
  data () {
    const headerClass = 'header-second-row'
    const overallHeaderClass = 'header-overall-row'

    return {
      isLoading: false,
      responses: [
        { text: this.$t('camelot.responses.no_minimal'), value: 'A', color: '#1065AB' },
        { text: this.$t('camelot.responses.minor'), value: 'B', color: '#8EC4DE' },
        { text: this.$t('camelot.responses.moderate'), value: 'C', color: '#F6A482' },
        { text: this.$t('camelot.responses.serious'), value: 'D', color: '#B31529' },
        { text: this.$t('camelot.responses.unclear'), value: 'E', color: '#B3B3B3' }
      ],
      fields: [
        { key: 'authors', label: this.$t('camelot.step_four.fit_assessments'), thClass: headerClass, tdClass: 'border-right' },
        ...ASSESSMENT_CELLS.map((cell, index) => {
          const isOverall = cell.key === 'oa'
          // fa4, fa8 and fa9 close a visual group. OA carries no right border here,
          // unlike the editable summary table.
          const endsGroup = ['fa4', 'fa8', 'fa9'].includes(cell.key)
          return {
            key: cell.key,
            label: isOverall ? 'OA' : `FA ${index + 1}`,
            thClass: isOverall
              ? overallHeaderClass
              : (endsGroup ? `${headerClass} border-right` : headerClass),
            tdClass: endsGroup ? 'border-right assessment-col' : 'assessment-col'
          }
        })
      ]
    }
  },
  computed: {
    assessmentCells () {
      return ASSESSMENT_CELLS
    },
    tableItems () {
      // Base: assessment items, already scoped to the finding's references by the parent
      const items = (this.methodologicalTableRefs && this.methodologicalTableRefs.items)
        ? [...this.methodologicalTableRefs.items]
        : []

      // Ensure every finding reference has a row, even without saved assessment data
      const existingRefIds = new Set(items.map(item => String(item.ref_id)))
      if (this.references) {
        this.references.forEach(ref => {
          if (!existingRefIds.has(String(ref.id))) {
            items.push({
              ref_id: ref.id,
              stages: [
                { key: 0, options: Array.from({ length: 4 }, () => ({ option: null, text: '' })) },
                { key: 1, options: Array.from({ length: 4 }, () => ({ option: null, text: '' })) },
                { key: 2, options: [{ option: null, text: '' }] },
                { key: 3, options: [{ option: null, text: '' }] }
              ]
            })
          }
        })
      }

      // Enrich each row with the raw reference (needed for author/year formatting)
      return items.map(item => {
        const ref = this.references && this.references.find(r => String(r.id) === String(item.ref_id))
        if (ref) {
          return {
            ...ref,
            ...item,
            authors: Commons.parseReference(ref, true, false)
          }
        }
        return item
      })
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

.group-header {
  border-color: #dee2e6 !important;
}

.header-overall-group {
  border-color: #dee2e6 !important;
}

.header-top-row {
  background-color: #e9ecef;
}

.header-second-row {
  background-color: #f8f9fa;
  text-align: center;
}

.header-overall-row {
  background-color: #f8f9fa;
  text-align: center;
}

::v-deep .header-second-row div,
::v-deep .header-overall-row div {
  display: flex;
  justify-content: center;
}

.border-left {
  border-left: 1px solid #dee2e6 !important;
}

.border-right {
  border-right: 2px solid #dee2e6 !important;
}

.assessment-col {
  text-align: center;
  padding: 0.5rem 0.25rem;
}

.assessment-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

.circle-filled {
  border: none;
}

.circle-not-completed {
  border: 2px dashed #B3B3B3;
  background-color: transparent;
}
</style>
