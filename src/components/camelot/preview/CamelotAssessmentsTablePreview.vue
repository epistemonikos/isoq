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

        <!-- FA 1-4 -->
        <template v-slot:cell(fa1)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(0, 0, data.item)]"
              :style="getCircleStyle(0, 0, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa2)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(0, 1, data.item)]"
              :style="getCircleStyle(0, 1, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa3)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(0, 2, data.item)]"
              :style="getCircleStyle(0, 2, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa4)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(0, 3, data.item)]"
              :style="getCircleStyle(0, 3, data.item)"></div>
          </div>
        </template>

        <!-- FA 5-8 -->
        <template v-slot:cell(fa5)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(1, 0, data.item)]"
              :style="getCircleStyle(1, 0, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa6)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(1, 1, data.item)]"
              :style="getCircleStyle(1, 1, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa7)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(1, 2, data.item)]"
              :style="getCircleStyle(1, 2, data.item)"></div>
          </div>
        </template>
        <template v-slot:cell(fa8)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(1, 3, data.item)]"
              :style="getCircleStyle(1, 3, data.item)"></div>
          </div>
        </template>

        <!-- FA 9 -->
        <template v-slot:cell(fa9)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(2, 0, data.item)]"
              :style="getCircleStyle(2, 0, data.item)"></div>
          </div>
        </template>

        <!-- OA -->
        <template v-slot:cell(oa)="data">
          <div class="d-flex justify-content-center">
            <div :class="['assessment-circle', getCircleClass(3, 0, data.item)]"
              :style="getCircleStyle(3, 0, data.item)"></div>
          </div>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
import camelotCircleMixin from '@/mixins/camelotCircleMixin'
import Commons from '@/utils/commons'

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
  data() {
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
        { key: 'authors', label: 'Fit assessments', thClass: headerClass, tdClass: 'border-right' },
        // Group 1
        { key: 'fa1', label: 'FA 1', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa2', label: 'FA 2', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa3', label: 'FA 3', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa4', label: 'FA 4', thClass: `${headerClass} border-right`, tdClass: 'border-right assessment-col' },
        // Group 2
        { key: 'fa5', label: 'FA 5', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa6', label: 'FA 6', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa7', label: 'FA 7', thClass: headerClass, tdClass: 'assessment-col' },
        { key: 'fa8', label: 'FA 8', thClass: `${headerClass} border-right`, tdClass: 'border-right assessment-col' },
        // Group 3
        { key: 'fa9', label: 'FA 9', thClass: `${headerClass} border-right`, tdClass: 'border-right assessment-col' },
        // Group 4 (OA)
        { key: 'oa', label: 'OA', thClass: overallHeaderClass, tdClass: 'assessment-col' }
      ]
    }
  },
  computed: {
    tableItems() {
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
